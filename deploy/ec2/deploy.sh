#!/bin/bash
set -euo pipefail
umask 077
test -f /var/lib/commerce-bootstrap-ready
: "${SOURCE_BUCKET:?Set the private staging bucket}"
: "${SOURCE_SHA256:?Set the reviewed source archive checksum}"
cd /srv/commerce
aws s3 cp "s3://${SOURCE_BUCKET}/source.tar.gz" /tmp/commerce-source.tar.gz --region ap-southeast-2 --only-show-errors
echo "${SOURCE_SHA256}  /tmp/commerce-source.tar.gz" | sha256sum --check
tar -xzf /tmp/commerce-source.tar.gz
python3 - <<'PY'
from pathlib import Path
import secrets
p = Path('.env')
if p.exists():
    print('Preserving the existing private deployment environment')
    raise SystemExit(0)
values = {
    'STORE_DOMAIN': '135791112.xyz',
    'API_DOMAIN': 'api.135791112.xyz',
    'POSTGRES_PASSWORD': secrets.token_hex(32),
    'JWT_SECRET': secrets.token_hex(32),
    'COOKIE_SECRET': secrets.token_hex(32),
    'NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY': 'pk_bootstrap',
    'LOG_LEVEL': 'info',
}
p.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
p.chmod(0o600)
PY
compose=(docker compose -f docker-compose.yml -f deploy/compose.prod.yml)
"${compose[@]}" config --quiet
"${compose[@]}" up -d postgres redis
echo 'Building backend; log: /var/log/commerce-backend-build.log'
"${compose[@]}" build backend > /var/log/commerce-backend-build.log 2>&1
echo 'Running migrations'
"${compose[@]}" run --rm migrate > /var/log/commerce-migrate.log 2>&1
echo 'Seeding demo data'
"${compose[@]}" run --rm --no-deps -w /app/apps/backend/.medusa/server backend node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-commerce.js > /var/log/commerce-seed.log 2>&1
"${compose[@]}" run --rm --no-deps -w /app/apps/backend/.medusa/server backend node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/print-storefront-key.js > /var/log/commerce-public-key.log 2>&1
python3 - <<'PY'
from pathlib import Path
import re
log = Path('/var/log/commerce-public-key.log').read_text()
match = re.search(r'Storefront publishable key: (pk_[A-Za-z0-9_]+)', log)
if not match:
    raise SystemExit('Seeded publishable key missing')
p = Path('.env')
p.write_text(p.read_text().replace('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_bootstrap', 'NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=' + match[1]))
PY
"${compose[@]}" up -d backend worker
echo 'Building storefront; log: /var/log/commerce-storefront-build.log'
"${compose[@]}" build storefront > /var/log/commerce-storefront-build.log 2>&1
"${compose[@]}" --profile app up -d --no-build --wait --wait-timeout 240
"${compose[@]}" ps
echo 'Deployment commands completed; HTTPS and checkout verification remain required'
