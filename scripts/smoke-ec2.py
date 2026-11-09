"""Read-only EC2 Compose checks. Writes a timestamped JSON report without secrets."""

import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
from urllib.parse import urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", required=True, help="Public HTTPS API origin")
    parser.add_argument("--store", required=True, help="Public HTTPS storefront origin")
    parser.add_argument("--country", default="vn")
    parser.add_argument("--compose", action="store_true", help="Also check containers on this host")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    for origin in (args.api, args.store):
        parsed = urlsplit(origin)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username
                or parsed.password or parsed.path not in ("", "/")
                or parsed.query or parsed.fragment):
            parser.error("Use HTTPS origins without credentials, paths or query strings")
    key = os.environ.get("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "")
    if not key.startswith("pk_") or key in ("pk_bootstrap", "pk_set_after_seed"):
        parser.error("Export the seeded NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")

    results = []

    def check(name, action):
        try:
            action()
            results.append({"check": name, "status": "PASS"})
        except Exception as error:
            # Do not persist response bodies, command output, URLs or credentials.
            results.append({"check": name, "status": "FAIL", "error": type(error).__name__})
        print(f"{results[-1]['status']} {name}")

    def http(origin, path, field=None, headers=None, json_response=False):
        request = urllib.request.Request(origin.rstrip("/") + path, headers=headers or {})
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200 or urlsplit(response.url).scheme != "https":
                raise ValueError("Unexpected HTTP status or insecure redirect")
            if json_response or field:
                body = json.load(response)
                if field and not body.get(field):
                    raise ValueError("Expected non-empty response field")
            elif "text/html" not in response.headers.get("Content-Type", ""):
                raise ValueError("Expected rendered HTML")

    headers = {"x-publishable-api-key": key}
    check("api_https_health", lambda: api_health(args.api))
    check("storefront_https_health", lambda: http(args.store, "/health", json_response=True))
    check("regions_with_publishable_key", lambda: http(args.api, "/store/regions", "regions", headers))
    check("seeded_product_catalog", lambda: http(args.api, "/store/products?limit=1", "products", headers))
    check("rendered_storefront", lambda: http(args.store, f"/{args.country}"))

    if args.compose:
        root = Path(__file__).resolve().parents[1]
        compose = ["docker", "compose", "-f", "docker-compose.yml", "-f", "deploy/compose.prod.yml"]

        def command(*parts, expected=None):
            result = subprocess.run(compose + list(parts), cwd=root, check=True,
                                    capture_output=True, text=True, timeout=60)
            if expected and expected not in result.stdout:
                raise ValueError("Expected response missing")

        check("postgres_query", lambda: command("exec", "-T", "postgres", "psql", "-U", "commerce",
              "-d", "commerce", "-Atc", "SELECT 1", expected="1"))
        check("redis_ping", lambda: command("exec", "-T", "redis", "redis-cli", "ping", expected="PONG"))
        for service in ("backend", "worker"):
            for host, port in (("postgres", 5432), ("redis", 6379)):
                code = ("const s=require('node:net').connect(" + str(port) + ", '" + host + "');"
                        "s.setTimeout(5000);s.on('connect',()=>{s.end();process.exit(0)});"
                        "s.on('timeout',()=>process.exit(1));s.on('error',()=>process.exit(1))")
                check(f"{service}_to_{host}_tcp", lambda s=service, c=code:
                      command("exec", "-T", s, "node", "-e", c))
        check("storefront_to_backend_catalog", lambda: command("exec", "-T", "storefront", "node", "-e",
              "fetch(process.env.MEDUSA_BACKEND_URL+'/store/products?limit=1',"
              "{headers:{'x-publishable-api-key':process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY}})"
              ".then(async r=>{const b=await r.json();process.exit(r.ok&&b.products?.length?0:1)})"
              ".catch(()=>process.exit(1))"))

    report = {"timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "scope": "read-only smoke; checkout and recovery not exercised", "results": results}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    return int(any(result["status"] == "FAIL" for result in results))


def api_health(origin):
    with urllib.request.urlopen(origin.rstrip("/") + "/health", timeout=30) as response:
        if response.status != 200 or urlsplit(response.url).scheme != "https":
            raise ValueError("API health failed")


if __name__ == "__main__":
    sys.exit(main())
