/// <reference types="bun" />

/**
 * Typed Event Bus — the backbone of Argus v2
 *
 * Every pipeline step communicates through typed events.
 * No agent calls another agent directly. No sequential loops.
 * Subscribe → React → Emit. That's it.
 */

// ─── Event Types ───────────────────────────────────────────────────────────

export interface MonitorTick {
  company: string;
  mode: "live" | "cached" | "replay";
  runId: string;
  timestamp: string;
  type: "monitor_tick";
}

export interface EvidenceReceipt {
  costTier: 1 | 2 | 3 | 0; // 0=cache(free), 1=cheap, 2=medium, 3=expensive
  durationMs: number;
  method: string; // "structured_extractor" | "scrape_as_markdown" | "scraping_browser" | "web_unlocker" | "cache"
  raw: string;
  url: string;
}

export interface EvidenceCollected {
  agentId: string;
  company: string;
  dataType: "price" | "filing" | "social" | "supplier" | "news";
  fromCache: boolean;
  receipt: EvidenceReceipt;
  runId: string;
  scrapedAt: string;
  sourceUrl: string;
  type: "evidence_collected";
}

export interface FactExtracted {
  claim: string;
  company: string;
  confidence: number;
  evidence: EvidenceReceipt;
  factId: string;
  rawData: string;
  runId: string;
  scrapedAt: string;
  sourceUrl: string;
  type: "fact_extracted";
}

export interface FactClassified {
  claim: string;
  company: string;
  confidence: number;
  factId: string;
  primaryLens: "gtm" | "finance" | "security";
  rawData: string;
  reasoning: string;
  runId: string;
  secondaryLenses: Array<"gtm" | "finance" | "security">;
  sourceUrl: string;
  type: "fact_classified";
}

export interface ReasoningStep {
  detail: string;
  step: string;
  timestamp: string;
}

export interface LensFinding {
  citedFactIds: string[];
  confidence: number;
  headline: string;
  sourceUrls: string[];
  synthesis: string;
}

export interface LensAnalysisComplete {
  company: string;
  confidence: number;
  finding: LensFinding;
  lens: "gtm" | "finance" | "security";
  reasoningChain: ReasoningStep[];
  runId: string;
  score: number;
  type: "lens_analysis_complete";
}

export interface Contradiction {
  description: string;
  lensA: string;
  lensB: string;
  severity: "minor" | "major";
}

export interface ConvergenceDetected {
  company: string;
  compositeScore: number;
  contradictions: Contradiction[];
  runId: string;
  signals: LensFinding[];
  timestamp: string;
  type: "convergence_detected";
  verdict: "converged" | "contradicted" | "insufficient";
}

export interface ExecutiveBrief {
  headline: string;
  keyFindings: string[];
  recommendation: string;
  riskScore: number;
  sources: string[];
  summary: string;
}

export interface BriefReady {
  brief: ExecutiveBrief;
  company: string;
  runId: string;
  timestamp: string;
  type: "brief_ready";
}

export interface AgentDegraded {
  agentId: string;
  fallback: string;
  operation: string;
  reason: string;
  runId: string;
  timestamp: string;
  type: "agent_degraded";
}

export interface StepEmitted {
  agentId: string;
  detail: string;
  label: string;
  lens?: string;
  progress: number;
  runId: string;
  status: "running" | "success" | "failed" | "skipped";
  step: number;
  timestamp: string;
  type: "step_emitted";
}

export type ArgusEvent =
  | MonitorTick
  | EvidenceCollected
  | FactExtracted
  | FactClassified
  | LensAnalysisComplete
  | ConvergenceDetected
  | BriefReady
  | AgentDegraded
  | StepEmitted;

// ─── Event Bus ─────────────────────────────────────────────────────────────

type Handler<T extends ArgusEvent> = (event: T) => void | Promise<void>;

const subscribers = new Map<string, Set<Handler<ArgusEvent>>>();

function getHandlers(eventType: string): Set<Handler<ArgusEvent>> {
  if (!subscribers.has(eventType)) {
    subscribers.set(eventType, new Set());
  }
  return subscribers.get(eventType)!;
}

