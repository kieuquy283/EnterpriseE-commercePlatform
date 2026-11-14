"""Create one COD test order in an explicitly approved seeded demo environment."""

import argparse
import datetime
import json
import os
from pathlib import Path
import sys
import urllib.request
from urllib.parse import urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--create-demo-order", action="store_true", required=True)
    args = parser.parse_args()
    origin = urlsplit(args.api)
    if origin.username or origin.password or origin.query or origin.fragment or origin.path not in ("", "/"):
        parser.error("Supply an API origin without credentials or a path")
    if origin.scheme != "https" and not (origin.scheme == "http" and origin.hostname in ("localhost", "127.0.0.1")):
        parser.error("Use HTTPS or loopback HTTP")
    key = os.environ.get("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "")
    if not key.startswith("pk_") or key in ("pk_bootstrap", "pk_set_after_seed"):
        parser.error("Export the seeded storefront publishable key")
    report = {"timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "scope": "one guest COD demo order; consumes one inventory unit", "status": "FAIL"}
    step = "regions"

    def request(method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(args.api.rstrip("/") + path, data=data, method=method,
                                     headers={"x-publishable-api-key": key, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)

    try:
        region = next(r for r in request("GET", "/store/regions")["regions"] if r["name"] == "Vietnam")
        step = "product"
        product = request("GET", "/store/products?handle=ao-thun-essential&region_id=" + region["id"])["products"][0]
        variant = product["variants"][0]
        step = "create_cart"
        cart = request("POST", "/store/carts", {"region_id": region["id"]})["cart"]
        report["cart_id"] = cart["id"]
        cart_path = "/store/carts/" + cart["id"]
        step = "line_item"
        request("POST", cart_path + "/line-items", {"variant_id": variant["id"], "quantity": 1})
        step = "address"
        address = {"first_name": "Smoke", "last_name": "Test", "address_1": "1 Test Street",
                   "city": "Ho Chi Minh City", "postal_code": "700000", "country_code": "vn", "phone": "+84900000000"}
        request("POST", cart_path, {"email": "smoke-" + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S") + "@example.test",
                                   "shipping_address": address, "billing_address": address})
        step = "shipping"
        shipping = request("GET", "/store/shipping-options?cart_id=" + cart["id"])["shipping_options"][0]
        request("POST", cart_path + "/shipping-methods", {"option_id": shipping["id"]})
        step = "payment"
        providers = request("GET", "/store/payment-providers?region_id=" + region["id"])["payment_providers"]
        if not any(p["id"] == "pp_system_default" for p in providers):
            raise ValueError("COD provider unavailable")
        collection = request("POST", "/store/payment-collections", {"cart_id": cart["id"]})["payment_collection"]
        request("POST", "/store/payment-collections/" + collection["id"] + "/payment-sessions", {"provider_id": "pp_system_default"})
        step = "complete"
        completed = request("POST", cart_path + "/complete", {})
        if completed.get("type") != "order" or not completed.get("order", {}).get("id"):
            raise ValueError("Completion did not return an order")
        report.update(status="PASS", order_id=completed["order"]["id"], product_handle=product["handle"])
    except Exception as error:
        report.update(failed_step=step, error=type(error).__name__)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))
    return int(report["status"] != "PASS")


if __name__ == "__main__":
    sys.exit(main())
