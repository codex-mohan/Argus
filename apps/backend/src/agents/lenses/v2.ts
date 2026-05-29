/// <reference types="bun" />

/**
 * Lens Agents v2 — Event subscribers with reasoning chains
 *
 * Each lens independently subscribes to FactClassified events.
 * Batches facts per company, queries Cognee, analyzes with LLM.
 * System prompts are loaded from /prompts/*.md at startup.
 */

import { DATASETS } from "@argus/shared";
import { Agent } from "@mohanscodex/spectra-agent";
import { resolveAgentModel } from "../../config/store.ts";
import type {
  FactClassified,
  LensAnalysisComplete,
  ReasoningStep,
} from "../../events.ts";
import { emit, emitStep, on } from "../../events.ts";
import { callMcpTool } from "../../mcp/bridge.ts";
import { persistSignal } from "../../state.ts";

// ─── Fact Buffers ──────────────────────────────────────────────────────────

interface FactBuffer {
  facts: FactClassified[];
  timer: Timer | null;
}

const buffers = new Map<string, FactBuffer>(); // key: `${runId}:${lens}:${company}`

const BATCH_WINDOW_MS = 5000; // Wait 5s for all facts to arrive before analyzing

// ─── Lens LLM Agents (lazy, config-driven) ───────────────────────────────────

// Load prompts from .md files at startup (Bun.file is sync-capable via .text())
const PROMPT_DIR = `${import.meta.dir}/../prompts`;

async function loadPrompt(filename: string, fallback: string): Promise<string> {
  try {
    return await Bun.file(`${PROMPT_DIR}/${filename}`).text();
  } catch {
    console.warn(
      `[lenses] Could not load prompt file ${filename}, using fallback`
    );
    return fallback;
  }
}

// Eagerly load all lens prompts once at module init
const lensPrompts: Record<string, string> = {
  gtm: "",
  finance: "",
  security: "",
};

await Promise.all([
  loadPrompt(
    "lens-gtm.md",
    "You are the GTM Intelligence Lens. Analyze facts and produce a specific, data-anchored finding with HEADLINE, SYNTHESIS, CONFIDENCE, and SOURCES."
  ).then((p) => {
    lensPrompts.gtm = p;
  }),
  loadPrompt(
    "lens-finance.md",
    "You are the Finance Intelligence Lens. Analyze facts and produce a specific, quantified finding with HEADLINE, SYNTHESIS, CONFIDENCE, and SOURCES."
  ).then((p) => {
    lensPrompts.finance = p;
  }),
  loadPrompt(
    "lens-security.md",
    "You are the Security Intelligence Lens. Analyze facts and produce a specific, risk-anchored finding with HEADLINE, SYNTHESIS, CONFIDENCE, and SOURCES."
  ).then((p) => {
    lensPrompts.security = p;
  }),
]);

console.log(
  `[lenses] Loaded ${Object.keys(lensPrompts).length} lens prompts from .md files`
);

function getLensAgent(lens: "gtm" | "finance" | "security"): Agent {
  const model = resolveAgentModel(`${lens}-lens`);
  return new Agent({
    model,
    systemPrompt:
      lensPrompts[lens] ??
      `You are the ${lens.toUpperCase()} Intelligence Lens. Analyze facts and produce a specific finding with HEADLINE, SYNTHESIS, CONFIDENCE, and SOURCES.`,
    tools: [],
  });
}

// ─── Cognee Helpers ────────────────────────────────────────────────────────

async function cogneeRecall(query: string, dataset?: string): Promise<string> {
  try {
    const result = await callMcpTool("cognee", "recall", {
      query,
      dataset_name: dataset,
      top_k: 5,
    });
    const contents = result.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    return (
      contents
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n") ?? ""
    );
  } catch {
    return "";
  }
}

async function cogneeRemember(
  data: Record<string, unknown>,
  dataset: string
): Promise<void> {
  try {
    await callMcpTool("cognee", "remember", {
      data: JSON.stringify(data),
      dataset_name: dataset,
    });
  } catch {
    // Degraded — continue without memory
  }
}

// ─── Lens Analysis Handler ─────────────────────────────────────────────────

