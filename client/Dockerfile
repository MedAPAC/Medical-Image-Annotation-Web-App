# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS build

WORKDIR /app
ENV GENERATE_SOURCEMAP=false
ARG REACT_APP_API_BASE_URL=
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY public ./public
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31.4-alpine

ENV API_UPSTREAM=http://server:5000 \
    NGINX_ENVSUBST_FILTER=API_UPSTREAM

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
