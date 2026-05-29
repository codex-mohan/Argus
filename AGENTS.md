# Argus

> A hundred eyes on the web. Every eye sees a different signal. Three lenses, one truth.

**Unified enterprise intelligence platform — one set of web data, three personas (GTM, Finance, Security), connected through persistent agent memory.**

## Goal

Build a platform where 10+ specialized agents continuously scrape the live web and store everything in a persistent knowledge graph (Cognee). The same raw intelligence is then analyzed through three different lenses — each optimized for a different enterprise persona:

1. **GTM Lens** — competitor moves, hiring signals, buying intent, account enrichment
2. **Finance Lens** — alpha signals, supply-chain stress, filing divergence, earnings intelligence
3. **Security Lens** — vendor risk, regulatory actions, brand exposure, threat intel

No other submission connects web data across all three tracks through persistent memory. Cortex does finance-only. CompeteIQ does GTM-only. Keiretsu Radar does security-only. Argus stores once, analyzes three ways.

### Architecture

```
Data Collection (5 agents, run continuously)
  MarketDataBot · FilingDataBot · SocialDataBot · SupplierDataBot · NewsDataBot
        │                    Cognee Memory Graph                  │
        ▼              (persistent, cross-referenced)             ▼
  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  GTM LENS    │  │  FINANCE LENS    │  │  SECURITY LENS   │
  │ competitor   │  │ alpha signals    │  │ vendor risk      │
  │ hiring sig.  │  │ supply chain     │  │ regulatory       │
  │ buying intent│  │ filing divergence│  │ brand exposure   │
  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
         ▼                   ▼                     ▼
    GTM Brief         Investor Brief          Risk Alert
```

### Why This Wins

- **One scrape, three analyses**: A LinkedIn profile change is a hiring signal (GTM), leadership risk (Finance), AND vendor stability indicator (Security) — stored once, queried three ways through Cognee
- **Cross-track correlation**: When MarketDataBot sees price drops AND FilingDataBot sees an 8-K AND SupplierDataBot sees vendor distress → CorrelationEngine produces a signal all three lenses can use
- **All three tracks genuinely covered**: Not "finance with GTM inputs" — three equal, standalone lenses on the same data
- **Continuous monitoring**: Unlike Cortex (one-shot reports), Argus watches continuously and alerts when the story changes
- **Every partner used meaningfully**: Bright Data for collection, Cognee for memory/correlation, AI/ML API for each lens's reasoning, Speechmatics for voice queries, TriggerWare for alert workflows

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Agent framework | `@mohanscodex/spectra-agent` + `@mohanscodex/spectra-app` | Agent loop, tool dispatch, session engine, rate limiting, circuit breaker |
| LLM access | AI/ML API (`api.aimlapi.com/v1`) | 400+ models via OpenAI-compatible endpoint. Spectrum: DeepSeek for reasoning, Claude for reports, Gemini for fast ingest |
| Web data | `@brightdata/sdk` + `@brightdata/mcp` | SDK for raw scrape/SERP. MCP for pre-built extractors (LinkedIn, Amazon, SEC, Yahoo Finance, GitHub, etc.) |
| Agent memory | Cognee MCP (Docker) | Persistent knowledge graph. `remember` → `recall` → `improve` → `forget`. 14 MCP tools |
| Voice input | Speechmatics REST/WebSocket | Real-time speech-to-text, 55+ languages |
| Workflow automation | TriggerWare | Event-driven workflows connecting agent outputs to actions |
| Frontend | Next.js 16 + shadcn/ui + Recharts | Dark-theme command center. SSE streaming, live agent activity, signal feed |
| Database | SQLite (better-sqlite3) via Spectra SessionStore | Audit trail, session persistence, health scores |
| Linting | Ultracite (Biome) | Zero-config, Rust-fast, type-aware linting. `npx ultracite init --pm bun --linter biome --frameworks next --editors cursor --agents claude opencode --type-aware` |
| Build tool | Bun + Turborepo | Fast monorepo orchestration |
| Language | TypeScript (end-to-end) | Shared types between agents and frontend |

