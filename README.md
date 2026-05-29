<div align="center">

# ARGUS

**Unified Enterprise Intelligence Platform — One Scrape, Three Lenses, One Truth**

[![Turborepo](https://img.shields.io/badge/TURBOREPO-EF4444?style=for-the-badge&logo=turborepo&logoColor=white&labelColor=0D0D0D)](https://turbo.build)
[![Bun](https://img.shields.io/badge/BUN-000000?style=for-the-badge&logo=bun&logoColor=white&labelColor=0D0D0D)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/NEXT.JS_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=0D0D0D)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0D0D0D)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLITE-003B57?style=for-the-badge&logo=sqlite&logoColor=white&labelColor=0D0D0D)](https://sqlite.org)

[![AI/ML API](https://img.shields.io/badge/AI%2FML_API-8B5CF6?style=for-the-badge&logo=openai&logoColor=white&labelColor=0D0D0D)](https://aimlapi.com)
[![Bright Data](https://img.shields.io/badge/BRIGHT_DATA-FF6B00?style=for-the-badge&logo=data&logoColor=white&labelColor=0D0D0D)](https://brightdata.com)
[![Cognee](https://img.shields.io/badge/COGNEE-10B981?style=for-the-badge&logo=neo4j&logoColor=white&labelColor=0D0D0D)](https://cognee.ai)

</div>

---

## Overview

Argus is a unified enterprise intelligence platform built for the lablab.ai hackathon. It continuously monitors the live web through specialized agents, stores findings in a persistent knowledge graph (Cognee), and analyzes the same raw data through three independent lenses — each optimized for a different enterprise persona.

**The core thesis**: One web signal can be a hiring signal (GTM), a leadership risk indicator (Finance), and a vendor stability warning (Security) — all stored once, analyzed three ways through persistent memory.

---

## What Problem It Solves

Enterprise intelligence is fragmented. GTM teams buy CompeteIQ. Finance teams buy Cortex. Security teams buy Keiretsu Radar. Each pays for separate data collection, separate storage, separate analysis — and none of them can correlate signals across domains because their data never touches the same memory layer.

Argus solves this by:

- **One scrape, three analyses** — A single LinkedIn profile change hits the GTM lens (hiring signal), Finance lens (leadership risk), and Security lens (vendor stability) without re-scraping
- **Cross-lens correlation** — When MarketDataBot sees a price drop AND FilingDataBot finds an 8-K AND SupplierDataBot flags vendor distress, the CorrelationEngine produces a unified signal all three lenses can use
- **Persistent memory** — Cognee stores every finding with source URLs, timestamps, and confidence scores. No fact is lost between sessions
- **Continuous monitoring** — Agents run on a schedule, not as one-shot reports. The story changes, Argus catches it

---

## How It Works

```
Data Collection (5 agents, continuous)
  MarketDataBot · FilingDataBot · SocialDataBot · SupplierDataBot · NewsDataBot
         |                    Cognee Memory Graph                   |
         v              (persistent, cross-referenced)             v
  +--------------+  +------------------+  +------------------+
  |  GTM LENS    |  |  FINANCE LENS    |  |  SECURITY LENS   |
  | competitor   |  | alpha signals    |  | vendor risk      |
  | hiring sig.  |  | supply chain     |  | regulatory       |
  | buying intent|  | filing divergence|  | brand exposure   |
  +------+-------+  +--------+---------+  +--------+---------+
         |                   |                    |
         v                   v                    v
    GTM Brief         Investor Brief       Risk Alert
         |                   |                    |
         +-------------------+--------------------+
                             |
                    Correlation Engine
                    (convergence detection)
```

### Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Agent Framework** | `@mohanscodex/spectra-agent` + `@mohanscodex/spectra-app` | Agent loop, tool dispatch, session engine, rate limiting, circuit breaker |
| **LLM Access** | AI/ML API (`api.aimlapi.com/v1`) | 400+ models via OpenAI-compatible endpoint. Workers use DeepSeek V4 Flash (cheap, 1M ctx). Orchestration uses Kimi K2.6 (reasoning, 256K ctx) |
| **Web Data** | `@brightdata/sdk` + MCP | 60+ structured extractors (LinkedIn, Amazon, SEC, Yahoo Finance, GitHub, etc.) |
| **Agent Memory** | Cognee MCP (Docker) | Persistent knowledge graph with `remember` / `recall` / `improve` / `forget` |
| **Frontend** | Next.js 16 + Tailwind CSS v4 + Fontshare | Dark-themed command center. SSE streaming, live agent activity, signal feed |
| **Database** | SQLite (`bun:sqlite`) | Audit trail, session persistence, agent configs, model catalog, user auth |
| **Auth** | Argon2id + jose (Web Crypto) | Stateless JWT sessions, memory-hard password hashing per OWASP |
| **Build** | Bun + Turborepo | Fast monorepo orchestration |
| **Linting** | Ultracite (Biome) | Zero-config, Rust-fast, type-aware |

---

## Key Features

### Three Intelligence Lenses
- **GTM Lens** — Competitor moves, hiring velocity, buying intent signals, account enrichment
- **Finance Lens** — Alpha signals, supply-chain stress, filing divergence, earnings intelligence
- **Security Lens** — Vendor risk, regulatory actions, brand exposure, threat intel

### Cross-Lens Correlation
- Detects when 2+ lenses surface signals for the same company simultaneously
- Contradiction detection: flags when lenses disagree (e.g., Finance says "bullish" while Security flags "distress")
- Composite scoring with source-weighted confidence

### Real-Time Dashboard
- **Command Deck** — Live signal stream, agent activity timeline, convergence alerts
- **Signals Feed** — Filterable by lens, severity, company. Source URLs on every finding
- **Reports** — Expandable executive briefs with risk scores and recommendations
- **AI Chat** — Natural language interface to generate cross-lens reports and query intelligence
- **Settings** — Per-agent model selection, pipeline configuration, model catalog from AI/ML API

### Event-Driven Architecture
- Every agent is an independent event subscriber
- `MonitorTick` triggers collection agents
- `EvidenceCollected` triggers normalizer
- `FactClassified` triggers all three lens agents in parallel
- `LensAnalysisComplete` triggers correlation engine
- `ConvergenceDetected` triggers brief writer
- All events broadcast via SSE to the frontend

### Data Integrity & Fallbacks
- Every finding includes source URLs and extraction timestamps
- Bright Data failures escalate: `scrape_as_markdown` -> `scraping_browser` -> `web_unlocker`
- Cognee unavailable? Falls back to in-session context. Single-agent reasoning continues
- Scrape cache with TTL: prices (1h), news (3h), social (6h), suppliers (12h), filings (24h)

---

## Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | ![Next.js](https://img.shields.io/badge/NEXT.JS_16-000000?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=0D0D0D) ![React](https://img.shields.io/badge/REACT_19-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=0D0D0D) ![Tailwind](https://img.shields.io/badge/TAILWIND_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0D0D0D) ![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0D0D0D) |
| **Backend** | ![Bun](https://img.shields.io/badge/BUN-000000?style=flat-square&logo=bun&logoColor=white&labelColor=0D0D0D) ![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0D0D0D) ![SQLite](https://img.shields.io/badge/SQLITE-003B57?style=flat-square&logo=sqlite&logoColor=white&labelColor=0D0D0D) |
| **Agents** | ![Spectra](https://img.shields.io/badge/SPECTRA_AGENT-8B5CF6?style=flat-square&logoColor=white&labelColor=0D0D0D) ![AI/ML API](https://img.shields.io/badge/AI%2FML_API-8B5CF6?style=flat-square&logo=openai&logoColor=white&labelColor=0D0D0D) ![Bright Data](https://img.shields.io/badge/BRIGHT_DATA-FF6B00?style=flat-square&logo=data&logoColor=white&labelColor=0D0D0D) |
| **Memory** | ![Cognee](https://img.shields.io/badge/COGNEE-10B981?style=flat-square&logo=neo4j&logoColor=white&labelColor=0D0D0D) |
| **DevOps** | ![Turborepo](https://img.shields.io/badge/TURBOREPO-EF4444?style=flat-square&logo=turborepo&logoColor=white&labelColor=0D0D0D) ![Docker](https://img.shields.io/badge/DOCKER-2496ED?style=flat-square&logo=docker&logoColor=white&labelColor=0D0D0D) ![Biome](https://img.shields.io/badge/BIOME-60A5FA?style=flat-square&logoColor=white&labelColor=0D0D0D) |

---

## Project Structure

```
argus/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   │   ├── collection/       # MarketDataBot, FilingDataBot, SocialDataBot, SupplierDataBot, NewsDataBot
│   │   │   │   ├── lenses/           # GTMLens, FinanceLens, SecurityLens (v1 + v2 event-driven)
│   │   │   │   ├── correlation/      # Convergence detection with contradiction handling
│   │   │   │   ├── briefwriter.ts    # Executive brief composition
│   │   │   │   ├── normalizer.ts     # Fact extraction + lens classifier
│   │   │   │   └── factory.ts        # Config-driven agent constructor
│   │   │   ├── config/
│   │   │   │   ├── store.ts          # SQLite schemas + defaults (agent configs, pipeline settings, model catalog)
│   │   │   │   ├── routes.ts         # REST endpoints for settings
│   │   │   │   └── indexer.ts        # AI/ML API model fetcher
│   │   │   ├── auth.ts               # Argon2id + JWT session management
│   │   │   ├── events.ts             # Typed event bus + credit tracker
│   │   │   ├── cache.ts              # Scrape cache with TTL + fallback cascade
│   │   │   ├── state.ts              # SQLite persistence (runs, steps, signals, briefs)
│   │   │   ├── pipeline.ts           # Event-driven orchestrator
│   │   │   ├── server.ts             # HTTP + SSE server (auth, chat, settings, signals)
│   │   │   └── providers/aimlapi.ts  # AI/ML API provider registration
│   │   └── package.json
│   └── frontend/
│       ├── app/
│       │   ├── (dashboard)/           # Protected routes with sidebar
│       │   │   ├── dashboard/         # Command Deck (signals, convergence, agent timeline)
│       │   │   ├── chat/            # AI Intelligence Assistant
│       │   │   ├── agents/            # Agent management console
│       │   │   ├── signals/           # Filterable signal feed
│       │   │   ├── reports/           # Expandable briefs viewer
│       │   │   └── settings/          # Model catalog, agent config, pipeline settings
│       │   ├── onboarding/            # 4-step wizard (Welcome → Connect → Watchlist → Complete)
│       │   ├── login/                 # Auth page
│       │   └── register/              # Registration page
│       ├── components/                # Sidebar, route guard, agent flow timeline, score rings
│       ├── contexts/auth-context.tsx  # JWT auth provider + hooks
│       └── lib/api.ts                # Frontend API client (REST + SSE)
├── packages/shared/                   # TypeScript types, Zod schemas, constants
├── docker-compose.yml                 # Full stack: Backend + Frontend + Cognee MCP
├── turbo.json                         # Turborepo pipeline config
└── AGENTS.md                          # Architecture docs, coding standards, failure modes
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3.11+
- [Docker](https://docker.com) (for Cognee MCP)
- AI/ML API key ([get one](https://aimlapi.com))
- Bright Data API key ([get one](https://brightdata.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/codex-mohan/Argus.git
cd Argus

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env and add your keys:
#   BRIGHTDATA_API_KEY=your_brightdata_key
#   AIMLAPI_KEY=your_aimlapi_key
#   JWT_SECRET=your_random_secret

# Start Cognee (Docker)
docker-compose up -d cognee

# Start the backend (port 3001)
cd apps/backend
bun --watch src/server.ts

# In another terminal, start the frontend (Portless)
cd apps/frontend
portless run next dev
# -> https://argus.localhost
```

### Quick Test

```bash
# Trigger a manual pipeline run
curl -X POST http://localhost:3001/api/run \
  -H 'Content-Type: application/json' \
  -d '{"company":"NVIDIA","mode":"live"}'

# Or use the replay endpoint for a canned scenario
curl -X POST http://localhost:3001/api/replay \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"nvidia_convergence"}'
```

---

## Authentication & Onboarding

Argus uses **Argon2id** (memory-hard, OWASP-recommended) for password hashing and **jose** (Web Crypto API) for JWT signing.

1. **Register** at `/register` — minimum 8 characters, no complexity rules (NIST 800-63B)
2. **Onboarding Wizard** — 4-step timeline:
   - Step 1: Welcome (learn the 3 lenses)
   - Step 2: Connect (verify data sources)
   - Step 3: Configure watchlist (companies to monitor)
   - Step 4: Complete → redirect to dashboard
3. **Sessions** — Stateless JWT in `Authorization: Bearer` header + `argus_session` cookie fallback. 7-day expiry

---

## Model Configuration

Every agent's LLM model is configurable at runtime via the Settings page. Defaults are set in SQLite on first run:

| Agent | Default Model | Context | Purpose |
|-------|--------------|---------|---------|
| Collection bots (5) | `deepseek/deepseek-v4-flash` | 1M tokens | Cheap, fast data collection |
| Lens agents (3) | `deepseek/deepseek-v4-flash` | 1M tokens | Multi-fact analysis |
| Correlation Engine | `moonshotai/kimi-k2.6` | 256K tokens | Cross-lens reasoning |
| Brief Writer | `moonshotai/kimi-k2.6` | 256K tokens | Executive synthesis |
| Chat Assistant | `deepseek/deepseek-v4-flash` | 1M tokens | User queries |

Change any model in Settings → Agent Configuration. The backend reads from SQLite on every agent invocation — no restart required.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account (Argon2id) |
| `POST` | `/api/auth/login` | Authenticate (JWT) |
| `GET` | `/api/auth/me` | Current user |
| `PUT` | `/api/auth/onboarding` | Update onboarding step |
| `GET` | `/api/signals` | List signals (filtered by watchlist) |
| `GET` | `/api/signals/stream` | SSE live event stream |
| `GET` | `/api/briefs` | List executive briefs |
| `GET` | `/api/agents/status` | Agent health + activity |
| `GET` | `/api/agents/config` | Agent configurations |
| `PUT` | `/api/agents/config` | Update agent config |
| `POST` | `/api/run` | Trigger manual pipeline run |
| `POST` | `/api/replay` | Trigger canned scenario |
| `POST` | `/api/chat` | AI Intelligence Assistant |
| `GET` | `/health` | System health (MCP, pipeline, stats) |

---

## Known Limitations

| Limitation | Details | Mitigation |
|------------|---------|------------|
| **Windows DNS** | Node.js/Bun on Windows cannot resolve `*.localhost` subdomains | Backend uses `localhost:3001` directly; Portless serves frontend only |
| **Cognee dependency** | Requires Docker container running | `docker-compose up -d cognee`. Falls back to in-session memory if unavailable |
| **Bright Data credits** | 5K credits/month without cache ~23 hours runtime | Aggressive caching with TTL; cache-first collection architecture |
| **Model ID accuracy** | `deepseek/deepseek-v4-flash` ID may need verification against AI/ML API catalog | Use Settings → Re-index Models to verify available models |
| **TypeScript errors** | Pre-existing type errors in `providers/aimlapi.ts` (Spectra SDK types) | Does not affect runtime; all new code compiles clean |
| **No Speechmatics** | Voice input disabled (no API key) | Text interface is primary; zero feature loss |
| **No TriggerWare** | Workflow automation (Slack/email) disabled | Alerts stay in dashboard; no data loss |

---

## Future Expansion Plan

| Phase | Feature | Description |
|-------|---------|-------------|
| **Phase 1** | Speechmatics integration | Real-time voice queries, 55+ languages |
| **Phase 2** | TriggerWare workflows | Event-driven Slack/email alerts from agent outputs |
| **Phase 3** | Mobile app | React Native companion for push notifications |
| **Phase 4** | Custom lens builder | Users define new lenses with natural language prompts |
| **Phase 5** | Multi-tenant SaaS | Per-organization data isolation, billing, role-based access |
| **Phase 6** | Advanced correlation | Time-series anomaly detection, causal inference across lenses |

---

## Team

**Argus Intelligence Team**

Built for the [lablab.ai](https://lablab.ai) hackathon.

| Name | Role | GitHub |
|------|------|--------|
| **codex-mohan** | Architect, Backend, Pipeline, Agent Framework | [@codex-mohan](https://github.com/codex-mohan) |
| **parthchilwerwer** | Frontend, Landing Page, UI/UX | [@parthchilwerwar](https://github.com/parthchilwerwar) |

---

<div align="center">

**A hundred eyes on the web. Every eye sees a different signal. Three lenses, one truth.**

[Documentation](AGENTS.md) · [Issues](https://github.com/codex-mohan/Argus/issues)

</div>
