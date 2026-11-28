#!/usr/bin/env bash
set -euo pipefail
# Writes only to this run's private Docker network and disposable database.
[[ "${GITHUB_ACTIONS:-}" == true && "${RUNNER_ENVIRONMENT:-}" == github-hosted ]]
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ && "${GITHUB_RUN_ATTEMPT:-}" =~ ^[0-9]+$ ]]
export CI_CONTAINER_PREFIX="daymark-ci-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
backend_image="daymark-backend:${GITHUB_SHA}"
storefront_image="daymark-storefront:${GITHUB_SHA}"
fixture_dir=$(mktemp -d "${RUNNER_TEMP}/daymark-ci.XXXXXX")
network="$CI_CONTAINER_PREFIX-network"
mkdir -p ci-evidence "$fixture_dir/static"
chmod 777 "$fixture_dir/static"
cleanup() {
  result=$?
  trap - EXIT
  while read -r id; do
    [[ -n "$id" ]] || continue
    node scripts/ci-run.mjs "container-$id" docker logs --tail=200 "$id" || true
    docker rm -f "$id" >/dev/null || true
  done < <(docker ps -aq --filter "label=daymark.ci.run=$CI_CONTAINER_PREFIX")
  docker network rm "$network" >/dev/null 2>&1 || true
  docker volume rm "$CI_CONTAINER_PREFIX-mailpit" >/dev/null 2>&1 || true
  if docker image inspect "$backend_image" >/dev/null 2>&1; then
    docker run --rm -v "$fixture_dir/static:/ci-static" "$backend_image" \
      node -e 'require("node:fs").chmodSync("/ci-static", 0o777); for (const name of require("node:fs").readdirSync("/ci-static")) require("node:fs").rmSync(require("node:path").join("/ci-static", name), { recursive: true, force: true })' >/dev/null || true
  fi
  rm -rf "$fixture_dir"
  exit "$result"
}
trap cleanup EXIT
cat > "$fixture_dir/runtime" <<'CONFIG'
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recommendation_test?sslmode=disable
REDIS_URL=redis://redis:6379
ALLOW_INSECURE_LOCAL_SESSION_COOKIE=true
DAYMARK_LOCAL_IMAGE_BACKEND_URL=http://localhost:9000
DAYMARK_CATALOG_WRITE=1
DAYMARK_CATALOG_ENVIRONMENT=local-disposable
DAYMARK_CATALOG_ASSET_DIR=/app/apps/backend/assets/daymark-catalog
ENABLE_RECOMMENDATIONS=false
NOTIFICATION_TRANSPORT=smtp
NOTIFICATION_SMTP_HOST=mailpit
NOTIFICATION_SMTP_PORT=1025
NOTIFICATION_SMTP_FROM=ci-daymark@example.invalid
DAYMARK_OPERATIONS_TEST=true
CONFIG
chmod 600 "$fixture_dir/runtime"
node --input-type=module - "$fixture_dir" <<'JS'
import { randomBytes } from "node:crypto"
import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
const directory = process.argv[2]
const credentials = { email: "ci-admin@example.invalid", password: randomBytes(32).toString("hex") }
appendFileSync(`${directory}/runtime`, `JWT_SECRET=${randomBytes(32).toString("hex")}\nCOOKIE_SECRET=${randomBytes(32).toString("hex")}\n`)
writeFileSync(`${directory}/admin.json`, JSON.stringify(credentials), { mode: 0o600 })
writeFileSync(`${directory}/admin-runtime`, readFileSync(`${directory}/runtime`, "utf8") + `
DAYMARK_BOOTSTRAP_ADMIN_WRITE=1
DAYMARK_BOOTSTRAP_DB_HOST=localhost
DAYMARK_BOOTSTRAP_DB_NAME=recommendation_test
DAYMARK_BOOTSTRAP_ADMIN_EMAIL=${credentials.email}
DAYMARK_BOOTSTRAP_ADMIN_PASSWORD=${credentials.password}
`, { mode: 0o600 })
JS
label=(--label "daymark.ci.run=$CI_CONTAINER_PREFIX")
docker network create "$network" >/dev/null
docker run -d --name "$CI_CONTAINER_PREFIX-postgres" "${label[@]}" --network "$network" --network-alias postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=recommendation_test \
  --tmpfs /var/lib/postgresql/data postgres:16-alpine >/dev/null
docker run -d --name "$CI_CONTAINER_PREFIX-redis" "${label[@]}" --network "$network" --network-alias redis redis:7-alpine >/dev/null
docker run -d --name "$CI_CONTAINER_PREFIX-mailpit" "${label[@]}" --network "$network" --network-alias mailpit \
  -p 127.0.0.1:8025:8025 -v "$CI_CONTAINER_PREFIX-mailpit:/data" -e MP_DATABASE=/data/mailpit.db \
  axllent/mailpit@sha256:23a2ef85bc50853ab3093645d1d64679afd8887e89da5e48a88940c172591a4e >/dev/null
