# Frontend Dockerfile
FROM oven/bun:1.3.13 AS builder

WORKDIR /app

# Copy workspace files
COPY package.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/frontend/package.json apps/frontend/

# Install dependencies
RUN bun install

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/frontend/ apps/frontend/

# Build frontend
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM oven/bun:1.3.13 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["bun", "server.js"]