export function on<T extends ArgusEvent["type"]>(
  eventType: T,
  handler: Handler<Extract<ArgusEvent, { type: T }>>
): () => void {
  const handlers = getHandlers(eventType);
  const wrapped = wrappedHandler(handler as Handler<ArgusEvent>);
  handlers.add(wrapped);
  return () => handlers.delete(wrapped);
}

function wrappedHandler(handler: Handler<ArgusEvent>): Handler<ArgusEvent> {
  return async (event) => {
    try {
      await handler(event);
    } catch (err) {
      console.error(`[event-bus] handler failed for ${event.type}:`, err);
    }
  };
}

export function emit(event: ArgusEvent): void {
  const handlers = getHandlers(event.type);
  for (const handler of handlers) {
    handler(event);
  }
}

// ─── Step Helper ───────────────────────────────────────────────────────────

export function emitStep(
  runId: string,
  agentId: string,
  step: number,
  label: string,
  detail: string,
  status: StepEmitted["status"],
  progress: number,
  lens?: string
): void {
  emit({
    type: "step_emitted",
    runId,
    agentId,
    step,
    label,
    detail,
    status,
    progress,
    timestamp: new Date().toISOString(),
    lens,
  });
}

// ─── Credit Tracker ────────────────────────────────────────────────────────

interface CreditLog {
  agentId: string;
  costTier: number;
  estimatedCost: number; // approximate Bright Data credit units
  operation: string;
  timestamp: string;
}

const creditLogs: CreditLog[] = [];
const CREDIT_ESTIMATES = {
  0: 0, // cache
  1: 0.5, // structured extractor / SERP
  2: 1.5, // scrape_as_markdown
  3: 3.0, // scraping_browser / web_unlocker
};

export function logCredit(
  agentId: string,
  operation: string,
  costTier: number
): void {
  creditLogs.push({
    timestamp: new Date().toISOString(),
    agentId,
    operation,
    costTier,
    estimatedCost:
      CREDIT_ESTIMATES[costTier as keyof typeof CREDIT_ESTIMATES] ?? 1,
  });

  // Warn if we're burning too fast
  const lastHour = creditLogs.filter(
    (l) => new Date(l.timestamp).getTime() > Date.now() - 3_600_000
  );
  const hourCost = lastHour.reduce((s, l) => s + l.estimatedCost, 0);
  if (hourCost > 50) {
    console.warn(
      `[credit] ⚠ Burning ${hourCost.toFixed(1)} credits/hour. At this rate, 5K free tier lasts ${(5000 / (hourCost * 24)).toFixed(1)} days.`
    );
  }
}

export function getCreditStats(): {
  total: number;
  lastHour: number;
  last24h: number;
  byAgent: Record<string, number>;
} {
  const now = Date.now();
  const lastHour = creditLogs.filter(
    (l) => new Date(l.timestamp).getTime() > now - 3_600_000
  );
  const last24h = creditLogs.filter(
    (l) => new Date(l.timestamp).getTime() > now - 86_400_000
  );
  const byAgent: Record<string, number> = {};
  for (const l of creditLogs) {
    byAgent[l.agentId] = (byAgent[l.agentId] ?? 0) + l.estimatedCost;
  }
  return {
    total: creditLogs.reduce((s, l) => s + l.estimatedCost, 0),
    lastHour: lastHour.reduce((s, l) => s + l.estimatedCost, 0),
    last24h: last24h.reduce((s, l) => s + l.estimatedCost, 0),
    byAgent,
  };
}

// ─── Replay / Canned Scenarios ─────────────────────────────────────────────

export const REPLAY_SCENARIOS: Record<
  string,
  {
    label: string;
    description: string;
    events: ArgusEvent[];
  }
