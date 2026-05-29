# Argus — Refined Agent Flow v2.0

> Event-driven, auditable, defensible multi-agent intelligence pipeline.
> One scrape → three analyses → correlation → brief. Every step visible.

---

## Core Goal Preservation

This refactor **does not** change what Argus is. It changes **how** it proves what it is:

- **One scrape, three analyses** → Scrape cache guarantees one Bright Data call per URL per TTL
- **Cross-track correlation** → Contradiction-aware correlation, not naive Set.counting
- **All three tracks genuinely covered** → Lens agents are independent subscribers, not sequential callers
- **Continuous monitoring** → Event bus enables real-time streaming to frontend
- **Every partner used meaningfully** → Bright Data (evidence), Cognee (cache + memory), AI/ML API (lens reasoning)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENT BUS                                       │
│  Typed async events: MonitorTick → EvidenceCollected → FactExtracted        │
│                     → FactClassified → LensAnalysisComplete                 │
│                     → ConvergenceDetected → BriefReady                      │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SCHEDULER     │───▶│  ORCHESTRATOR   │───▶│   STATE STORE   │
│  (cron / manual)│    │ (event emitter) │    │ (runs + steps)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Collection   │   │  Normalizer   │   │   Lens Pool   │
│    Agents     │──▶│  + Classifier │──▶│  (3 lenses)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Bright Data   │   │   Cognee      │   │  Cognee       │
│ (scrape cache)│   │ (fact store)  │   │ (findings)    │
└───────────────┘   └───────────────┘   └───────────────┘
                                              │
                                              ▼
                                ┌───────────────────────┐
                                │  Correlation Engine   │
                                │ (contradiction-aware) │
                                └───────────┬───────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
           ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
           │ BriefWriter │        │   Alert     │        │   SSE       │
           │             │        │ Dispatcher  │        │  Stream     │
           └─────────────┘        └─────────────┘        └─────────────┘
```

---

## Event Types

```typescript
// Phase 0: Trigger
type MonitorTick = {
  type: "monitor_tick";
  runId: string;
  company: string;
  timestamp: string;
  mode: "live" | "cached" | "replay";
};

// Phase 1: Collection
type EvidenceCollected = {
  type: "evidence_collected";
  runId: string;
  agentId: string; // "market-data-bot" | "filing-data-bot" | ...
  company: string;
  dataType: "price" | "filing" | "social" | "supplier" | "news";
  sourceUrl: string;
  receipt: EvidenceReceipt; // raw Bright Data output
  scrapedAt: string;
  fromCache: boolean;
};

// Phase 2: Normalization
type FactExtracted = {
  type: "fact_extracted";
  runId: string;
  factId: string;
  company: string;
  claim: string; // "NVIDIA stock price dropped 5.2% today"
  sourceUrl: string;
  scrapedAt: string;
  confidence: number; // 0.0-1.0
  evidence: EvidenceReceipt;
};

// Phase 3: Classification
type FactClassified = {
  type: "fact_classified";
  runId: string;
  factId: string;
  company: string;
  claim: string;
  primaryLens: SignalLens; // "gtm" | "finance" | "security"
  secondaryLenses: SignalLens[]; // a fact can touch multiple lenses
  confidence: number;
  reasoning: string; // why this lens assignment
};

// Phase 4: Lens Analysis
type LensAnalysisComplete = {
  type: "lens_analysis_complete";
  runId: string;
  lens: SignalLens;
  company: string;
  finding: LensFinding;
  score: number; // 0-100
  reasoningChain: ReasoningStep[]; // auditable chain
  confidence: number;
};

// Phase 5: Correlation
type ConvergenceDetected = {
  type: "convergence_detected";
  runId: string;
  company: string;
  signals: LensFinding[];
  compositeScore: number; // 0-100
  contradictions: Contradiction[]; // empty = clean convergence
  verdict: "converged" | "contradicted" | "insufficient";
  timestamp: string;
};

// Phase 6: Brief
type BriefReady = {
  type: "brief_ready";
  runId: string;
  company: string;
  brief: ExecutiveBrief;
  sources: string[];
  timestamp: string;
};

