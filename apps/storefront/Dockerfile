FROM node:24.22.1-alpine3.24@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
# Apply distribution security fixes; keep Node pinned to the project runtime.
RUN apk upgrade --no-cache
WORKDIR /app
RUN --mount=type=cache,id=daymark-npm-alpine,target=/root/.npm,sharing=locked npm install --global npm@11.12.1 --no-audit --no-fund \
    && test "$(npm --version)" = "11.12.1"
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY presentation/package.json presentation/package.json
RUN --mount=type=cache,id=daymark-npm-alpine,target=/root/.npm,sharing=locked npm ci --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=false
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_ENABLE_RECOMMENDATIONS=$NEXT_PUBLIC_ENABLE_RECOMMENDATIONS
RUN npm run build --workspace=@dtc/storefront
# Global package managers are not needed by the deployed Node processes.
RUN rm -rf /usr/local/lib/node_modules/npm /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production
EXPOSE 8000
WORKDIR /app/apps/storefront
CMD ["node", "../../node_modules/next/dist/bin/next", "start", "-p", "8000"]
