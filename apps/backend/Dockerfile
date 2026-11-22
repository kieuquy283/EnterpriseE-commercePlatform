FROM node:24.22.1-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
# Apply distribution security fixes; keep Node pinned to the project runtime.
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY presentation/package.json presentation/package.json
RUN --mount=type=cache,id=daymark-npm-alpine,target=/root/.npm,sharing=locked npm ci --no-audit --no-fund
COPY . .
RUN npm run build --workspace=@dtc/backend
# RDS certificates are public trust material. Verify the download at build time.
RUN node -e "fetch('https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem').then(async r => { if (!r.ok) throw new Error('RDS CA download failed'); const pem = await r.text(); if (!pem.includes('BEGIN CERTIFICATE')) throw new Error('Invalid RDS CA bundle'); require('node:fs').writeFileSync('/app/rds-ca.pem', pem) }).catch(e => { console.error(e.message); process.exit(1) })"
ENV NODE_EXTRA_CA_CERTS=/app/rds-ca.pem
ENV NODE_PATH=/app/apps/backend/node_modules:/app/node_modules
# Global package managers are not needed by the deployed Node processes.
RUN rm -rf /usr/local/lib/node_modules/npm /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production
EXPOSE 9000
WORKDIR /app/apps/backend/.medusa/server
CMD ["node", "../../../../node_modules/@medusajs/cli/cli.js", "start"]