// Error / Degradation
type AgentDegraded = {
  type: "agent_degraded";
  runId: string;
  agentId: string;
  operation: string;
  reason: string;
  fallback: string;
  timestamp: string;
};
```

---

## State Machine: Collection Agent

```
IDLE ──▶ [MonitorTick received]
           │
           ▼
   ┌───────────────┐
   │ CHECK_CACHE   │──Cache hit?──▶ EMIT EvidenceCollected(fromCache=true)
   │ (Cognee)      │                    │
   └───────┬───────┘                    ▼
           │ Cache miss              COMPLETE
           ▼
   ┌───────────────┐
   │ BRIGHT_DATA   │──Fail?──▶ EMIT AgentDegraded
   │ (scrape)      │               │
   └───────┬───────┘               ▼
           │                   FALLBACK
           ▼                       │
   ┌───────────────┐               ▼
   │ STORE_RAW     │         ┌───────────┐
   │ (Cognee)      │         │  EMIT     │
   └───────┬───────┘         │ Evidence  │
           │                 │ (fromCache│
           ▼                 │  or       │
   ┌───────────────┐         │  fallback)│
   │ EMIT          │         └───────────┘
   │ Evidence      │
   │ Collected     │
   └───────────────┘
           │
           ▼
      COMPLETE
```

## State Machine: Lens Agent

```
IDLE ──▶ [FactClassified events for this lens]
           │
           ▼
   ┌───────────────┐
   │ BATCH_FACTS   │──No facts?──▶ SKIP
   │ (time window) │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ NEUTRAL_RECALL│──Stall?──▶ EMIT AgentDegraded
   │ (Cognee)      │               │
   └───────┬───────┘               ▼
           │                   USE_CACHED
           ▼                       │
   ┌───────────────┐               ▼
   │ VERIFY_FRESH  │         ┌───────────┐
   │ (TTL check)   │         │  EMIT     │
   └───────┬───────┘         │  Lens     │
           │                 │  Analysis │
    Fresh? │ No              │  (cached) │
     Yes   │                 └───────────┘
      │    ▼
      │ ┌───────────┐
      │ │ RE_SCRAPE │
      │ │ (Bright   │
      │ │  Data)    │
      │ └─────┬─────┘
      │       │
      └───────┤
              ▼
       ┌───────────────┐
       │ LLM_ANALYZE   │──Fail?──▶ EMIT AgentDegraded
       │ (AI/ML API)   │
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ STORE_FINDING │
       │ (Cognee)      │
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ EMIT          │
       │ LensAnalysis  │
       │ Complete      │
       └───────────────┘
               │
               ▼
          COMPLETE
```

## State Machine: Correlation Engine

```
IDLE ──▶ [LensAnalysisComplete events]
           │
           ▼
   ┌───────────────┐
   │ GATHER_LATEST │──< 2 lenses?──▶ WAIT
   │ (per company) │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ CHECK_TIME    │──> 15 min apart?──▶ WAIT
   │ WINDOW        │   (stale correlation)
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ DEDUPLICATE   │──Same source_url?──▶ COUNT_AS_ONE
   │ BY_SOURCE     │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ DETECT_CONTRA-│──Conflict?──▶ EMIT contradicted
   │ DICTIONS      │                  (with details)
   └───────┬───────┘
           │ No conflict
           ▼
   ┌───────────────┐
   │ COMPUTE       │
   │ COMPOSITE     │
   │ SCORE         │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ EMIT          │
   │ Convergence   │
   │ Detected      │
   └───────────────┘
           │
           ▼
      COMPLETE