async function analyzeLens(
  lens: "gtm" | "finance" | "security",
  runId: string,
  company: string,
  facts: FactClassified[]
): Promise<void> {
  console.log(
    `[lenses] analyzeLens: ${lens} for ${company} (${facts.length} facts)`
  );
  emitStep(
    runId,
    `${lens}-lens`,
    1,
    "Recall",
    `${lens.toUpperCase()}Lens recalling Cognee for ${company}...`,
    "running",
    20,
    lens
  );

  const chain: ReasoningStep[] = [];
  const now = new Date().toISOString();

  // 1. Neutral recall
  const recallQuery = `all recent signals for ${company}`;
  const recalled = await cogneeRecall(recallQuery, DATASETS.lens_findings);
  chain.push({
    step: "recall",
    detail: `Neutral recall: "${recallQuery}"`,
    timestamp: now,
  });

  // 2. Verify freshness of recalled data
  const freshFacts = facts;
  if (recalled) {
    chain.push({
      step: "verify",
      detail: `Retrieved ${recalled.length} chars of prior context`,
      timestamp: now,
    });
    // If recalled data is very old, we might want to flag it, but for now we proceed
  }

  emitStep(
    runId,
    `${lens}-lens`,
    2,
    "Analyze",
    `${lens.toUpperCase()}Lens analyzing ${facts.length} facts for ${company}...`,
    "running",
    60,
    lens
  );

  // 3. Build prompt with raw scraped data
  const factsText = freshFacts
    .map(
      (f) =>
        `- [${f.confidence.toFixed(2)}] Source: ${f.sourceUrl}\n  Claim: ${f.claim}\n  Raw Data: ${(f.rawData ?? "").slice(0, 800)}`
    )
    .join("\n\n");

  const prompt = `You are the ${lens.toUpperCase()} Lens. Analyze the following scraped web data about ${company}. Use the RAW DATA (actual web content) for substantive analysis — don't just summarize the claim.

SCRAPED WEB DATA FOR ${company.toUpperCase()}:
${factsText}

${recalled ? `Prior intelligence memory:\n${recalled.slice(0, 1500)}\n\n` : ""}

TASK:
1. Analyze the raw web data for key facts, numbers, trends, and signals
2. Cross-reference information across multiple sources when available
3. Produce:

HEADLINE: (one-line specific insight — include numbers if available)
SYNTHESIS: (2-3 sentences with specifics from the data — cite figures, dates, names)
CONFIDENCE: (0.0-1.0 based on data quality: structured extractor=0.8+, markdown scrape=0.6+, search snippet=0.5)
SOURCES: url1, url2

BE SPECIFIC. Don't be vague. If a price is $942, say $942. If hiring increased 15%, say 15%. Use the actual numbers from the raw data.`;

  // 4. LLM Analysis
  let headline = `${company} — ${lens.toUpperCase()} analysis`;
  let synthesis = `Analyzed ${facts.length} facts for ${company}.`;
  // Base confidence from fact quality, not hardcoded 0.7
  let confidence =
    facts.length > 0
      ? facts.reduce((sum, f) => sum + f.confidence, 0) / facts.length
      : 0.5;
  const sourceUrls = [...new Set(facts.map((f) => f.sourceUrl))];

  try {
    const agent = getLensAgent(lens);
    console.log(
      `[lenses] ${lens}/${company}: calling LLM (${prompt.length} chars prompt)...`
    );
    const events: unknown[] = [];
    for await (const event of agent.run(prompt)) {
      events.push(event);
    }
    console.log(
      `[lenses] ${lens}/${company}: LLM returned ${events.length} events`
    );

    // Extract final text
    let text = "";
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i] as Record<string, unknown>;
      if (e.type === "done") {
        const msg = e.message as Record<string, unknown>;
        const blocks =
          (msg.content as Array<{ type: string; text?: string }>) ?? [];
        text = blocks
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("");
        break;
      }
    }

    if (text) {
      const hl = text.match(/HEADLINE:\s*(.+)/i);
      const syn = text.match(/SYNTHESIS:\s*(.+)/is);
      const conf = text.match(/CONFIDENCE:\s*(0\.\d+|1\.0|1)/i);
      const src = text.match(/SOURCES:\s*(.+)/i);

      if (hl) {
        headline = hl[1]!.trim();
      }
      if (syn) {
        synthesis = syn[1]!.trim();
      }
      if (conf) {
        confidence = Number.parseFloat(conf[1]!);
      }
      if (src) {
        const extra = src[1]!.split(/,\s*/).filter((u) => u.startsWith("http"));
        sourceUrls.push(...extra);
      }
    }
  } catch (err) {
    console.error(
      `[lenses] ${lens}/${company}: LLM failed — ${err instanceof Error ? err.message : String(err)}`
    );
    emitStep(
      runId,
      `${lens}-lens`,
      3,
      "Failed",
      `LLM analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      "failed",
      100,
      lens
    );
    return;
  }

  // 5. Compute score (0-100)
  const score = Math.round(confidence * 100);

  chain.push({
    step: "analyze",
    detail: `LLM produced ${headline.slice(0, 60)}...`,
    timestamp: new Date().toISOString(),
  });
  chain.push({
    step: "score",
    detail: `Score ${score}/100 (confidence ${confidence.toFixed(2)})`,
    timestamp: new Date().toISOString(),
  });
  console.log(
    `[lenses] ${lens}/${company}: complete — score ${score}/100, confidence ${confidence.toFixed(2)}, headline: ${headline.slice(0, 80)}`
  );

  // 6. Store finding in Cognee
  const finding = {
    headline,
    synthesis,
    confidence,
    sourceUrls: [...new Set(sourceUrls)].slice(0, 5),
    citedFactIds: facts.map((f) => f.factId),
  };

  await cogneeRemember(
    {
      source_url:
        sourceUrls[0] ?? `https://argus.internal/lens/${lens}/${company}`,
      scraped_at: new Date().toISOString(),
      agent_id: `${lens}-lens`,
      confidence,
      data_type: "lens_finding",
      content: `${headline}\n\n${synthesis}`,
      raw_extract: finding,
    },
    DATASETS.lens_findings
  );

  // 7. Persist as signal
  const signalId = `sig_${lens}_${Date.now()}`;
  persistSignal({
    id: signalId,
    lens,
    severity: confidence > 0.85 ? "high" : confidence > 0.7 ? "medium" : "low",
    headline,
    synthesis,
    source_urls: finding.sourceUrls,
    confidence,
    agent_id: `${lens}-lens`,
    detected_at: new Date().toISOString(),
  });

  emitStep(
    runId,
    `${lens}-lens`,
    3,
    "Complete",
    `${lens.toUpperCase()}Lens: ${headline.slice(0, 60)} (score: ${score})`,
    "success",
    100,
    lens
  );

  // 8. Emit completion event
  const completion: LensAnalysisComplete = {
    type: "lens_analysis_complete",
    runId,
    lens,
    company,
    finding,
    score,
    reasoningChain: chain,
    confidence,
  };

  emit(completion);
}

// ─── Event Subscription ────────────────────────────────────────────────────

on("fact_classified", async (event: FactClassified) => {
  const { runId, primaryLens, company, secondaryLenses } = event;

  // A fact goes to its primary lens AND any secondary lenses
  const targetLenses = [primaryLens, ...secondaryLenses];

  for (const lens of targetLenses) {
    const bufferKey = `${runId}:${lens}:${company}`;

    if (!buffers.has(bufferKey)) {
      buffers.set(bufferKey, { facts: [], timer: null });
    }

    const buffer = buffers.get(bufferKey)!;
    buffer.facts.push(event);

    // Reset timer — wait for more facts in batch window
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }

    buffer.timer = setTimeout(() => {
      const facts = buffer.facts;
      buffers.delete(bufferKey);

      if (facts.length > 0) {
        analyzeLens(lens, runId, company, facts).catch((err) => {
          console.error(`[${lens}-lens] Analysis failed:`, err);
        });
      }
    }, BATCH_WINDOW_MS);
  }
});

console.log("[agents/lenses] 3 lens agents registered as event subscribers");
