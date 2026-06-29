# syntax=docker/dockerfile:1.7
FROM node:26-bookworm-slim

ENV NODE_ENV=production \
    PORT=5000 \
    UPLOADS_ROOT=/app/uploads

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node index.js ./
COPY --chown=node:node src ./src

RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 5000
VOLUME /app/uploads

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e 'fetch(`http://127.0.0.1:${process.env.PORT || 5000}/api/health`).then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))'

CMD node index.js