```

---

## The Pipeline: Step-by-Step (NVIDIA Scenario)

### Scenario Setup
**Company:** NVIDIA  
**Real-world situation:** TSMC announces 3nm production delays. NVDA stock drops 5.2%. News breaks that NVIDIA cuts Q2 guidance. A competitor (AMD) announces a new AI chip.

### Phase 0: Trigger
```
SCHEDULER ──▶ MonitorTick {
  runId: "run_2026-05-29T10:00:00Z",
  company: "NVIDIA",
  timestamp: "2026-05-29T10:00:00Z",
  mode: "live"
}
```

**UI Update:** Run card appears in dashboard. Status: "Initializing monitoring run…"

---

### Phase 1: Collection (Parallel)

#### MarketDataBot
```
CHECK_CACHE: "NVIDIA stock price" → cache miss (last scrape: 6h ago, TTL: 1h)
BRIGHT_DATA: SERP + scrape_as_markdown for "NVIDIA stock price today"
STORE_RAW: Cognee dataset=raw_market_data
EMIT: EvidenceCollected {
  agentId: "market-data-bot",
  dataType: "price",
  sourceUrl: "https://finance.yahoo.com/quote/NVDA",
  receipt: { /* raw Bright Data output */ },
  fromCache: false
}
```

#### NewsDataBot
```
CHECK_CACHE: "NVIDIA news" → cache miss
BRIGHT_DATA: SERP for "NVIDIA news today finance"
SCRAPE: First 3 non-search results
STORE_RAW: Cognee dataset=raw_news_data
EMIT: EvidenceCollected {
  agentId: "news-data-bot",
  dataType: "news",
  sourceUrl: "https://reuters.com/...",
  receipt: { /* raw output */ },
  fromCache: false
}
```

#### SupplierDataBot
```
CHECK_CACHE: "NVIDIA TSMC supply chain" → cache miss
BRIGHT_DATA: SERP + scrape for "TSMC NVIDIA supply chain delay"
STORE_RAW: Cognee dataset=raw_supplier_data
EMIT: EvidenceCollected {
  agentId: "supplier-data-bot",
  dataType: "supplier",
  sourceUrl: "https://digitimes.com/...",
  receipt: { /* raw output */ },
  fromCache: false
}
```

#### SocialDataBot
```
CHECK_CACHE: "NVIDIA LinkedIn hiring" → cache hit (2h old, TTL: 48h)
EMIT: EvidenceCollected {
  agentId: "social-data-bot",
  dataType: "social",
  sourceUrl: "https://linkedin.com/...",
  receipt: { /* cached output */ },
  fromCache: true
}
**Credit saved:** 1 Bright Data call avoided.
```

**UI Update:** Agent Flow Timeline shows 4 collection agents running. MarketDataBot: "Searching Yahoo Finance…" NewsDataBot: "Fetching Reuters article…" Each step has a progress bar.

---

### Phase 2: Normalization

Normalizer subscribes to EvidenceCollected events.

```
FROM market-data-bot receipt:
  EXTRACT: "NVDA closed at $112.34, down 5.2% from previous close"
  EMIT: FactExtracted {
    factId: "fact_001",
    claim: "NVIDIA stock price dropped 5.2% to $112.34",
    confidence: 0.9,
    sourceUrl: "https://finance.yahoo.com/quote/NVDA"
  }

FROM news-data-bot receipt:
  EXTRACT: "NVIDIA cuts Q2 revenue guidance by $2B citing supply constraints"
  EMIT: FactExtracted {
    factId: "fact_002",
    claim: "NVIDIA cuts Q2 revenue guidance by $2 billion due to supply constraints",
    confidence: 0.85,
    sourceUrl: "https://reuters.com/..."
  }

FROM supplier-data-bot receipt:
  EXTRACT: "TSMC delays 3nm production ramp by 6 weeks, affecting NVIDIA Blackwell"
  EMIT: FactExtracted {
    factId: "fact_003",
    claim: "TSMC delays 3nm production by 6 weeks, impacting NVIDIA Blackwell chips",
    confidence: 0.8,
    sourceUrl: "https://digitimes.com/..."
  }

FROM social-data-bot (cached):
  EXTRACT: "NVIDIA posted 12 senior engineering roles in Santa Clara this week"
  EMIT: FactExtracted {
    factId: "fact_004",
    claim: "NVIDIA hiring 12 senior engineers in Santa Clara",
    confidence: 0.7,
    sourceUrl: "https://linkedin.com/..."
  }