> = {
  nvidia_convergence: {
    label: "NVIDIA — 3-Lens Convergence (Supply Constraint)",
    description:
      "TSMC delay + earnings miss + competitor hiring → Finance, Security, GTM all converge.",
    events: [
      {
        type: "monitor_tick",
        runId: "replay_nvidia_001",
        company: "NVIDIA",
        timestamp: new Date().toISOString(),
        mode: "replay",
      },
      {
        type: "evidence_collected",
        runId: "replay_nvidia_001",
        agentId: "market-data-bot",
        company: "NVIDIA",
        dataType: "price",
        sourceUrl: "https://finance.yahoo.com/quote/NVDA",
        receipt: {
          raw: "NVDA: $112.34 (-5.2%)",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://finance.yahoo.com/quote/NVDA",
        },
        scrapedAt: new Date().toISOString(),
        fromCache: true,
      },
      {
        type: "evidence_collected",
        runId: "replay_nvidia_001",
        agentId: "news-data-bot",
        company: "NVIDIA",
        dataType: "news",
        sourceUrl:
          "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
        receipt: {
          raw: "NVIDIA cuts Q2 revenue guidance by $2B citing supply constraints from TSMC 3nm delays.",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
        },
        scrapedAt: new Date().toISOString(),
        fromCache: true,
      },
      {
        type: "evidence_collected",
        runId: "replay_nvidia_001",
        agentId: "supplier-data-bot",
        company: "NVIDIA",
        dataType: "supplier",
        sourceUrl: "https://digitimes.com/news/2026/tsmc-3nm-delay",
        receipt: {
          raw: "TSMC delays 3nm production ramp by 6 weeks, affecting NVIDIA Blackwell chip shipments.",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://digitimes.com/news/2026/tsmc-3nm-delay",
        },
        scrapedAt: new Date().toISOString(),
        fromCache: true,
      },
      {
        type: "fact_extracted",
        runId: "replay_nvidia_001",
        factId: "fact_nv_001",
        company: "NVIDIA",
        claim: "NVIDIA stock price dropped 5.2% to $112.34",
        sourceUrl: "https://finance.yahoo.com/quote/NVDA",
        scrapedAt: new Date().toISOString(),
        confidence: 0.9,
        evidence: {
          raw: "NVDA: $112.34 (-5.2%)",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://finance.yahoo.com/quote/NVDA",
        },
        rawData: "NVDA: $112.34 (-5.2%)",
      },
      {
        type: "fact_extracted",
        runId: "replay_nvidia_001",
        factId: "fact_nv_002",
        company: "NVIDIA",
        claim:
          "NVIDIA cuts Q2 revenue guidance by $2 billion due to supply constraints",
        sourceUrl:
          "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
        scrapedAt: new Date().toISOString(),
        confidence: 0.85,
        evidence: {
          raw: "NVIDIA cuts Q2 revenue guidance by $2B citing supply constraints from TSMC 3nm delays.",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
        },
        rawData:
          "NVIDIA cuts Q2 revenue guidance by $2B citing supply constraints from TSMC 3nm delays.",
      },
      {
        type: "fact_extracted",
        runId: "replay_nvidia_001",
        factId: "fact_nv_003",
        company: "NVIDIA",
        claim:
          "TSMC delays 3nm production by 6 weeks, impacting NVIDIA Blackwell chips",
        sourceUrl: "https://digitimes.com/news/2026/tsmc-3nm-delay",
        scrapedAt: new Date().toISOString(),
        confidence: 0.8,
        evidence: {
          raw: "TSMC delays 3nm production ramp by 6 weeks, affecting NVIDIA Blackwell chip shipments.",
          method: "cache",
          costTier: 0,
          durationMs: 50,
          url: "https://digitimes.com/news/2026/tsmc-3nm-delay",
        },
        rawData:
          "TSMC delays 3nm production ramp by 6 weeks, affecting NVIDIA Blackwell chip shipments.",
      },
      {
        type: "fact_classified",
        runId: "replay_nvidia_001",
        factId: "fact_nv_001",
        company: "NVIDIA",
        claim: "NVIDIA stock price dropped 5.2% to $112.34",
        sourceUrl: "https://finance.yahoo.com/quote/NVDA",
        primaryLens: "finance",
        secondaryLenses: ["security"],
        confidence: 0.9,
        reasoning:
          "Price movement is a primary finance signal; stock decline also indicates vendor stability concerns for security lens.",
        rawData: "NVIDIA stock price dropped 5.2% to $112.34 amid broader semiconductor sell-off.",
      },
      {
        type: "fact_classified",
        runId: "replay_nvidia_001",
        factId: "fact_nv_002",
        company: "NVIDIA",
        claim:
          "NVIDIA cuts Q2 revenue guidance by $2 billion due to supply constraints",
        sourceUrl:
          "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
        primaryLens: "finance",
        secondaryLenses: ["gtm", "security"],
        confidence: 0.85,
        reasoning:
          "Guidance cut is finance-primary; creates competitor opportunity (GTM) and reveals supply chain vulnerability (security).",
        rawData: "NVIDIA cuts Q2 revenue guidance by $2B citing Blackwell supply constraints from TSMC delays.",
      },
      {
        type: "fact_classified",
        runId: "replay_nvidia_001",
        factId: "fact_nv_003",
        company: "NVIDIA",
        claim:
          "TSMC delays 3nm production by 6 weeks, impacting NVIDIA Blackwell chips",
        sourceUrl: "https://digitimes.com/news/2026/tsmc-3nm-delay",
        primaryLens: "security",
        secondaryLenses: ["finance", "gtm"],
        confidence: 0.8,
        reasoning:
          "Supply chain disruption is security-primary; has direct financial impact (finance) and competitive positioning effect (GTM).",
      },
      {
        type: "lens_analysis_complete",
        runId: "replay_nvidia_001",
        lens: "finance",
        company: "NVIDIA",
        finding: {
          headline:
            "NVIDIA faces near-term earnings pressure from supply constraints",
          synthesis:
            "NVDA down 5.2% on Q2 guidance cut of $2B. The magnitude suggests demand softness beyond pure supply constraint. TSMC delay is the proximate cause, but the market is pricing in broader risk.",
          confidence: 0.82,
          sourceUrls: [
            "https://finance.yahoo.com/quote/NVDA",
            "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
            "https://digitimes.com/news/2026/tsmc-3nm-delay",
          ],
          citedFactIds: ["fact_nv_001", "fact_nv_002", "fact_nv_003"],
        },
        score: 78,
        reasoningChain: [
          {
            step: "recall",
            detail: "Retrieved 3 facts from Cognee",
            timestamp: new Date().toISOString(),
          },
          {
            step: "verify",
            detail: "All facts fresh (< 5 min old)",
            timestamp: new Date().toISOString(),
          },
          {
            step: "analyze",
            detail: "LLM reasoning: supply constraint → earnings risk",
            timestamp: new Date().toISOString(),
          },
          {
            step: "score",
            detail: "Score 78/100: high confidence, moderate severity",
            timestamp: new Date().toISOString(),
          },
        ],
        confidence: 0.82,
      },
      {
        type: "lens_analysis_complete",
        runId: "replay_nvidia_001",
        lens: "security",
        company: "NVIDIA",
        finding: {
          headline:
            "TSMC single-source dependency creates critical vendor risk",
          synthesis:
            "6-week delay on 3nm production impacts NVIDIA's flagship Blackwell roadmap. Single-source dependency on TSMC is a structural vulnerability. Competitors with Samsung/Intel foundry relationships may gain stability advantage.",
          confidence: 0.85,
          sourceUrls: [
            "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
            "https://digitimes.com/news/2026/tsmc-3nm-delay",
          ],
          citedFactIds: ["fact_nv_002", "fact_nv_003"],
        },
        score: 85,
        reasoningChain: [
          {
            step: "recall",
            detail: "Retrieved 3 facts from Cognee",
            timestamp: new Date().toISOString(),
          },
          {
            step: "verify",
            detail: "All facts fresh",
            timestamp: new Date().toISOString(),
          },
          {
            step: "analyze",
            detail: "LLM reasoning: single-source + delay = structural risk",
            timestamp: new Date().toISOString(),
          },
          {
            step: "score",
            detail: "Score 85/100: critical vendor risk with evidence",
            timestamp: new Date().toISOString(),
          },
        ],
        confidence: 0.85,
      },
      {
        type: "lens_analysis_complete",
        runId: "replay_nvidia_001",
        lens: "gtm",
        company: "NVIDIA",
        finding: {
          headline:
            "Competitor opportunity window opening for NVIDIA alternatives",
          synthesis:
            "NVIDIA's supply constraint creates a 6-12 week window for AMD/Intel enterprise AI sales. Enterprise buyers may delay commitments or evaluate alternatives. Hiring surge in engineering suggests long-term confidence but near-term delivery risk.",
          confidence: 0.75,
          sourceUrls: [
            "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
            "https://digitimes.com/news/2026/tsmc-3nm-delay",
            "https://linkedin.com/jobs/nvidia-engineering",
          ],
          citedFactIds: ["fact_nv_002", "fact_nv_003"],
        },
        score: 72,
        reasoningChain: [
          {
            step: "recall",
            detail: "Retrieved 3 facts from Cognee",
            timestamp: new Date().toISOString(),
          },
          {
            step: "verify",
            detail: "All facts fresh",
            timestamp: new Date().toISOString(),
          },
          {
            step: "analyze",
            detail:
              "LLM reasoning: supply constraint → competitive displacement",
            timestamp: new Date().toISOString(),
          },
          {
            step: "score",
            detail: "Score 72/100: moderate opportunity, timing-dependent",
            timestamp: new Date().toISOString(),
          },
        ],
        confidence: 0.75,
      },
      {
        type: "convergence_detected",
        runId: "replay_nvidia_001",
        company: "NVIDIA",
        signals: [
          {
            headline:
              "NVIDIA faces near-term earnings pressure from supply constraints",
            synthesis:
              "NVDA down 5.2% on Q2 guidance cut of $2B. The magnitude suggests demand softness beyond pure supply constraint.",
            confidence: 0.82,
            sourceUrls: [
              "https://finance.yahoo.com/quote/NVDA",
              "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
            ],
            citedFactIds: ["fact_nv_001", "fact_nv_002", "fact_nv_003"],
          },
          {
            headline:
              "TSMC single-source dependency creates critical vendor risk",
            synthesis:
              "6-week delay on 3nm production impacts NVIDIA's flagship Blackwell roadmap. Single-source dependency is a structural vulnerability.",
            confidence: 0.85,
            sourceUrls: [
              "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
              "https://digitimes.com/news/2026/tsmc-3nm-delay",
            ],
            citedFactIds: ["fact_nv_002", "fact_nv_003"],
          },
          {
            headline:
              "Competitor opportunity window opening for NVIDIA alternatives",
            synthesis:
              "NVIDIA's supply constraint creates a 6-12 week window for AMD/Intel enterprise AI sales.",
            confidence: 0.75,
            sourceUrls: [
              "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
              "https://digitimes.com/news/2026/tsmc-3nm-delay",
            ],
            citedFactIds: ["fact_nv_002", "fact_nv_003"],
          },
        ],
        compositeScore: 83,
        contradictions: [],
        verdict: "converged",
        timestamp: new Date().toISOString(),
      },
      {
        type: "brief_ready",
        runId: "replay_nvidia_001",
        company: "NVIDIA",
        brief: {
          headline:
            "NVIDIA Under Supply Constraint Pressure — Three Lenses Converge",
          summary:
            "TSMC's 6-week 3nm delay has cascaded into a Q2 guidance cut (-$2B), stock decline (-5.2%), and competitive vulnerability. All three intelligence lenses have independently converged on this narrative.",
          keyFindings: [
            "Finance: Earnings pressure from supply constraints (score 78/100)",
            "Security: TSMC single-source dependency creates vendor risk (score 85/100)",
            "GTM: Competitor opportunity window opening (score 72/100)",
            "Composite convergence score: 83/100 — high-confidence multi-lens signal",
          ],
          riskScore: 78,
          recommendation:
            "Investors: Watch for AMD guidance divergence next week. Security teams: Evaluate secondary foundry sources. GTM teams: Target NVIDIA accounts with alternative AI hardware solutions.",
          sources: [
            "https://finance.yahoo.com/quote/NVDA",
            "https://reuters.com/business/nvidia-cuts-guidance-2026-05-29/",
            "https://digitimes.com/news/2026/tsmc-3nm-delay",
          ],
        },
        timestamp: new Date().toISOString(),
      },
    ],
  },
};

export function emitReplayScenario(scenarioId: string): void {
  const scenario = REPLAY_SCENARIOS[scenarioId];
  if (!scenario) {
    console.error(`[replay] Scenario ${scenarioId} not found`);
    return;
  }
  console.log(`[replay] Emitting scenario: ${scenario.label}`);
  for (const event of scenario.events) {
    emit(event as ArgusEvent);
  }
}
