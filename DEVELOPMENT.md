# Development Commands

## Quick Start (with Portless)

Portless gives you named HTTPS URLs instead of port numbers:

```bash
# Run both apps (from project root)
bun run dev

# This starts:
#   Frontend → https://argus.localhost
#   Backend  → https://api.argus.localhost
```

## Why Portless?

- **No port conflicts** — No more `ECONNREFUSED ::1:3001`
- **HTTPS by default** — Local CA auto-generated and trusted
- **Named URLs** — `https://argus.localhost` instead of `localhost:3000`
- **Subdomains** — `https://api.argus.localhost` for backend

## Manual Commands

```bash
# Backend only (https://api.argus.localhost)
cd apps/backend && bun run dev

# Frontend only (https://argus.localhost)
cd apps/frontend && bun run dev

# Or with explicit portless:
portless argus bun run dev        # frontend
cd apps/backend && portless api.argus bun --watch src/server.ts   # backend
```

## Triggering Pipelines

```bash
# Trigger replay (instant, 0 credits, no backend needed)
bun run replay

# Trigger live run for NVIDIA
bun run trigger
```

## Without Portless (fallback)

If portless doesn't work on your machine:

```bash
# Terminal 1 — Backend
cd apps/backend && bun --watch src/server.ts
# → http://localhost:3001

# Terminal 2 — Frontend
cd apps/frontend && next dev
# → http://localhost:3000
# Proxies /api/* to localhost:3001
```

## Environment

`.env` in project root (already created):

```
BRIGHTDATA_API_KEY=ec8d2de2-a46a-4efd-9388-27e14b9f5ca5
AIMLAPI_KEY=your_aimlapi_key_here
COGNEE_MCP_URL=http://localhost:8000
PORT=3001
```

## Docker (Cognee)

```bash
# Start Cognee MCP container
docker-compose up -d cognee

# Start full stack
docker-compose up
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Command deck — live pipeline, signals, convergence |
| `/agents` | Agent management — enable/disable, edit prompts |
| `/signals` | Signal feed — filter by lens/severity/search |
| `/reports` | Reports & briefs — expandable intelligence briefs |
| `/settings` | Settings — model catalog, agent config, pipeline params |

## Settings Features

| Feature | Endpoint |
|---------|----------|
| Index AI/ML API models | `POST /api/models/index` |
| List indexed models | `GET /api/models` |
| Agent configuration | `GET/PUT /api/agents/config` |
| Pipeline parameters | `GET/PUT /api/pipeline/config` |
| User preferences | `GET/PUT /api/user/settings` |

## Troubleshooting

**"ECONNREFUSED ::1:3001"**
→ Backend hasn't started. Wait 5-10s for MCP connections, or restart.

**"Failed to load initial signals"**
→ Backend is down or portless proxy hasn't registered. Check `https://api.argus.localhost/health`

**Portless permission error**
→ Portless needs admin to bind port 443. Run `portless trust` first, or use `--no-tls`.

**Cognee unavailable**
→ Start Docker: `docker-compose up -d cognee`. Pipeline still works in replay mode without it.