```

**UI Update:** "4 facts extracted from raw evidence"

---

### Phase 3: Classification

Classifier subscribes to FactExtracted events.

```
FROM fact_001 (price drop):
  CLASSIFY: primary=finance, secondary=[security] (price drop = finance signal + vendor stability)
  EMIT: FactClassified { factId: "fact_001", primaryLens: "finance", secondaryLenses: ["security"], confidence: 0.9 }

FROM fact_002 (guidance cut):
  CLASSIFY: primary=finance, secondary=[gtm, security] (guidance cut = finance + competitor opportunity + vendor risk)
  EMIT: FactClassified { factId: "fact_002", primaryLens: "finance", secondaryLenses: ["gtm", "security"], confidence: 0.85 }

FROM fact_003 (TSMC delay):
  CLASSIFY: primary=security, secondary=[finance, gtm] (supply chain = security + financial impact + competitor can steal share)
  EMIT: FactClassified { factId: "fact_003", primaryLens: "security", secondaryLenses: ["finance", "gtm"], confidence: 0.8 }

FROM fact_004 (hiring):
  CLASSIFY: primary=gtm, secondary=[]
  EMIT: FactClassified { factId: "fact_004", primaryLens: "gtm", secondaryLenses: [], confidence: 0.7 }
```

**UI Update:** Classification table appears. Fact_001 → Finance+Security. Fact_003 → Security+Finance+GTM. 

**This is the "one fact, multiple lenses" moment that wins hackathons.**

---

### Phase 4: Lens Analysis (Parallel)

#### FinanceLens
```
SUBSCRIBE: FactClassified where primaryLens=finance OR secondaryLenses includes finance
RECEIVES: fact_001, fact_002, fact_003

NEUTRAL_RECALL: "all recent signals for NVIDIA" → retrieves 3 facts from Cognee
VERIFY_FRESH: fact_001 scraped 2 min ago (fresh), fact_002 scraped 2 min ago (fresh), fact_003 scraped 2 min ago (fresh)

LLM_ANALYZE (AI/ML API - DeepSeek for reasoning):
  "Analyze these facts through the FINANCE lens:
   - NVDA down 5.2%
   - Q2 guidance cut $2B
   - TSMC 3nm delay 6 weeks
   
   Produce: headline, synthesis, confidence, reasoning chain."

OUTPUT: "NVIDIA faces near-term earnings pressure from TSMC supply constraints. 
         Stock already pricing in partial risk. Guidance cut magnitude suggests 
         broader demand softness, not just supply."

STORE_FINDING: Cognee dataset=lens_findings
EMIT: LensAnalysisComplete {
  lens: "finance",
  finding: { headline: "NVIDIA earnings pressure from supply constraints", ... },
  score: 78,
  reasoningChain: [
    { step: "recall", detail: "Retrieved 3 facts from Cognee", timestamp: "..." },
    { step: "verify", detail: "All facts fresh (< 5 min old)", timestamp: "..." },
    { step: "analyze", detail: "LLM reasoning: supply constraint → earnings risk", timestamp: "..." },
    { step: "score", detail: "Score 78/100: high confidence, moderate severity", timestamp: "..." }
  ],
  confidence: 0.82
}
```

#### SecurityLens
```
SUBSCRIBE: FactClassified where primaryLens=security OR secondaryLenses includes security
RECEIVES: fact_001, fact_002, fact_003

NEUTRAL_RECALL: "all recent signals for NVIDIA"
VERIFY_FRESH: all fresh

LLM_ANALYZE (AI/ML API - Claude for reports):
  "Analyze through SECURITY lens: TSMC delay + guidance cut + price drop.
   Vendor risk? Supply chain stress? Brand exposure?"

OUTPUT: "TSMC single-source dependency is a critical vulnerability. 
         6-week delay on 3nm impacts NVIDIA's flagship Blackwell roadmap. 
         Competitors with Samsung/Intel foundry relationships may gain share."

