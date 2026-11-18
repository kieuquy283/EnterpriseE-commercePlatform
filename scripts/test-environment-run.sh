#!/usr/bin/env bash
# OPS-01: fresh services and env-free source copies; no shared database targets.
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
# Explicit allowlist: never inherit database, cloud, token or provider settings.
if [[ ${1:-} != --isolated ]]; then
  # Preserve only a local Unix socket for rootless Docker; reject remote daemons.
  docker_socket=${DOCKER_HOST:-unix:///var/run/docker.sock}
  [[ $docker_socket == unix:///* ]] || { echo 'Requires a local Docker Unix socket'; exit 2; }
  exec env -i PATH="$PATH" HOME="$HOME" LANG=C.UTF-8 DOCKER_HOST="$docker_socket" \
    bash "$root/scripts/test-environment-run.sh" --isolated "${1:-smoke}"
fi
shift
mode=${1:-smoke}
[[ $mode == smoke || $mode == serve || $mode == catalog || $mode == http ]] || { echo 'Usage: test-environment-run.sh [smoke|serve|catalog|http]'; exit 2; }
[[ $(node --version) == v24.22.1 && $(npm --version) == 11.12.1 ]] || {
  echo 'Requires Node 24.22.1 and npm 11.12.1 (see docs/setup.md).'; exit 2;
}
for tool in docker tar setsid curl; do command -v "$tool" >/dev/null; done
docker compose version >/dev/null
[[ -d $root/node_modules ]] || { echo 'Run pinned npm ci in a clean checkout first.'; exit 2; }
umask 077
run_dir=$(mktemp -d /tmp/daymark-test-XXXXXXXXXX)
project="daymark-test-${run_dir##*-}"
project=${project,,}
mkdir -p "$run_dir/work/apps" "$run_dir/logs" "$run_dir/home"
export HOME="$run_dir/home"
# All Docker invocations specify both a new project and an explicit empty env file.
compose=(docker compose --env-file /dev/null -p "$project" -f "$root/compose.test.yaml")
pids=()
cleanup() {
  result=$?
  trap - EXIT INT TERM
  node -e 'require("fs").rmSync(process.argv[1],{force:true})' "$run_dir/logs/admin-invite.log"
  for pid in "${pids[@]}"; do kill -TERM -- "-$pid" 2>/dev/null || true; done
  for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done
  if ! "${compose[@]}" down --volumes --remove-orphans >"$run_dir/logs/cleanup.log" 2>&1; then
    echo "Cleanup failed: inspect $run_dir/logs/cleanup.log and project $project"; result=1
  fi
  echo "Exit=$result; project=$project; private artifacts=$run_dir"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
echo "Run=$project; mode=$mode; private artifacts=$run_dir"
# Do not copy env files, generated output, credentials, or old uploads from apps.
for app in backend storefront; do
  mkdir "$run_dir/work/apps/$app"
  tar -C "$root/apps/$app" --exclude='.env*' --exclude=node_modules \
    --exclude=.medusa --exclude='.next*' --exclude=.cache --exclude=dist \
    --exclude=.turbo --exclude='*.tsbuildinfo' --exclude=.npmrc --exclude='.git*' \
    --exclude=static --exclude=test-results --exclude=playwright-report \
    -cf - . | tar -C "$run_dir/work/apps/$app" -xf -
  # App-local dependency trees contain version-specific React/TypeScript packages.
  if [[ -d $root/apps/$app/node_modules ]]; then
    ln -s "$root/apps/$app/node_modules" "$run_dir/work/apps/$app/node_modules"
  fi
done
ln -s "$root/node_modules" "$run_dir/work/node_modules"
cp "$root/package.json" "$run_dir/work/package.json"
mkdir "$run_dir/work/scripts"
cp "$root/scripts/test-environment-fixture.ts" "$run_dir/work/scripts/"
backend="$run_dir/work/apps/backend"
storefront="$run_dir/work/apps/storefront"
cli="$root/node_modules/@medusajs/cli/cli.js"
step() {
  local name=$1; shift
  echo "Running $name"
  if "$@" >"$run_dir/logs/$name.log" 2>&1; then echo "PASS $name"; else
    echo "FAIL $name (inspect private log)"; return 1
  fi
}
step services "${compose[@]}" up -d --wait --wait-timeout 90
pg_port=$("${compose[@]}" port postgres 5432); pg_port=${pg_port##*:}
redis_port=$("${compose[@]}" port redis 6379); redis_port=${redis_port##*:}
export NODE_ENV=test MEDUSA_DISABLE_TELEMETRY=true NEXT_TELEMETRY_DISABLED=1
export DATABASE_URL="postgresql://daymark_test@localhost:$pg_port/daymark_test?sslmode=disable"
export REDIS_URL="redis://localhost:$redis_port"
export DB_HOST=localhost DB_PORT="$pg_port" DB_USERNAME=daymark_test DB_PASSWORD=''
export JWT_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
export COOKIE_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
export NODE_PATH="$backend/node_modules:$root/node_modules"
cd "$backend"
if [[ $mode == http ]]; then
  step http npm run test:integration:http
  exit
fi
# Allocate loopback ports; binding errors fail without touching existing listeners.
free_port() { node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})'; }
api_port=$(free_port); worker_port=$(free_port); web_port=$(free_port)
if [[ $mode == catalog ]]; then
  export DAYMARK_LOCAL_IMAGE_BACKEND_URL="http://localhost:$api_port"
  export DAYMARK_CATALOG_ASSET_DIR="$backend/assets/daymark-catalog"
  export DAYMARK_CATALOG_WRITE=1 DAYMARK_CATALOG_ENVIRONMENT=local-disposable
  export TEST_ENVIRONMENT_RUN_DIR="$run_dir"
fi
step build npm run build
step migrate node "$cli" db:migrate
step seed npm run seed
step publishable-key node "$cli" exec ./src/scripts/print-storefront-key.ts
key=$(sed -n 's/.*Storefront publishable key: \(pk_[a-zA-Z0-9_]*\).*/\1/p' "$run_dir/logs/publishable-key.log" | tail -1)
[[ -n $key ]] || { echo 'Publishable key missing'; exit 1; }
export STORE_CORS="http://localhost:$web_port" ADMIN_CORS="http://localhost:$api_port"
export AUTH_CORS="$STORE_CORS,$ADMIN_CORS"
export MEDUSA_BACKEND_URL="http://localhost:$api_port"
export NEXT_PUBLIC_MEDUSA_BACKEND_URL="$MEDUSA_BACKEND_URL"
export NEXT_PUBLIC_BASE_URL="http://localhost:$web_port" NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$key"
start() {
  local name=$1; shift
  setsid "$@" >"$run_dir/logs/$name.log" 2>&1 &
  pids+=("$!")
}
cd "$backend/.medusa/server"
if [[ $mode == catalog ]]; then
  step catalog-dry-run node "$cli" exec ./src/scripts/seed-daymark-catalog.js -- --dry-run --images demo
  step catalog-apply node "$cli" exec ./src/scripts/seed-daymark-catalog.js -- --apply --images demo
  step catalog-stock-change env TEST_ENVIRONMENT_FIXTURE_PHASE=before node "$cli" exec ../../../../scripts/test-environment-fixture.ts
  step catalog-rerun node "$cli" exec ./src/scripts/seed-daymark-catalog.js -- --apply --images demo
  step admin-invite node "$cli" user --invite -e ops-bootstrap@example.invalid
  step catalog-readback env TEST_ENVIRONMENT_FIXTURE_PHASE=after node "$cli" exec ../../../../scripts/test-environment-fixture.ts
fi
start api env WORKER_MODE=server ADMIN_DISABLED=false node "$cli" start --host 127.0.0.1 --port "$api_port"
start worker env WORKER_MODE=worker ADMIN_DISABLED=true node "$cli" start --host 127.0.0.1 --port "$worker_port"
cd "$storefront"
start storefront node "$root/node_modules/next/dist/bin/next" dev --hostname 127.0.0.1 --port "$web_port"
ready() {
  local name=$1 url=$2 pid=$3
  for ((attempt=0; attempt<90; attempt++)); do
    kill -0 "$pid" 2>/dev/null || { echo "FAIL $name exited"; return 1; }
    if curl --silent --fail --max-time 5 "$url" >"$run_dir/logs/$name-response.txt"; then
      echo "PASS $name"; return
    fi
    sleep 2
  done
  echo "FAIL $name readiness timeout"; return 1
}
ready api-health "$MEDUSA_BACKEND_URL/health" "${pids[0]}"
ready admin "$MEDUSA_BACKEND_URL/app" "${pids[0]}"
node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/src="([^" ]+\.js)"/);if(!m)process.exit(1);require("fs").writeFileSync(process.argv[2],m[1])' "$run_dir/logs/admin-response.txt" "$run_dir/logs/admin-asset-path.txt"
step admin-asset curl --silent --fail --max-time 20 -o "$run_dir/logs/admin-asset.js" "$MEDUSA_BACKEND_URL$(cat "$run_dir/logs/admin-asset-path.txt")"
ready worker-health "http://localhost:$worker_port/health" "${pids[1]}"
curl --silent --fail --max-time 20 -H "x-publishable-api-key: $key" \
  "$MEDUSA_BACKEND_URL/store/products?limit=100" >"$run_dir/logs/products.json"
curl --silent --fail --max-time 20 -H "x-publishable-api-key: $key" \
  "$MEDUSA_BACKEND_URL/store/regions" >"$run_dir/logs/regions.json"
node -e 'const r=require(process.argv[1]).regions;if(!r.some(r=>r.currency_code==="vnd"&&r.countries.some(c=>c.iso_2==="vn")))process.exit(1)' "$run_dir/logs/regions.json"
echo 'PASS Vietnam/VND region via Store API'
expected=3
[[ $mode != catalog ]] || expected=33
node -e 'const p=require(process.argv[1]);if(p.products?.length!==Number(process.argv[2]))process.exit(1)' "$run_dir/logs/products.json" "$expected"
echo "PASS fixture: $expected published products via Store API"
if [[ $mode == catalog ]]; then
  step media curl --silent --fail --max-time 20 -o "$run_dir/logs/media.jpg" "$(cat "$run_dir/logs/media-url.txt")"
fi
ready storefront "$NEXT_PUBLIC_BASE_URL/vn/store" "${pids[2]}"
echo "Local API/Admin=$MEDUSA_BACKEND_URL/app; storefront=$NEXT_PUBLIC_BASE_URL/vn/store"
echo 'Worker health is process evidence only; no job delivery or business acceptance asserted.'
if [[ $mode == serve ]]; then
  echo 'Ctrl+C stops only this run and removes its disposable services.'
  wait -n "${pids[@]}"
  echo 'An application exited unexpectedly'; exit 1
fi
