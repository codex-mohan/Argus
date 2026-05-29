/// <reference types="bun" />

/**
 * Correlation Engine v2 — Contradiction-aware cross-lens correlation
 *
 * Subscribes to LensAnalysisComplete events.
 * Buffers findings per company, then correlates when 2+ lenses report.
 */

import type {
  Contradiction,
  ConvergenceDetected,
  LensAnalysisComplete,
} from "../../events.ts";
import { emit, emitStep, on } from "../../events.ts";
import { persistSignal } from "../../state.ts";

// ─── Buffers ───────────────────────────────────────────────────────────────

interface CorrelationBuffer {
  findings: LensAnalysisComplete[];
  timer: Timer | null;
}

const buffers = new Map<string, CorrelationBuffer>(); // key: `${runId}:${company}`

const CORRELATION_WINDOW_MS = 8000; // Wait 8s for all lenses to complete

// ─── Contradiction Detection ───────────────────────────────────────────────

const CONTRADICTION_PATTERNS: Array<{
  lensA: string;
  lensB: string;
  keywordsA: string[];
  keywordsB: string[];
  description: string;
  severity: "minor" | "major";
}> = [
  {
    lensA: "finance",
    lensB: "finance",
    keywordsA: ["bullish", "up", "growth", "beat"],
    keywordsB: ["bearish", "down", "decline", "miss"],
    description: "Finance lens signals contradict on market direction",
    severity: "major",
  },
  {
    lensA: "gtm",
    lensB: "security",
    keywordsA: ["opportunity", "growth", "expansion"],
    keywordsB: ["risk", "distress", "vulnerability", "breach"],
    description: "GTM opportunity conflicts with security risk",
    severity: "minor",
  },
  {
    lensA: "finance",
    lensB: "security",
    keywordsA: ["strong", "healthy", "growth"],
    keywordsB: ["distress", "risk", "delay", "lawsuit"],
    description: "Financial health contradicts security risk signals",
    severity: "major",
  },
];

function detectContradictions(
  findings: LensAnalysisComplete[]
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const a = findings[i]!;
      const b = findings[j]!;
      const textA = (
        a.finding.headline +
        " " +
        a.finding.synthesis
      ).toLowerCase();
      const textB = (
        b.finding.headline +
        " " +
        b.finding.synthesis
      ).toLowerCase();

      for (const pattern of CONTRADICTION_PATTERNS) {
        // Check if this pattern applies to this lens pair
        const lensMatch =
          (a.lens === pattern.lensA && b.lens === pattern.lensB) ||
          (a.lens === pattern.lensB && b.lens === pattern.lensA) ||
          (a.lens === pattern.lensA && b.lens === pattern.lensA); // Same-lens contradiction

        if (!lensMatch) {
          continue;
        }

        const hasA = pattern.keywordsA.some((kw) => textA.includes(kw));
        const hasB = pattern.keywordsB.some((kw) => textB.includes(kw));
        const hasA2 = pattern.keywordsA.some((kw) => textB.includes(kw));
        const hasB2 = pattern.keywordsB.some((kw) => textA.includes(kw));

        if ((hasA && hasB) || (hasA2 && hasB2)) {
          contradictions.push({
            lensA: a.lens,
            lensB: b.lens,
            description: pattern.description,
            severity: pattern.severity,
          });
        }
      }
    }
  }

  return contradictions;
}

// ─── Deduplication ─────────────────────────────────────────────────────────

function deduplicateBySource(
  findings: LensAnalysisComplete[]
): LensAnalysisComplete[] {
  const seenSources = new Set<string>();
  const unique: LensAnalysisComplete[] = [];

  for (const finding of findings) {
    const key = finding.finding.sourceUrls.sort().join("|");
    if (!seenSources.has(key)) {
      seenSources.add(key);
      unique.push(finding);
    }
  }

  return unique;
}

// ─── Composite Score ───────────────────────────────────────────────────────

function computeCompositeScore(
  findings: LensAnalysisComplete[],
  contradictions: Contradiction[]
): number {
  if (findings.length === 0) {
    return 0;
  }

  // Base: weighted average of lens scores
  const totalWeight = findings.reduce((s, f) => s + f.confidence, 0);
  const weightedAvg =
    findings.reduce((s, f) => s + f.score * f.confidence, 0) / totalWeight;

  // Bonus for cross-lens coverage
  const uniqueLenses = new Set(findings.map((f) => f.lens));
  const lensBonus =
    uniqueLenses.size >= 3 ? 8 : uniqueLenses.size === 2 ? 4 : 0;

  // Penalty for contradictions
  const contradictionPenalty = contradictions.reduce(
    (s, c) => s + (c.severity === "major" ? 10 : 5),
    0
  );

  // Minimum threshold: each lens must score > 60 to count
  const validLenses = findings.filter((f) => f.score >= 60);
  if (validLenses.length < 2) {
    return Math.round(weightedAvg * 0.5); // Heavy penalty for low-quality signals
  }

  return Math.max(
    0,
    Math.min(100, Math.round(weightedAvg + lensBonus - contradictionPenalty))
  );
}