STORE_FINDING: Cognee
EMIT: LensAnalysisComplete {
  lens: "security",
  finding: { headline: "TSMC single-source dependency creates vendor risk", ... },
  score: 85,
  reasoningChain: [...],
  confidence: 0.85
}
```

#### GTMLens
```
SUBSCRIBE: FactClassified where primaryLens=gtm OR secondaryLenses includes gtm
RECEIVES: fact_002, fact_003, fact_004

NEUTRAL_RECALL: "all recent signals for NVIDIA"
LLM_ANALYZE:
  "Analyze through GTM lens: guidance cut + TSMC delay + hiring surge.
   Competitor opportunity? Buying intent signals? Account enrichment?"

OUTPUT: "NVIDIA's supply constraint creates a window for AMD/Intel enterprise AI sales. 
         Hiring surge in engineering suggests long-term confidence but near-term delivery risk. 
         Enterprise buyers may delay commitments or evaluate alternatives."

STORE_FINDING: Cognee
EMIT: LensAnalysisComplete {
  lens: "gtm",
  finding: { headline: "Competitor opportunity window opening for NVIDIA alternatives", ... },
  score: 72,
  reasoningChain: [...],
  confidence: 0.75
}
```

**UI Update:** Three score rings appear. Finance: 78/100. Security: 85/100. GTM: 72/100. Each ring is clickable to see the full reasoning chain.

---

### Phase 5: Correlation

CorrelationEngine subscribes to LensAnalysisComplete events.

```
GATHER_LATEST: For NVIDIA, within last 15 minutes:
  - FinanceLens: score 78, confidence 0.82
  - SecurityLens: score 85, confidence 0.85
  - GTMLens: score 72, confidence 0.75
  → 3 lenses active ✓

CHECK_TIME_WINDOW: All within 4 minutes ✓

DEDUPLICATE_BY_SOURCE:
  - Finance cites: yahoo.com, reuters.com, digitimes.com
  - Security cites: reuters.com, digitimes.com
  - GTM cites: reuters.com, digitimes.com, linkedin.com
  → 4 unique sources ✓ (not just 3 "findings" echoing same data)

DETECT_CONTRADICTIONS:
  - Finance: "earnings pressure, demand softness"
  - Security: "vendor risk, supply chain stress"
  - GTM: "competitor opportunity, hiring surge"
  → No direct contradictions. All point to "supply constraint → negative near-term"
  → GTM hiring is a *counter-signal* but not contradictory (long-term vs near-term)
  → Mark as "mixed but coherent"

COMPUTE_COMPOSITE_SCORE:
  weighted_avg(78, 85, 72) = 78.3
  + cross_lens_bonus(3 lenses) = +5
  - contradiction_penalty(0) = 0
  = 83.3/100

EMIT: ConvergenceDetected {
  company: "NVIDIA",
  signals: [financeFinding, securityFinding, gtmFinding],
  compositeScore: 83,
  contradictions: [],
  verdict: "converged",
  timestamp: "2026-05-29T10:04:00Z"
}
```

**UI Update:** Convergence card flashes. "NVIDIA: 3-lens convergence detected. Composite score 83/100. No contradictions."

---

### Phase 6: Brief

BriefWriter subscribes to ConvergenceDetected events where verdict="converged" and compositeScore > 70.

```
RECEIVE: ConvergenceDetected for NVIDIA (score 83)

COMPOSE_BRIEF (LLM - Claude for reports):
  "Write an executive brief synthesizing these three lens findings:
   [Finance: earnings pressure from supply constraints, score 78]
   [Security: TSMC single-source dependency risk, score 85]
   [GTM: competitor opportunity window opening, score 72]
   
   Include: summary, key risks, recommended actions, source URLs."

