FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-slim
WORKDIR /app

# Install system fonts for anonymous wall card rendering
# fonts-noto-cjk: Chinese/Japanese/Korean
# fonts-dejavu-core: Latin/Cyrillic (includes bold weights)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Copy font assets (custom fonts; system fonts in image are the fallback)
COPY assets/fonts/ ./assets/fonts/

# Copy word pair data
COPY src/data/ ./dist/data/

ENV NODE_ENV=production
EXPOSE ${PORT:-3000}

# Health check (Railway also checks /health via railway.toml)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "const http=require('http');http.get('http://localhost:'+(process.env.PORT||3000)+'/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
