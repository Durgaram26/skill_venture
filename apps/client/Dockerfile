# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/
COPY apps/client/package.json apps/client/
RUN npm install --workspace=@skillventures/shared-types --workspace=@skillventures/client --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/apps/client/node_modules ./apps/client/node_modules
COPY package.json tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY apps/client apps/client
RUN npm run build -w @skillventures/shared-types && npm run build -w @skillventures/client

FROM nginx:1.27-alpine AS runner
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
