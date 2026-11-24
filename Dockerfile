# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------- dependencies (production only)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# ** Chromium comes from Debian in the runtime image, so skip Puppeteer's own ~170 MB download
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund

# ---------------------------------------------------------------- runtime
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=8000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ** chromium renders the PDFs (certificates, invoices, sheets); fonts cover the ₹ sign and the templates' serif/sans faces;
# ** tini forwards signals to node and reaps chromium child processes
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-dejavu-core tini ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8000) + '/pingme').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
# ** api by default; run the queue workers separately with: node src/worker.js (and RUN_WORKERS_IN_PROCESS=false on the api)
CMD ["node", "src/server.js"]
