# Backend Dockerfile
FROM oven/bun:1.3.13

WORKDIR /app

# Copy workspace files
COPY package.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

# Install dependencies
RUN bun install

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/

# Build shared package first
RUN cd packages/shared && bun run typecheck || true

WORKDIR /app/apps/backend

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["bun", "run", "src/server.ts"]