## Structure

```
argus/
├── apps/
│   ├── backend/                 # Spectra agent swarm
│   │   ├── agents/              # Agent definitions
│   │   ├── collection/       # Data collection: MarketDataBot, FilingDataBot, SocialDataBot, SupplierDataBot, NewsDataBot
│   │   ├── lenses/           # Analysis lenses: GTMLens, FinanceLens, SecurityLens
│   │   └── synthesis/        # CorrelationEngine, BriefWriter
│   │   ├── tools/               # Bright Data tool wrappers, MCP client
│   │   ├── mcp/                 # MCP client management (Bright Data + Cognee)
│   │   ├── orchestrator.ts      # Agent dispatch and coordination
│   │   └── server.ts            # HTTP + SSE server
│   └── frontend/                # Next.js 16 dashboard
│       ├── app/                 # App router pages
│       │   ├── dashboard/       # Main command center
│       │   ├── signals/         # Live signal feed
│       │   └── agents/          # Agent activity monitor
│       └── components/          # shadcn/ui components
├── packages/
│   └── shared/                  # TypeScript types, constants, Zod schemas
├── docs/
│   └── agent/                   # Provider integration docs (this folder)
├── docker-compose.yml           # Backend + Frontend + Cognee MCP
├── turbo.json
├── package.json
└── AGENTS.md                    # This file
```

## Rules

### Data Integrity
- Every agent output must include source URLs and extraction timestamps
- Never fabricate web data. If a scrape fails, surface the error — never invent a price, name, or fact
- Bright Data must be called through the SDK or MCP, never mocked in non-test code
- All LLM responses must be grounded in scraped evidence, not training data

### Agent Design
- Each agent has exactly one responsibility. If an agent does two things, split it
- Agents communicate through Cognee memory, not direct calls — share context, not state
- Use `spectra-agent` `defineTool()` for every external capability (scraping, search, memory ops)
- Rate-limit all Bright Data calls through `spectra-app` CompositeRateLimiter
- Every agent must have a system prompt that includes: role, data sources, output format, fallback behavior

### Code Quality
- TypeScript strict mode everywhere. No `any` in agent logic
- Zod schemas for all tool inputs/outputs and API contracts
- Error handling: every agent path must handle Bright Data failures, LLM timeouts, and Cognee unavailability
- No `console.log` in production paths — use structured logging through Spectra's event system

### MCP Integration
- Bright Data MCP tools and Cognee MCP tools are separate clients. Do not conflate them
- Cognee MCP runs as a Docker service. Never run `npx @cognee/mcp` or pip install cognee in the TypeScript context
- MCP tool calls are async and may timeout. All MCP calls must have 30s timeouts with graceful fallback

## Development Principles

1. **Ship working code every session.** A running half-built system beats a planned perfect system
2. **Live data first.** Wire Bright Data before building the UI. If the agents can't scrape, nothing else matters
3. **One agent at a time.** Build, test, and verify each agent standalone before wiring them together
4. **Memory is a multiplier.** Cognee enables cross-agent context — use it early, not as an afterthought
5. **Deployable from day one.** Docker Compose must bring up the full stack in one command

## Common Pitfalls

### Multi-Agent Coordination
- **Lens isolation failure**: FinanceLens and GTMLens reaching contradictory conclusions from the same data. Fix: lenses must cite the same Cognee data nodes; CorrelationEngine resolves conflicts
- **Collection-lens coupling**: A lens agent depends on a specific collection agent being available. Fix: lenses query Cognee, not collection agents directly. If a collection agent is down, lenses work with cached data
- **Double-scraping**: Two collection agents scraping the same URL simultaneously. Fix: Cognee as scrape cache with TTL — check before scraping
- **Stale context**: Agent A remembers something Agent B already disproved. Fix: always `recall` before acting, `remember` after confirming with source URL
- **Orchestrator hallucination**: The CorrelationEngine invents a connection because no agent produced one. Fix: CorrelationEngine must only report connections with explicit agent sources and evidence URLs

