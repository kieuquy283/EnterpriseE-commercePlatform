FROM node:22.22.0-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build --workspace=@dtc/backend
# RDS certificates are public trust material. Verify the download at build time.
RUN node -e "fetch('https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem').then(async r => { if (!r.ok) throw new Error('RDS CA download failed'); const pem = await r.text(); if (!pem.includes('BEGIN CERTIFICATE')) throw new Error('Invalid RDS CA bundle'); require('node:fs').writeFileSync('/app/rds-ca.pem', pem) }).catch(e => { console.error(e.message); process.exit(1) })"
ENV NODE_EXTRA_CA_CERTS=/app/rds-ca.pem
ENV NODE_ENV=production
EXPOSE 9000
CMD ["npm", "run", "start", "--workspace=@dtc/backend"]
