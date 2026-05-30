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

import type { ToolResult } from "@mohanscodex/spectra-agent";
import { Agent, defineTool } from "@mohanscodex/spectra-agent";
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
      "Comprehensive 3-paragraph analysis providing a PROPER DESCRIPTION AND ANALYSIS. P1: Deep description of events (cite GTM/Finance/Security by name with specific numbers). P2: Cross-lens analytical synthesis — what does it mean together and what are the deeper implications. P3: Strategic outlook and specific catalysts/dates to watch."
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

  // Write briefs for any meaningful convergence
  if (event.verdict === "insufficient") {
    emitStep(
      runId,
      "brief-writer",
      1,
      "Skip",
      `Skipping brief for ${company}: insufficient signals (score ${compositeScore})`,
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

  // Build a grouped signal context so the LLM can cite each lens
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

  const groupedByLens = signals.reduce(
    (acc: Record<string, LensFinding[]>, s: LensFinding) => {
      const tag = lensTagFromSignal(s);
      (acc[tag] = acc[tag] ?? []).push(s);
      return acc;
    },
    {} as Record<string, LensFinding[]>
  );

  const signalsText = (["gtm", "finance", "security"] as const)
    .flatMap((lens) =>
      (groupedByLens[lens] ?? []).map(
        (s: LensFinding, i: number) =>
          `[${lens.toUpperCase()} Signal ${i + 1}]\nHeadline: ${s.headline}\nSynthesis: ${s.synthesis}\nConfidence: ${Math.round(s.confidence * 100)}%\nSources: ${s.sourceUrls.slice(0, 2).join(", ") || "none"}`
      )
    )
    .join("\n\n");

  const contradictionText =
    contradictions.length > 0
      ? `\n\nCONTRADICTIONS DETECTED:\n${contradictions.map((c: Contradiction) => `- ${c.lensA} vs ${c.lensB}: ${c.description} (${c.severity})`).join("\n")}`
      : "";

  const prompt = `CRITICAL INSTRUCTION: You MUST call the submit_brief tool. Do NOT write a text response — only a tool call is accepted.

Write a highly analytical executive intelligence brief for ${company} using the signal data below. The report MUST contain a proper, deep description and analysis of the situation. Every sentence must reference specific numbers, dates, or named facts from the signals. Do not just summarize; analyze the deeper strategic meaning of these combined signals.

COMPOSITE RISK SCORE: ${compositeScore}/100

SIGNALS BY LENS:
${signalsText}${contradictionText}

REQUIREMENTS:
- summary.P1: Comprehensive description of what is happening financially/competitively (use specific numbers from Finance + GTM lens)
- summary.P2: Analytical synthesis — why it matters, what the deeper implications are, and how the lens findings corroborate or contradict each other
- summary.P3: Strategic outlook — what specific catalysts, dates, or upcoming events to watch next
- keyFindings: at least one [GTM], one [FINANCE], one [SECURITY] finding with a number and source
- headline: must contain company name + a specific number/percentage/date + an action verb

Call submit_brief NOW. Failure to call the tool is unacceptable.`;

  // Inline fallback summary built from real signal data (used if LLM fails to call the tool)
  const fallbackSummary = (() => {
    const clean = (s: string) =>
      s
        .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
        .replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")
        .trim();
    const topFin = (groupedByLens["finance"] ?? []).sort(
      (a: LensFinding, b: LensFinding) => b.confidence - a.confidence
    )[0];
    const topGtm = (groupedByLens["gtm"] ?? []).sort(
      (a: LensFinding, b: LensFinding) => b.confidence - a.confidence
    )[0];
    const topSec = (groupedByLens["security"] ?? []).sort(
      (a: LensFinding, b: LensFinding) => b.confidence - a.confidence
    )[0];
    const parts: string[] = [];
    if (topFin?.synthesis && topFin.synthesis !== topFin.headline) {
      parts.push(clean(topFin.synthesis));
    }
    if (topGtm?.synthesis && topGtm.synthesis !== topGtm.headline) {
      parts.push(clean(topGtm.synthesis));
    }
    if (topSec?.synthesis && topSec.synthesis !== topSec.headline) {
      parts.push(clean(topSec.synthesis));
    }
    if (parts.length === 0) {
      signals.forEach((s: LensFinding) => parts.push(clean(s.headline)));
    }
    return parts.slice(0, 3).join("\n\n");
  })();

  const fallbackHeadline = (() => {
    const best = [...signals].sort(
      (a: LensFinding, b: LensFinding) => b.confidence - a.confidence
    )[0];
    return best
      ? best.headline
          .replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")
          .slice(0, 120)
      : `${company} Intelligence Brief`;
  })();

  let headline = fallbackHeadline;
  let summary = fallbackSummary;
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
      maxTurns: 6,
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
        "[brief-writer] tool not called — using inline signal synthesis as fallback"
      );
      // fallbackSummary and fallbackHeadline are already set above
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