### Bright Data
- **Escalation loop**: Retry-scraping a blocked URL without changing method. Fix: scrape_as_markdown → scraping_browser → web_unlocker, stop after 3 failures
- **Credit burn**: Hammering a rate-limited endpoint. Fix: Spectra's CompositeRateLimiter with per-domain token buckets
- **Missing extractor**: Using raw scrape when a pre-built extractor exists. Fix: check MCP tool list before scraping — `web_data_amazon_product` beats `scrape_as_markdown` for Amazon

### LLM Usage
- **Wrong model for task**: Using Claude Opus for simple classification. Fix: flash models for extraction, pro models for synthesis, reasoning models for analysis
- **Prompt without escape hatch**: Agent stuck because it can't access a blocked site. Fix: every prompt must include "If the data source is unavailable, report that and proceed with available evidence"
- **Token waste**: Passing raw HTML when structured JSON is available. Fix: prefer Bright Data structured extractors over raw scraping

### Cognee Memory
- **Forgetting to remember**: Agent scrapes data, produces insight, moves on — insight lost. Fix: every agent must call `remember` with key findings after completing its task
- **Session-only memory**: Using `remember(session_id=...)` without bridging to permanent graph. Fix: always run `improve` to bridge session → permanent, or use permanent mode directly
- **Dataset sprawl**: Every agent creating its own dataset. Fix: use shared datasets by data source (`raw_market_data`, `raw_filing_data`, `raw_social_data`, `raw_supplier_data`, `raw_news_data`, `lens_findings`, `correlation_signals`)

### Shared Memory Hazards

Shared agent memory is powerful but dangerous. These are the failure modes specific to multiple agents reading and writing the same Cognee datasets:

- **Context rot**: An agent stored a fact 3 days ago that's no longer true, but another agent recalls and acts on it. *Example: MarketDataBot cached "NVIDIA RTX 5090 = $1,999" on Monday. FinanceLens recalls it on Thursday and builds an analysis on stale pricing.* Fix: every `remember` call must include a `scraped_at` timestamp. Every `recall` call must include `&sources=evidence`. Lenses must verify recency — if the newest scrape for a datapoint is older than the scrape TTL (24h for prices, 7d for filings, 30d for company profiles), flag it as potentially stale and re-scrape before using.
- **Context poisoning**: One agent stores low-confidence or hallucinated data. Other agents treat it as ground truth and amplify the error downstream. *Example: SupplierDataBot misclassifies a routine maintenance notice as "supplier shutdown." SecurityLens reads it and produces a vendor risk alert. CorrelationEngine sees the alert and links it to a real price drop, creating a false narrative.* Fix: every `remember` call must include a `confidence` score (0-1). Lenses must weight findings by confidence. CorrelationEngine must only correlate signals where `confidence >= 0.7`. Low-confidence signals are stored with `dataset = raw_*` but tagged `low_confidence: true` and excluded from automated correlation.
- **Echo chamber**: Agent A stores a finding. Agent B recalls it, rephrases it slightly, and stores it again as a "new" finding. Agent C sees two entries and treats it as corroboration. *Example: Three agents storing variations of "NVIDIA supply chain under pressure" creates the illusion of three independent confirmations when it's really one observation echoed.* Fix: CorrelationEngine must deduplicate by source URL, not by finding text. If two Cognee nodes cite the same `source_url`, they count as one signal. The `remember` call must include `source_url` as a required field for all factual claims.
- **Recall bias**: Agent A always queries with a specific filter or lens, so it only ever sees data that confirms its existing view. *Example: FinanceLens always queries `recall(query="bearish signals for NVIDIA")` and never sees the 3 positive signals that were also stored.* Fix: lenses must perform two passes — first a neutral recall (`query="all recent signals for ${company}"`), then a structured analysis pass. The first pass informs what exists; the second pass interprets it. Never start with a leading query.
- **Dataset collision**: Two agents write to the same dataset simultaneously with conflicting facts. *Example: MarketDataBot stores `price: $999` while PriceTrackerBot stores `price: $1,099` for the same product on the same day.* Fix: always store with `source_url` + `scraped_at` + `agent_id`. Conflicting data is not an error — it's a signal. CorrelationEngine detects same-product/same-day price divergence and flags it as a separate signal type (`data_discrepancy`).
- **Memory bloat**: Agents store everything without pruning, degrading recall quality. *Example: 500 raw scrapes of Amazon product pages stored over 2 weeks. Recall returns fragments from 10 days ago that are stale and irrelevant.* Fix: Cognee `forget` old raw data by dataset + age. Collection agents store raw data with TTL (7 days for prices, 30 days for filings). Lens findings and correlation signals are kept indefinitely. Run `forget(dataset="raw_market_data", older_than="7d")` as a scheduled cleanup.

