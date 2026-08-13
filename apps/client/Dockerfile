# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY apps/client apps/client

RUN npm ci --workspace=@skillventures/shared-types --workspace=@skillventures/client --include-workspace-root
RUN npm run build -w @skillventures/shared-types && npm run build -w @skillventures/client

FROM nginx:1.27-alpine AS runner
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