OUTPUT:
  "## NVIDIA Intelligence Brief (May 29, 2026)
   
   **Summary:** Three independent intelligence lenses have converged on 
   a supply-constraint narrative for NVIDIA. TSMC's 6-week 3nm delay is 
   the root cause, cascading into Q2 guidance cuts (-$2B), stock decline 
   (-5.2%), and competitive vulnerability.
   
   **Finance Lens (78/100):** Near-term earnings pressure. The magnitude 
   of the guidance cut suggests demand softness beyond pure supply 
   constraint. Watch for AMD guidance divergence next week.
   
   **Security Lens (85/100):** Critical vendor risk. TSMC single-source 
   dependency exposed. Recommend evaluating Samsung Foundry as 
   secondary source. Competitors with dual-source strategies gain 
   stability advantage.
   
   **GTM Lens (72/100):** Competitor opportunity window. Enterprise AI 
   buyers may delay NVIDIA commitments. AMD MI350 and Intel Gaudi 3 
   sales teams should target NVIDIA accounts in Q2.
   
   **Sources:** finance.yahoo.com, reuters.com, digitimes.com, linkedin.com
   **Confidence:** 83/100 (3-lens convergence, no contradictions)"

STORE: Cognee dataset=correlation_signals
EMIT: BriefReady { company: "NVIDIA", brief: {...} }
```

**UI Update:** Brief panel opens. Full executive brief with expandable lens sections. Source URLs linked. Composite score ring: 83/100 in violet.

---

### Phase 7: Alert

```
AlertDispatcher:
  - Emit SSE event to all connected dashboards
  - Push to Signal River (persistent feed)
  - (Optional) TriggerWare webhook for Slack/email