// ─── Event Handler ─────────────────────────────────────────────────────────

on("lens_analysis_complete", async (event: LensAnalysisComplete) => {
  const { runId, company, lens } = event;
  const bufferKey = `${runId}:${company}`;

  if (!buffers.has(bufferKey)) {
    buffers.set(bufferKey, { findings: [], timer: null });
  }

  const buffer = buffers.get(bufferKey)!;
  buffer.findings.push(event);

  // Reset timer
  if (buffer.timer) {
    clearTimeout(buffer.timer);
  }

  buffer.timer = setTimeout(() => {
    const findings = buffer.findings;
    buffers.delete(bufferKey);

    emitStep(
      runId,
      "correlation-engine",
      1,
      "Gather",
      `Correlating ${findings.length} lens findings for ${company}...`,
      "running",
      40
    );

    // Need at least 2 lenses
    const uniqueLenses = new Set(findings.map((f) => f.lens));
    if (uniqueLenses.size < 2) {
      emitStep(
        runId,
        "correlation-engine",
        2,
        "Insufficient",
        `${company}: only ${uniqueLenses.size} lens(s) — need 2+`,
        "skipped",
        100
      );
      return;
    }

    emitStep(
      runId,
      "correlation-engine",
      2,
      "Dedup",
      `Deduplicating ${findings.length} findings by source...`,
      "running",
      60
    );

    // Deduplicate
    const deduped = deduplicateBySource(findings);

    emitStep(
      runId,
      "correlation-engine",
      3,
      "Detect",
      "Checking for contradictions...",
      "running",
      75
    );

    // Detect contradictions
    const contradictions = detectContradictions(deduped);

    emitStep(
      runId,
      "correlation-engine",
      4,
      "Score",
      "Computing composite score...",
      "running",
      90
    );

    // Compute composite
    const compositeScore = computeCompositeScore(deduped, contradictions);

    // Determine verdict
    let verdict: ConvergenceDetected["verdict"] = "insufficient";
    if (contradictions.length > 0) {
      verdict = "contradicted";
    } else if (compositeScore >= 60) {
      verdict = "converged";
    }

    emitStep(
      runId,
      "correlation-engine",
      5,
      verdict === "converged"
        ? "Converged"
        : verdict === "contradicted"
          ? "Contradicted"
          : "No Match",
      `${company}: ${uniqueLenses.size} lenses, score ${compositeScore}${contradictions.length > 0 ? `, ${contradictions.length} contradiction(s)` : ""}`,
      verdict === "converged" ? "success" : "skipped",
      100
    );

    // Persist convergence signal
    if (verdict === "converged" || verdict === "contradicted") {
      const dominantLens = deduped.reduce(
        (best, f) => (f.confidence > best.confidence ? f : best),
        deduped[0]!
      ).lens as "gtm" | "finance" | "security";
      persistSignal({
        id: `corr_${runId}_${Date.now()}`,
        lens: dominantLens,
        severity:
          compositeScore > 80 ? "high" : compositeScore > 60 ? "medium" : "low",
        headline: `${company}: ${verdict === "converged" ? "cross-lens convergence" : "cross-lens contradiction"} (${uniqueLenses.size} lenses, score ${compositeScore})`,
        synthesis: `Signals from ${Array.from(uniqueLenses).join(", ")} lenses ${verdict === "converged" ? "converged" : "showed contradictions"} for ${company}.${contradictions.length > 0 ? ` Contradictions: ${contradictions.map((c) => c.description).join("; ")}` : ""}`,
        source_urls: deduped.flatMap((f) => f.finding.sourceUrls).slice(0, 5),
        confidence: compositeScore / 100,
        agent_id: "correlation-engine",
        detected_at: new Date().toISOString(),
      });
    }

    // Emit event
    const convergence: ConvergenceDetected = {
      type: "convergence_detected",
      runId,
      company,
      signals: deduped.map((f) => f.finding),
      compositeScore,
      contradictions,
      verdict,
      timestamp: new Date().toISOString(),
    };

    emit(convergence);
  }, CORRELATION_WINDOW_MS);
});

console.log(
  "[agents/correlation] Contradiction-aware correlation engine registered"
);
