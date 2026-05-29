/// <reference types="bun" />

/**
 * Normalizer + Classifier — Event-driven fact extraction and lens routing
 *
 * Subscribes to EvidenceCollected events.
 * Extracts structured facts from raw evidence.
 * Classifies each fact into primary + secondary lenses.
 */

import type {
  EvidenceCollected,
  FactClassified,
  FactExtracted,
} from "../events.ts";
import { emit, emitStep, on } from "../events.ts";

function generateId(): string {
  return `fact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Fact Extraction Rules (deterministic, no LLM cost) ────────────────────

interface ExtractionRule {
  claimTemplate: string;
  confidence: number;
  dataType: string;
  pattern: RegExp;
}

const EXTRACTION_RULES: ExtractionRule[] = [
  // Price movements
  {
    pattern: /(\$[\d,]+\.?\d*)\s*\(?\s*([+-]?\d+\.?\d*)%?\s*\)?/i,
    claimTemplate: "Stock price at {match1} with change of {match2}%",
    confidence: 0.85,
    dataType: "price",
  },
  // Guidance cuts
  {
    pattern:
      /cuts?\s+(?:revenue\s+)?guidance\s+by\s+\$?(\d+\.?\d*)\s*(billion|million)?/i,
    claimTemplate: "Company cuts guidance by ${match1} {match2}",
    confidence: 0.9,
    dataType: "filing",
  },
  // Supply chain delays
  {
    pattern: /delay(?:s|ed)\s+(\d+)\s*(week|month|day)s?/i,
    claimTemplate: "Production delayed by {match1} {match2}s",
    confidence: 0.8,
    dataType: "supplier",
  },
  // Hiring signals
  {
    pattern: /hiring\s+(\d+)\s+\w+\s+(?:engineer|developer|manager|role)s?/i,
    claimTemplate: "Company hiring {match1} new positions",
    confidence: 0.75,
    dataType: "social",
  },
  // SEC filings
  {
    pattern: /(?:filed|8-K|10-K|10-Q)\s+(?:with\s+)?SEC/i,
    claimTemplate: "SEC filing detected",
    confidence: 0.85,
    dataType: "filing",
  },
  // Lawsuits / regulatory
  {
    pattern: /(?:lawsuit|sued|investigation|regulatory|fine|penalty)/i,
    claimTemplate: "Legal or regulatory action detected",
    confidence: 0.75,
    dataType: "supplier",
  },
  // Product launches
  {
    pattern:
      /(?:launches?|announces?|unveils?)\s+(?:new\s+)?([A-Za-z0-9\s]+(?:chip|processor|gpu|cpu|product))/i,
    claimTemplate: "New product launch: {match1}",
    confidence: 0.8,
    dataType: "news",
  },
];

// ─── Lens Classification Rules ─────────────────────────────────────────────

function classifyFact(
  claim: string,
  dataType: string
): {
  primary: "gtm" | "finance" | "security";
  secondary: Array<"gtm" | "finance" | "security">;
  reasoning: string;
} {
  const lower = claim.toLowerCase();
  const reasons: string[] = [];

  // Finance indicators
  const financeScore =
    (lower.includes("price") ? 2 : 0) +
    (lower.includes("guidance") ? 3 : 0) +
    (lower.includes("earnings") ? 3 : 0) +
    (lower.includes("revenue") ? 2 : 0) +
    (lower.includes("sec filing") ? 2 : 0) +
    (dataType === "price" ? 3 : 0) +
    (dataType === "filing" ? 2 : 0);

  // Security indicators
  const securityScore =
    (lower.includes("delay") ? 2 : 0) +
    (lower.includes("supplier") ? 3 : 0) +
    (lower.includes("lawsuit") ? 3 : 0) +
    (lower.includes("regulatory") ? 3 : 0) +
    (lower.includes("vendor") ? 2 : 0) +
    (dataType === "supplier" ? 3 : 0);

  // GTM indicators
  const gtmScore =
    (lower.includes("hiring") ? 2 : 0) +
    (lower.includes("launch") ? 2 : 0) +
    (lower.includes("competitor") ? 2 : 0) +
    (lower.includes("product") ? 1 : 0) +
    (dataType === "social" ? 2 : 0);

  const scores: Array<{ lens: "gtm" | "finance" | "security"; score: number }> =
    [
      { lens: "finance", score: financeScore },
      { lens: "security", score: securityScore },
      { lens: "gtm", score: gtmScore },
    ];

  scores.sort((a, b) => b.score - a.score);

  const primary = scores[0]!;
  const secondary = scores
    .slice(1)
    .filter((s) => s.score > 0)
    .map((s) => s.lens);

  if (primary.score > 0) {
    reasons.push(`Primary ${primary.lens} score: ${primary.score}`);
  }
  for (const sec of secondary) {
    const s = scores.find((x) => x.lens === sec);
    if (s) {
      reasons.push(`Secondary ${sec} score: ${s.score}`);
    }
  }

  return {
    primary: primary.lens,
    secondary,
    reasoning:
      reasons.join("; ") || "Low-confidence classification based on data type",
  };
}

// ─── Event Handlers ────────────────────────────────────────────────────────

on("evidence_collected", async (event: EvidenceCollected) => {
  const { runId, agentId, company, dataType, sourceUrl, receipt } = event;

  emitStep(
    runId,
    "normalizer",
    1,
    "Extract",
    `Extracting facts from ${agentId} evidence...`,
    "running",
    30
  );

  const rawText = receipt.raw;
  const facts: FactExtracted[] = [];

  // Apply extraction rules
  for (const rule of EXTRACTION_RULES) {
    const matches = rawText.match(rule.pattern);
    if (matches) {
      let claim = rule.claimTemplate;
      for (let i = 0; i < matches.length; i++) {
        claim = claim.replace(`{match${i}}`, matches[i] ?? "");
      }
      facts.push({
        type: "fact_extracted",
        runId,
        factId: generateId(),
        company,
        claim,
        sourceUrl,
        scrapedAt: event.scrapedAt,
        confidence: rule.confidence,
        evidence: receipt,
        rawData: rawText.slice(0, 1000),
      });
    }
  }

  // If no rules matched, create a low-confidence generic fact
  if (facts.length === 0 && rawText.length > 50) {
    facts.push({
      type: "fact_extracted",
      runId,
      factId: generateId(),
      company,
      claim: `${company}: ${rawText.slice(0, 120)}...`,
      sourceUrl,
      scrapedAt: event.scrapedAt,
      confidence: 0.5,
      evidence: receipt,
      rawData: rawText.slice(0, 1000),
    });
  }

  emitStep(
    runId,
    "normalizer",
    2,
    "Classify",
    `Classifying ${facts.length} facts for ${company}...`,
    "running",
    70
  );

  // Classify each fact
  for (const fact of facts) {
    const classification = classifyFact(fact.claim, dataType);

    const classified: FactClassified = {
      type: "fact_classified",
      runId,
      factId: fact.factId,
      company,
      claim: fact.claim,
      sourceUrl: fact.sourceUrl,
      primaryLens: classification.primary,
      secondaryLenses: classification.secondary,
      confidence: fact.confidence,
      reasoning: classification.reasoning,
    };

    emit(classified);
  }

  emitStep(
    runId,
    "normalizer",
    3,
    "Complete",
    `Normalized ${facts.length} facts for ${company}`,
    "success",
    100
  );
});

console.log("[agents/normalizer] Normalizer + Classifier registered");
