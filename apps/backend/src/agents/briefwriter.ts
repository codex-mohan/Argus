/// <reference types="bun" />

/**
 * Brief Writer — Event-driven executive brief composition
 *
 * Subscribes to ConvergenceDetected events with verdict="converged".
 * Composes polished intelligence briefs from correlated signals.
 * System prompt loaded from prompts/briefwriter.md at startup.
 */

const PROMPT_DIR = `${import.meta.dir}/prompts`;
let briefWriterSystemPrompt = "";
try {
  briefWriterSystemPrompt = await Bun.file(
    `${PROMPT_DIR}/briefwriter.md`
  ).text();
  console.log(
    `[brief-writer] Loaded briefwriter prompt (${briefWriterSystemPrompt.length} chars)`
  );
} catch {
  console.warn(
    "[brief-writer] Could not load briefwriter.md, using inline fallback"
  );
  briefWriterSystemPrompt = `You are the Argus Brief Writer. Synthesize correlated intelligence signals into executive briefs.
The HEADLINE must contain: company name + a specific number/date/percentage + an action verb.
Do NOT use vague phrases like "Multiple intelligence lenses have converged".
Format: HEADLINE / SUMMARY / KEY_FINDINGS (bullets) / RISK_SCORE / RECOMMENDATION / SOURCES`;
}

import { Agent } from "@mohanscodex/spectra-agent";
import { resolveAgentModel } from "../config/store.ts";
import type {
  BriefReady,
  Contradiction,
  ConvergenceDetected,
  ExecutiveBrief,
  LensFinding,
} from "../events.ts";
import { emit, emitStep, on } from "../events.ts";
import { persistBrief } from "../state.ts";

function getBriefAgent(): Agent {
  const model = resolveAgentModel("brief-writer");
  return new Agent({
    model,
    systemPrompt: briefWriterSystemPrompt,
    tools: [],
  });
}

