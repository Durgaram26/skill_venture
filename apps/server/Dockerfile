# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/
COPY apps/server/package.json apps/server/
RUN npm install --workspace=@skillventures/shared-types --workspace=@skillventures/server --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY package.json tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY apps/server apps/server
RUN npm run build -w @skillventures/shared-types && npm run build -w @skillventures/server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules
EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
