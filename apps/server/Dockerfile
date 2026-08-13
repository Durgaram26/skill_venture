# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY apps/server apps/server

RUN npm ci --workspace=@skillventures/shared-types --workspace=@skillventures/server --include-workspace-root
RUN npm run build -w @skillventures/shared-types && npm run build -w @skillventures/server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/dist ./apps/server/dist

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
