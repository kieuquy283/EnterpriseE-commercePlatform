#!/usr/bin/env bash
set -euo pipefail
# This script writes fixtures only to GitHub job services, never a developer DB.
[[ "${GITHUB_ACTIONS:-}" == true && "${RUNNER_ENVIRONMENT:-}" == github-hosted ]]
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ && "${GITHUB_RUN_ATTEMPT:-}" =~ ^[0-9]+$ ]]
export CI_CONTAINER_PREFIX="daymark-ci-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
backend_image="daymark-backend:${GITHUB_SHA}"
storefront_image="daymark-storefront:${GITHUB_SHA}"
fixture_dir=$(mktemp -d "${RUNNER_TEMP}/daymark-ci.XXXXXX")
# Only synthetic CI configuration is written; no inherited .env or cloud settings.
cat > "$fixture_dir/runtime" <<'CONFIG'
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recommendation_test?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=disposable-ci-jwt
COOKIE_SECRET=disposable-ci-cookie
ALLOW_INSECURE_LOCAL_SESSION_COOKIE=true
DAYMARK_LOCAL_IMAGE_BACKEND_URL=http://localhost:9000
DAYMARK_CATALOG_WRITE=1
DAYMARK_CATALOG_ENVIRONMENT=local-disposable
DAYMARK_CATALOG_ASSET_DIR=/app/apps/backend/assets/daymark-catalog
ENABLE_RECOMMENDATIONS=false
CONFIG
chmod 600 "$fixture_dir/runtime"
mkdir "$fixture_dir/static"
chmod 777 "$fixture_dir/static" # Disposable local provider writes as the image user.
cleanup() {
  result=$?
  trap - EXIT
  for role in backend worker storefront seed cli; do
    if docker container inspect "$CI_CONTAINER_PREFIX-$role" >/dev/null 2>&1; then
      node scripts/ci-run.mjs "container-$role" docker logs --tail=200 "$CI_CONTAINER_PREFIX-$role" || true
      docker rm -f "$CI_CONTAINER_PREFIX-$role" >/dev/null || true
    fi
  done
  if docker image inspect "$backend_image" >/dev/null 2>&1; then
    docker run --rm -v "$fixture_dir/static:/ci-static" "$backend_image" \
      node -e 'require("node:fs").chmodSync("/ci-static", 0o777); for (const name of require("node:fs").readdirSync("/ci-static")) require("node:fs").rmSync(require("node:path").join("/ci-static", name), { recursive: true, force: true })' >/dev/null || true
  fi
  rm -rf "$fixture_dir"
  exit "$result"
}
trap cleanup EXIT
run_cli() {
  docker run --rm --name "$CI_CONTAINER_PREFIX-cli" --network host --env-file "$fixture_dir/runtime" \
    -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" \
    -w /app/apps/backend/.medusa/server "$backend_image" \
    node ../../../../node_modules/@medusajs/cli/cli.js "$@"
}
node scripts/ci-run.mjs backend-image docker build -f apps/backend/Dockerfile -t "$backend_image" .
sha256sum package-lock.json apps/backend/src/scripts/seed-recommendation-test.ts \
  apps/backend/src/scripts/seed-commerce.ts apps/backend/src/scripts/daymark-catalog/fixture.ts \
  apps/backend/assets/daymark-catalog/manifest.json > ci-evidence/fixture-checksums.txt
run_cli db:migrate
# Existing synthetic fixture also creates the shipping profile needed by seed-commerce.
# Its context stays inside a disposable container; copy only the public storefront key.
seed_container="$CI_CONTAINER_PREFIX-seed"
# --rm is deliberately omitted so the existing fixture context can be copied.
docker create --name "$seed_container" --network host --env-file "$fixture_dir/runtime" \
  -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" \
  -w /app/apps/backend/.medusa/server "$backend_image" \
  node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-recommendation-test.js >/dev/null
seed_result=0
docker start -a "$seed_container" || seed_result=$?
if [[ "$seed_result" == 0 ]]; then
  seed_result=$(docker inspect --format '{{.State.ExitCode}}' "$seed_container")
fi
if [[ "$seed_result" == 0 ]]; then
  docker cp "$seed_container:/tmp/recommendation-test-context.json" "$fixture_dir/context.json"
fi
docker rm -f "$seed_container" >/dev/null
[[ "$seed_result" == 0 ]]
export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1])).publishable_key)' "$fixture_dir/context.json")
run_cli exec ./src/scripts/seed-daymark-catalog.js -- --apply --images demo
for role in backend worker; do
  mode=server
  [[ "$role" == worker ]] && mode=worker
  network_args=(--network host)
  if [[ "$role" == worker ]]; then
    network_args=(--network bridge --add-host host.docker.internal:host-gateway
      -e "DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/recommendation_test?sslmode=disable"
      -e REDIS_URL=redis://host.docker.internal:6379)
  fi
  docker run -d --name "$CI_CONTAINER_PREFIX-$role" \
    --env-file "$fixture_dir/runtime" "${network_args[@]}" -e "WORKER_MODE=$mode" \
    -e "ADMIN_DISABLED=$([[ "$role" == worker ]] && echo true || echo false)" \
    -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" -w /app/apps/backend/.medusa/server "$backend_image" \
    node ../../../../node_modules/@medusajs/cli/cli.js start >/dev/null
done
node scripts/ci-wait.mjs http://localhost:9000/health
node scripts/ci-run.mjs storefront-image docker build --network host -f apps/storefront/Dockerfile \
  --build-arg "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000 -t "$storefront_image" .
docker run -d --name "$CI_CONTAINER_PREFIX-storefront" --network host \
  -e MEDUSA_BACKEND_URL=http://localhost:9000 \
  -e "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:8000 "$storefront_image" >/dev/null
node scripts/ci-wait.mjs http://localhost:8000/vn
sleep 5 # Give a worker startup failure time to become observable.
node scripts/ci-run.mjs container-smoke node scripts/ci-container-smoke.mjs
# Record image content IDs; local builds have no registry RepoDigest until pushed.
docker image inspect --format '{{.Id}}' "$backend_image" "$storefront_image" > ci-evidence/image-ids.txt
export PLAYWRIGHT_BASE_URL=http://localhost:8000
export PLAYWRIGHT_JUNIT_OUTPUT_FILE=../../ci-evidence/playwright.xml
node scripts/ci-run.mjs playwright npm run test:e2e --workspace=@dtc/storefront -- --reporter=list,html,junit
