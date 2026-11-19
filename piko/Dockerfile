# Piko sohbet servisi: Claude Haiku ile kısa, çocuğa uygun cevaplar (bkz. piko/server.ts).
# Node 22'nin resmî imajı TypeScript türlerini çalıştırırken siler; derleme adımı yoktur.
FROM node:22-alpine
WORKDIR /app
COPY piko/package.json piko/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY piko/server.ts piko/kurallar.ts ./
ENV NODE_ENV=production PORT=8091
USER node
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8091/saglik || exit 1
CMD ["node","--experimental-strip-types","--disable-warning=ExperimentalWarning","server.ts"]