### Memory Entry Schema

Every `remember` call for factual data must include these fields:

```typescript
interface MemoryEntry {
  source_url: string;        // Required. The URL this data came from
  scraped_at: string;        // Required. ISO 8601 timestamp of when it was scraped
  agent_id: string;          // Required. Which agent stored this
  confidence: number;        // Required. 0.0-1.0. < 0.7 = tagged low_confidence
  data_type: string;         // Required. "price" | "filing" | "social" | "supplier" | "news"
  content: string;           // Required. The actual finding text
  raw_extract: object;       // Optional. The original structured data before summarization
  ttl_hours: number;         // Optional. How long before this entry is considered stale
}
```

Lenses and CorrelationEngine must check `scraped_at` age vs `ttl_hours` before using any entry.

### Degradation & Fallbacks

Argus must never crash, hang, or produce garbage because a dependency is unavailable. Every external call — provider API, MCP tool, database, file system — must have a fallback. The system degrades gracefully, not catastrophically.

#### Provider Fallback Matrix

| Provider | Required? | Fallback |
|----------|-----------|----------|
| **Bright Data** | YES | None — hackathon requirement. If down, agents report error with timestamp and retry. Never fabricate data |
| **AI/ML API** | YES | Degrade to direct provider API keys if available. If all LLMs down, agents queue tasks for retry |
| **Cognee MCP** | Semi-required | Fall back to in-memory session context. Cross-agent memory lost, single-agent reasoning unaffected. Log: "Cognee unavailable — degraded memory mode" |
| **Speechmatics** | Optional | Voice endpoint returns `{ available: false }`. Text interface is primary — no feature loss |
| **TriggerWare** | Optional | Alerts stay in dashboard. No external notifications, no data loss |
| **Kiro** | Optional | Dev tool — zero runtime impact |

#### Feature Fallback Matrix

| Feature | Degrades To | When |
|---------|------------|------|
| Voice input | Text-only input | Speechmatics key missing or service down |
| Cross-agent memory | In-session memory only | Cognee unreachable |
| Workflow automation (Slack/email) | Dashboard-only alerts | TriggerWare key missing |
| Live web scrape | Cached result from Cognee memory | URL already scraped within TTL |
| SERP cross-check | Skip verification, flag as unverified | SERP API rate limited |
| Structured extractor (LinkedIn, Amazon) | Raw scrape_as_markdown | MCP Pro mode not enabled |
| Full agent report | Partial report with missing-source flags | Any agent's data source unavailable |
| Docker Compose full stack | Manual start (backend + frontend, skip Cognee) | Docker not installed |

#### Code-Level Fallback Pattern

Every function that crosses an external boundary must follow this pattern:

```typescript
// 1. Define a degradation type
type ScrapeResult =
  | { status: "success"; data: string; source: string }
  | { status: "degraded"; data: string; source: "cache"; originalUrl: string }
  | { status: "unavailable"; reason: string; suggestion: string };

// 2. Accept a fallback function
async function scrapeUrl(
  url: string,
  fallback?: () => Promise<string | null>
): Promise<ScrapeResult> {
  try {
    const data = await brightDataClient.scrape(url);
    return { status: "success", data, source: "brightdata" };
  } catch (err) {
    // Try cache
    const cached = await cognee.recall({ query: url, top_k: 1 });
    if (cached.length > 0) {
      return { status: "degraded", data: cached[0], source: "cache", originalUrl: url };
    }
    // Try caller's fallback
    if (fallback) {
      const fb = await fallback();
      if (fb) return { status: "degraded", data: fb, source: "fallback", originalUrl: url };
    }
    // Truly unavailable
    return {
      status: "unavailable",
      reason: String(err),
      suggestion: "Retry with scraping_browser or try a different URL",
    };
  }
}

// 3. Upstream caller decides what to do
const result = await scrapeUrl("https://example.com", async () => {
  // Fallback: try alternative URL
  return brightDataClient.scrape("https://archive.example.com");
});

if (result.status === "unavailable") {
  // Log, notify, skip — but don't crash
  logger.warn("Scrape unavailable", { url, reason: result.reason });
}
```

#### Rules for Every Code Path

1. **Never `throw` across an async boundary without a catch above it.** Unhandled promise rejections kill the process
2. **Never assume an MCP tool exists.** Check the tool list at startup, disable agents whose tools are missing
3. **Timeouts on every external call.** 30s default, 10s for health checks, 60s for scrapes. No infinite waits
4. **Retry with backoff, then give up.** Max 3 retries. Exponential backoff starting at 1s. After 3 failures, degrade
5. **Log every degradation.** Structured log with: timestamp, provider, operation, failure reason, fallback used
6. **Cache aggressively.** Cognee is both memory AND a scrape cache. Check Cognee before calling Bright Data for repeat URLs

### General
- **TypeScript race conditions**: Two async agent runs mutating shared state. Fix: Spectra SessionEngine serializes per-user; use Cognee as the shared state layer
- **SSE connection leaks**: Unclosed event streams from frontend disconnects. Fix: AbortController cleanup in useEffect return
- **Docker networking**: Cognee MCP container can't reach host. Fix: use `host.docker.internal` in API_URL, or Docker bridge IP on Linux


### Auth & Sessions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Password hashing | **Argon2id** via `hash-wasm` | Resistant to GPU/ASIC attacks, memory-hard, recommended by OWASP over bcrypt for new systems |
| JWT signing | **jose** (Web Crypto API) | Zero native deps, works in Bun/Node/Edge, Ed25519 and HS256 support |
| Sessions | Stateless JWT in `Authorization: Bearer` header + `argus_session` cookie fallback | No server-side session store needed; SQLite users table persists onboarding state |
| Token expiry | 7 days | Long enough for daily-use dashboard, short enough to limit breach window |

#### Why Argon2id over bcrypt

OWASP Password Storage Cheat Sheet (2023) recommends **Argon2id** as the primary choice for password hashing. Unlike bcrypt (which is sequential and memory-light), Argon2id is memory-hard and resistant to both side-channel and GPU-cracking attacks. We use `hash-wasm` (pure WebAssembly) for Bun compatibility without node-gyp native modules.

```typescript
const hash = await argon2id({
  password,
  salt,
  parallelism: 4,
  iterations: 3,
  memorySize: 65536,  // 64 MB
  hashLength: 32,
  outputType: "encoded",
});
```

#### Password Policy
- Minimum 8 characters
- No complexity rules (NIST 800-63B: length > complexity)
- Rate-limit registration/login per IP (future: Spectra CompositeRateLimiter)

#### Onboarding State
- Stored in `users` SQLite table: `onboarding_complete`, `onboarding_step`
- Step 0: Account created
- Step 1: Connect data sources (Bright Data, Cognee)
- Step 2: Configure watchlist
- Step 3: Complete — redirect to dashboard

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.