on("convergence_detected", async (event: ConvergenceDetected) => {
  const { runId, company, signals, compositeScore, contradictions } = event;

  // Only write briefs for actual convergences (not contradictions or insufficient)
  if (event.verdict !== "converged" || compositeScore < 60) {
    emitStep(
      runId,
      "brief-writer",
      1,
      "Skip",
      `Skipping brief for ${company}: ${event.verdict} (score ${compositeScore})`,
      "skipped",
      100
    );
    return;
  }

  emitStep(
    runId,
    "brief-writer",
    1,
    "Compose",
    `Composing executive brief for ${company}...`,
    "running",
    50
  );

  // Build prompt from signals
  const signalsText = signals
    .map(
      (s: LensFinding, i: number) =>
        `[Signal ${i + 1}] ${s.headline}\nSynthesis: ${s.synthesis}\nConfidence: ${s.confidence}\nSources: ${s.sourceUrls.join(", ")}`
    )
    .join("\n\n");

  const contradictionText =
    contradictions.length > 0
      ? `\n\nCONTRADICTIONS DETECTED:\n${contradictions.map((c: Contradiction) => `- ${c.lensA} vs ${c.lensB}: ${c.description} (${c.severity})`).join("\n")}`
      : "";

  const prompt = `Write a substantive executive intelligence brief for ${company}. Use specific numbers, names, dates, and figures from the signal data below. Do NOT be vague.

CORRELATED SIGNALS:
${signalsText}${contradictionText}

COMPOSITE SCORE: ${compositeScore}/100

REQUIRED SECTIONS:
HEADLINE: One impactful line with a specific number or finding (e.g., "TSMC Q2 Guidance Cut by $2.4B as AI Demand Softens")
SUMMARY: 2-3 paragraphs with specific data points from the signals. Cite which lens provided each finding. Include confidence levels.
KEY_FINDINGS:
- At least 3 bullets, each with a specific data point and the lens that found it
RISK_SCORE: 0-100 (use the composite score as baseline, adjust if contradictions are severe)
RECOMMENDATION: 2-3 specific, actionable next steps based on the data
SOURCES: List all source URLs cited

BE SPECIFIC. If a signal mentions a price of $942, say $942. If hiring increased 15%, say 15%. If a filing date is mentioned, state it. Every claim must cite a source URL.`;

  let headline = `${company} Intelligence Brief`;
  let summary = `Multiple intelligence lenses have converged on signals for ${company}.`;
  let keyFindings: string[] = signals.map((s: LensFinding) => s.headline);
  let riskScore = compositeScore;
  let recommendation = "Monitor situation and await further intelligence.";

  try {
    const events: unknown[] = [];
    for await (const event of getBriefAgent().run(prompt)) {
      events.push(event);
    }

    // Extract text
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
      const sum = text.match(
        /SUMMARY:\s*([\s\S]+?)(?=KEY_FINDINGS:|RISK_SCORE:|$)/i
      );
      const kf = text.match(
        /KEY_FINDINGS:\s*([\s\S]+?)(?=RISK_SCORE:|RECOMMENDATION:|$)/i
      );
      const rs = text.match(/RISK_SCORE:\s*(\d+)/i);
      const rec = text.match(/RECOMMENDATION:\s*(.+)/i);

      if (hl) {
        headline = hl[1]!.trim();
      }
      if (sum) {
        summary = sum[1]!.trim();
      }
      if (kf) {
        keyFindings = kf[1]!
          .split("\n")
          .map((l) => l.trim().replace(/^-\s*/, ""))
          .filter((l) => l.length > 0);
      }
      if (rs) {
        riskScore = Number.parseInt(rs[1]!, 10);
      }
      if (rec) {
        recommendation = rec[1]!.trim();
      }
    }
  } catch (err) {
    console.error("[brief-writer] LLM failed:", err);
  }

  const brief: ExecutiveBrief = {
    headline,
    summary,
    keyFindings,
    riskScore,
    recommendation,
    sources: [
      ...new Set(signals.flatMap((s: LensFinding) => s.sourceUrls)),
    ].slice(0, 10),
  };

  // Compute dominant lens from the highest-confidence signal
  const dominantLens = signals.reduce(
    (best, s) => (s.confidence > best.confidence ? s : best),
    signals[0]!
  );
  // Map from LensFinding back to a lens tag — use the agent_id embedded in citedFactIds or fall back to finance
  // The correlated signals come from LensAnalysisComplete events which carry the lens name in their headline/synthesis
  const lensTagFromSignal = (
    sig: LensFinding
  ): "gtm" | "finance" | "security" => {
    const text = (sig.headline + " " + sig.synthesis).toLowerCase();
    if (
      text.includes("[gtm]") ||
      text.includes("gtm lens") ||
      text.includes("hiring") ||
      text.includes("competitor")
    ) {
      return "gtm";
    }
    if (
      text.includes("[security]") ||
      text.includes("security lens") ||
      text.includes("regulatory") ||
      text.includes("vendor risk")
    ) {
      return "security";
    }
    return "finance";
  };
  const primaryLens = lensTagFromSignal(dominantLens);

  // Persist
  persistBrief(runId, company, {
    company,
    generated_at: new Date().toISOString(),
    lens: primaryLens,
    executive_summary: summary,
    key_signals: signals.map((s: LensFinding) => ({
      id: `brief_sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      lens: lensTagFromSignal(s),
      severity:
        s.confidence >= 0.8 ? "high" : s.confidence >= 0.6 ? "medium" : "low",
      headline: s.headline,
      synthesis: s.synthesis,
      source_urls: s.sourceUrls,
      confidence: s.confidence,
      agent_id: "brief-writer",
      detected_at: new Date().toISOString(),
    })),
    correlation_notes: contradictions.map((c: Contradiction) => ({
      signal_a_id: c.lensA,
      signal_b_id: c.lensB,
      relationship: c.description,
      strength: c.severity === "major" ? 0.3 : 0.6,
    })),
    risk_score: riskScore,
    recommendation,
  });

  emitStep(
    runId,
    "brief-writer",
    2,
    "Complete",
    `Brief ready for ${company}: ${headline.slice(0, 60)}`,
    "success",
    100
  );

  const ready: BriefReady = {
    type: "brief_ready",
    runId,
    company,
    brief,
    timestamp: new Date().toISOString(),
  };

  emit(ready);
});

console.log("[agents/briefwriter] BriefWriter registered");
