FROM node:22.22.0-bookworm-slim
WORKDIR /app
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build --workspace=@dtc/storefront
ENV NODE_ENV=production
EXPOSE 8000
CMD ["npm", "run", "start", "--workspace=@dtc/storefront"]
