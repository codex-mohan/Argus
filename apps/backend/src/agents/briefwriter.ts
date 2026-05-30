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
Do NOT use vague phrases like "Multiple intelligence lenses have converged".`;
}

import { Agent, defineTool } from "@mohanscodex/spectra-agent";
import type { ToolResult } from "@mohanscodex/spectra-agent";
import { z } from "zod";
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

// BriefSchema — Zod schema for structured tool output
const BriefSchema = z.object({
  headline: z
    .string()
    .describe(
      "One impactful line — company name + specific finding (number/date/name) + action. BANNED: 'Multiple intelligence lenses', 'signals converge', CIK numbers."
    ),
  summary: z
    .string()
    .describe(
      "2-3 paragraphs. P1: what happened (cite GTM/Finance/Security by name with specific numbers). P2: cross-lens synthesis — what does it mean together. P3 optional: what to watch."
    ),
  keyFindings: z
    .array(z.string())
    .min(2)
    .describe(
      "Each finding: [LENS] Specific claim with number — source: domain.com"
    ),
  riskScore: z.number().int().min(0).max(100),
  riskReasoning: z
    .string()
    .describe("One sentence explaining why this risk score"),
  recommendation: z
    .string()
    .describe(
      "2-3 specific actionable steps with timelines. Format: 1. Action because finding (timeline). 2. Action because finding (timeline)."
    ),
  sources: z.array(z.string()),
});

type BriefResult = z.infer<typeof BriefSchema>;

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

  const prompt = `Write a substantive executive intelligence brief for ${company}. Use specific numbers, names, dates, and figures from the signal data below. Every claim must be grounded in evidence.

CORRELATED SIGNALS:
${signalsText}${contradictionText}

COMPOSITE RISK SCORE: ${compositeScore}/100

Be specific: if a signal mentions $942, say $942. If hiring increased 15%, say 15%. Cite which lens (GTM/Finance/Security) found each finding.

You MUST call the submit_brief tool. Do NOT write a text response.`;

  let headline = `${company} Intelligence Brief`;
  let summary = `Multiple intelligence lenses have converged on signals for ${company}.`;
  let keyFindings: string[] = signals.map((s: LensFinding) => s.headline);
  let riskScore = compositeScore;
  let recommendation = "Monitor situation and await further intelligence.";

  try {
    let capturedBrief: BriefResult | null = null;

    const submitBriefTool = defineTool({
      name: "submit_brief",
      description:
        "Submit the executive intelligence brief. You MUST call this tool.",
      parameters: BriefSchema,
      execute: async (args): Promise<ToolResult> => {
        capturedBrief = args;
        return { content: [{ type: "text", text: "Brief recorded." }] };
      },
    });

    const briefAgent = new Agent({
      model: resolveAgentModel("brief-writer"),
      systemPrompt: briefWriterSystemPrompt,
      tools: [submitBriefTool],
      maxTurns: 2,
      toolExecution: "sequential",
    });

    const fullPrompt = prompt;

    for await (const event of briefAgent.run(fullPrompt)) {
      // capturedBrief set in tool execute
      void event;
    }

    if (capturedBrief) {
      const b = capturedBrief as BriefResult;
      headline = b.headline;
      summary = b.summary;
      keyFindings = b.keyFindings;
      riskScore = Math.min(100, Math.max(0, b.riskScore));
      recommendation = b.recommendation;
      // Merge sources
      const extraUrls = b.sources.filter((u) => u.startsWith("http"));
      signals.forEach((s: LensFinding) => {
        s.sourceUrls = [...new Set([...s.sourceUrls, ...extraUrls])];
      });
    } else {
      console.warn(
        "[brief-writer] tool not called — using signal headlines as fallback"
      );
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