for ((attempt=0; attempt<30; attempt++)); do
  if docker exec "$CI_CONTAINER_PREFIX-postgres" pg_isready -U postgres -d recommendation_test >/dev/null 2>&1; then break; fi
  sleep 2
done
run_cli() {
  # Share only PostgreSQL's namespace so importer localhost safety guards stay intact.
  docker run --rm --name "$CI_CONTAINER_PREFIX-cli" "${label[@]}" --network "container:$CI_CONTAINER_PREFIX-postgres" \
    --env-file "$fixture_dir/runtime" -v "$fixture_dir:/ci-private" \
    -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" \
    -w /app/apps/backend/.medusa/server "$backend_image" \
    node ../../../../node_modules/@medusajs/cli/cli.js "$@"
}
node scripts/ci-run.mjs backend-image docker build -f apps/backend/Dockerfile -t "$backend_image" .
sha256sum package-lock.json apps/backend/src/scripts/seed-recommendation-test.ts \
  apps/backend/src/scripts/seed-commerce.ts apps/backend/src/scripts/daymark-catalog/fixture.ts \
  apps/backend/assets/daymark-catalog/manifest.json > ci-evidence/fixture-checksums.txt
run_cli db:migrate
# Only this seed's public key leaves its private container context.
seed_container="$CI_CONTAINER_PREFIX-seed"
docker create --name "$seed_container" "${label[@]}" --network "container:$CI_CONTAINER_PREFIX-postgres" \
  --env-file "$fixture_dir/runtime" -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" \
  "$backend_image" node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-recommendation-test.js >/dev/null
docker start -a "$seed_container"
[[ $(docker inspect --format '{{.State.ExitCode}}' "$seed_container") == 0 ]]
docker cp "$seed_container:/tmp/recommendation-test-context.json" "$fixture_dir/context.json"
docker rm -f "$seed_container" >/dev/null
export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1])).publishable_key)' "$fixture_dir/context.json")
run_cli exec ./src/scripts/seed-daymark-catalog.js -- --apply --images demo
docker run --rm --name "$CI_CONTAINER_PREFIX-cli" "${label[@]}" --network "container:$CI_CONTAINER_PREFIX-postgres" \
  --env-file "$fixture_dir/admin-runtime" "$backend_image" \
  node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/bootstrap-preview-admin.js
# Precreate outputs as the runner: container root must not own 0600 files read by the host.
# writeFileSync truncates these existing files without changing their owner or mode.
install -m 600 /dev/null "$fixture_dir/notification.json"
for role in backend worker; do
  mode=server
  [[ "$role" == worker ]] && mode=worker
  ports=()
  [[ "$role" != backend ]] || ports=(-p 127.0.0.1:9000:9000)
  docker run -d --name "$CI_CONTAINER_PREFIX-$role" "${label[@]}" --network "$network" --network-alias "$role" "${ports[@]}" \
    --env-file "$fixture_dir/runtime" -e DATABASE_URL='postgresql://postgres:postgres@postgres:5432/recommendation_test?sslmode=disable' \
    -e "WORKER_MODE=$mode" -e "ADMIN_DISABLED=$([[ "$role" == worker ]] && echo true || echo false)" \
    -v "$fixture_dir/static:/app/apps/backend/.medusa/server/static" "$backend_image" >/dev/null
done
node scripts/ci-wait.mjs http://localhost:9000/health
export CI_ADMIN_CREDENTIALS_FILE="$fixture_dir/admin.json"
node scripts/ci-admin-smoke.mjs
backend_ip=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CI_CONTAINER_PREFIX-backend")
node scripts/ci-run.mjs storefront-image docker build --network host -f apps/storefront/Dockerfile \
  --build-arg "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000 \
  --build-arg "MEDUSA_BACKEND_URL=http://$backend_ip:9000" -t "$storefront_image" .
docker run -d --name "$CI_CONTAINER_PREFIX-storefront" "${label[@]}" --network "$network" \
  -p 127.0.0.1:8000:8000 -e MEDUSA_BACKEND_URL=http://backend:9000 \
  -e "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:8000 "$storefront_image" >/dev/null
node scripts/ci-wait.mjs http://localhost:8000/vn
node scripts/ci-run.mjs container-smoke node scripts/ci-container-smoke.mjs
export CI_OPERATIONS_FIXTURE_DIR="$fixture_dir"
node scripts/ci-operations-e2e.mjs
docker image inspect --format '{{.Id}}' "$backend_image" "$storefront_image" > ci-evidence/image-ids.txt
export PLAYWRIGHT_BASE_URL=http://localhost:8000
export PLAYWRIGHT_JUNIT_OUTPUT_FILE=../../ci-evidence/playwright.xml
node scripts/ci-run.mjs playwright npm run test:e2e --workspace=@dtc/storefront -- --reporter=list,html,junit
