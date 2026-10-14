FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build --workspace=@dtc/backend
EXPOSE 9000
CMD ["npm", "run", "start", "--workspace=@dtc/backend"]