```

**UI Update:** Signal River shows new entry: "NVIDIA — 3-lens convergence (Finance 78, Security 85, GTM 72) — 2 minutes ago". Violet left-border.

---

## Self-Reflection: Where This Wins

### 1. **Auditability**
Every step is an event with a timestamp and payload. A judge can click "FinanceLens" and see:
- Which facts it analyzed (fact_001, fact_002, fact_003)
- Where those facts came from (Yahoo Finance, Reuters, DigiTimes)
- When they were scraped (2 min ago)
- The LLM reasoning chain (4 steps)
- The confidence score and how it was derived

**LedgerLens parallel:** Their L1/L2/L3 trust gate shows exactly this. We now have the same for intelligence analysis.

### 2. **Scrape Cache = Credit Survival**
SocialDataBot used a 2-hour-old cache. In the old system, every agent would re-scrape everything every 5 minutes. New system: 5 companies × 4 agents × 288 ticks/day = 5,760 scrapes/day. With cache: ~90% hit rate on social/news, ~60% on market. **~1,000 scrapes/day. 5,000/month lasts 5 days.** Still tight, but survivable for demo.

### 3. **No Black Box**
Old system: `agent.run(prompt)` returns text blob. New system: explicit state machine with named steps (recall → verify → analyze → score → store → emit). Each step has a UI representation.

### 4. **Contradiction Detection**
Old system: "2 lenses active = convergence." New system: "3 lenses active, but Finance says 'demand strong' and Security says 'demand weak' = contradicted, not converged." This is the difference between a toy and a tool.

### 5. **One Fact, Multiple Lenses**
The classifier explicitly marks secondary lenses. Fact_003 (TSMC delay) hits all three lenses. This is the core thesis of Argus — one scrape, three analyses — made visible and auditable.

---

## Self-Reflection: Where This Breaks

### 1. **Cognee Recall Still Unreliable**
Even with the "neutral recall first" rule, Cognee is a vector database. If it returns unrelated data, the lens agent analyzes garbage. **Mitigation:** We verify freshness (TTL check) and source URLs. If recall is garbage, we emit `AgentDegraded` and use only the facts from the current pipeline run.

### 2. **Classifier Can Misroute**
The LLM classifier might mark TSMC delay as "gtm only" and miss the security angle. **Mitigation:** We allow secondary lenses. Even a misrouted primary lens still gets the fact as secondary. But if the classifier is completely wrong, the lens agent won't see it.

### 3. **Cache Poisoning**
If Bright Data returns stale/wrong data and we cache it, all subsequent runs use poisoned data until TTL expires. **Mitigation:** Short TTLs (1h for prices, 6h for news, 24h for social). Cache stores `scraped_at` and `agent_id`. If contradiction detected, we invalidate conflicting caches.

### 4. **Backend Restart Still Loses In-Memory State**
The event bus and state store are in-memory. A restart loses active runs and step history. **Mitigation:** Store `runs` and `steps` in SQLite (Spectra SessionStore). On startup, replay incomplete runs from DB. This is a post-MVP fix.

### 5. **LLM Hallucination in Lens Analysis**
The lens agent might invent a "fact" not present in the evidence. **Mitigation:** Every finding must cite `source_url`s. The reasoning chain includes "verify" step that checks facts against evidence. CorrelationEngine deduplicates by source URL — hallucinated facts have no source and get filtered.

### 6. **Bright Data MCP Timeout**
If Bright Data times out, the entire collection phase stalls. **Mitigation:** 30s timeout with fallback: `scrape_as_markdown` → `scraping_browser` → `web_unlocker`. After 3 failures, emit `AgentDegraded` and continue with cached data or skip.

### 7. **Composite Score Gaming**
A low-quality signal in 3 lenses could score higher than a high-quality signal in 2 lenses. **Mitigation:** Composite score weights by individual lens confidence and applies a minimum threshold per lens (score > 60 to count).

### 8. **Demo Latency**
Full pipeline: 5 collection agents + 3 lens agents + correlation + brief = ~30-60 seconds. **Mitigation:** Demo mode with pre-warmed cache reduces to ~10 seconds. REPLAY mode with canned scenarios is instant.

---

## Credit Math (Survival Analysis)

| Mode | Scrapes/Run | Runs/Day | Total/Day | 5K Limit |
|------|------------|----------|-----------|----------|
| Old (no cache) | 20 (5 co × 4 agents) | 288 | 5,760 | **Dead in 21 hours** |
| New (50% cache) | 10 | 288 | 2,880 | **Dead in 42 hours** |
| New (75% cache) | 5 | 288 | 1,440 | **Dead in 3.5 days** |
| Demo (pre-warmed) | 2 | 50 | 100 | **Lasts 50 days** |
| Demo (replay) | 0 | ∞ | 0 | **Infinite** |

**Conclusion:** Cache is not optional. It's the difference between a demo that dies and a demo that survives.

---

## Implementation Order

1. **Event bus** (`events.ts`) — typed emitter with async handlers
2. **State store** (`state.ts`) — SQLite-backed run + step tracking
3. **Scrape cache** (`cache.ts`) — Cognee-backed with TTL
4. **Collection agents** — state machine with step emission
5. **Normalizer + Classifier** — fact extraction and lens routing
6. **Lens agents** — state machine with reasoning chain
7. **Correlation engine** — contradiction detection + composite score
8. **Brief writer** — subscription to convergence events
9. **Server refactor** — real agent status, SSE with generation tokens
10. **Frontend** — AgentFlowTimeline, score rings, demo mode toggle

---

## Files to Create/Modify

```
apps/backend/src/
  events.ts          [NEW] Typed event bus
  state.ts           [NEW] SQLite-backed state store
  cache.ts           [NEW] Scrape cache with Cognee + TTL
  pipeline.ts        [NEW] Event-driven pipeline orchestrator
  agents/
    collection.ts    [NEW] Collection agent state machines
    normalizer.ts    [NEW] Fact extraction from evidence
    classifier.ts    [NEW] Lens routing
    lenses.ts        [MODIFY] Refactor to event subscribers
    correlation.ts   [MODIFY] Contradiction-aware correlation
    briefwriter.ts   [NEW] Brief composition
  server.ts          [MODIFY] Real status, SSE gen tokens, routes

apps/frontend/
  components/
    agent-flow-timeline.tsx  [NEW] Vertical step list with progress
    audit-score-ring.tsx     [NEW] SVG score gauge
    demo-mode-toggle.tsx     [NEW] LIVE / CACHED / REPLAY
    evidence-receipt.tsx     [NEW] Raw Bright Data display
    reasoning-chain.tsx      [NEW] Expandable step chain
  lib/api.ts           [MODIFY] Generation token SSE, demo modes
```

---

*This architecture makes Argus defensible. Every claim has a receipt. Every analysis has a chain. Every convergence is checked for contradiction. The judge can ask "why?" at any step and get an answer.*
