/// <reference types="bun" />

/**
 * Normalizer + Classifier — Event-driven fact extraction and lens routing
 *
 * Subscribes to EvidenceCollected events.
 * Extracts structured facts from raw evidence using LLM with expert prompt loaded from prompts/normalizer.md.
 * Classifies each fact into primary + secondary lenses.
 */

const PROMPT_DIR = `${import.meta.dir}/prompts`;
let normalizerPromptTemplate = "";
try {
  normalizerPromptTemplate = await Bun.file(
    `${PROMPT_DIR}/normalizer.md`
  ).text();
  console.log(
    `[normalizer] Loaded normalizer prompt (${normalizerPromptTemplate.length} chars)`
  );
} catch {
  console.warn(
    "[normalizer] Could not load normalizer.md, using inline fallback"
  );
}

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
  const rawText = receipt.raw;

  emitStep(
    runId,
    "normalizer",
    1,
    "Extract",
    `Extracting facts from ${agentId} (${rawText.length} chars)...`,
    "running",
    30
  );
  console.log(
    `[normalizer] ${agentId} evidence: ${dataType}, ${rawText.length} chars`
  );

  const facts: FactExtracted[] = [];

  // ─── Primary: LLM-based fact extraction ──────────────────────────────
  const apiKey = process.env.AIMLAPI_KEY;
  if (apiKey && rawText.length > 50) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.aimlapi.com/v1",
      });

      // Build the normalizer prompt — use loaded .md template if available, else inline
      const llmPrompt =
        normalizerPromptTemplate.length > 100
          ? normalizerPromptTemplate
              .replace("{sourceUrl}", sourceUrl)
              .replace("{dataType}", dataType)
              .replace("{content}", rawText.slice(0, 8000))
          : `Extract specific, quantitative facts from this scraped web content about ${company}. Do NOT summarize. Extract ONLY explicitly stated facts with numbers, dates, names, or percentages.

BAD fact (too vague): "Company faces challenges"
GOOD fact: "NVIDIA stock fell 5.2% to $112.34 on May 29, 2026"

For each fact provide:
- claim: A specific factual claim with at least one concrete data point
- confidence: 0.0-1.0 (structured data=0.9, full article=0.7, search snippet=0.5)
- lens: gtm | finance | security
- secondary (optional): second lens if applicable

SOURCE URL: ${sourceUrl}
DATA TYPE: ${dataType}

SCRAPED CONTENT:
${rawText.slice(0, 8000)}

Return JSON array only:
[{"claim": "...", "confidence": 0.X, "lens": "finance", "secondary": "gtm"}]`;

      const completion = await client.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: llmPrompt }],
        temperature: 0.1,
        max_completion_tokens: 4096,
      });

      const response = completion.choices[0]?.message?.content ?? "";
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as Array<{
            claim: string;
            confidence: number;
            lens: string;
            secondary?: string;
          }>;
          for (const item of parsed) {
            if (item.claim && item.confidence && item.lens) {
              facts.push({
                type: "fact_extracted",
                runId,
                factId: generateId(),
                company,
                claim: item.claim,
                sourceUrl,
                scrapedAt: event.scrapedAt,
                confidence: Math.min(1, Math.max(0, item.confidence)),
                evidence: receipt,
                rawData: rawText.slice(0, 3000),
                suggestedLens: item.lens as "gtm" | "finance" | "security",
                suggestedSecondary: item.secondary as
                  | "gtm"
                  | "finance"
                  | "security"
                  | undefined,
              });
            }
          }
          console.log(
            `[normalizer] LLM extracted ${facts.length} facts from ${rawText.length} chars`
          );
        } catch {
          /* JSON parse failed */
        }
      }
    } catch (err) {
      console.log(
        `[normalizer] LLM extraction failed: ${err instanceof Error ? err.message : String(err)}, falling back to regex`
      );
    }
  }

  // ─── Fallback: regex-based extraction ─────────────────────────────────
  if (facts.length === 0 && rawText.length > 50) {
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
          rawData: rawText.slice(0, 3000),
        });
      }
    }

    // If still no facts, create a generic one
    if (facts.length === 0) {
      facts.push({
        type: "fact_extracted",
        runId,
        factId: generateId(),
        company,
        claim: `${company}: ${rawText.slice(0, 300)}`,
        sourceUrl,
        scrapedAt: event.scrapedAt,
        confidence: 0.4,
        evidence: receipt,
        rawData: rawText.slice(0, 3000),
      });
      console.log("[normalizer] No facts extracted — created generic fallback");
    }
  }

  console.log(`[normalizer] Extracted ${facts.length} facts (${dataType})`);

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
    const classification = fact.suggestedLens
      ? {
          primary: fact.suggestedLens,
          secondary: (fact.suggestedSecondary
            ? [fact.suggestedSecondary]
            : []) as Array<"gtm" | "finance" | "security">,
          reasoning: "LLM-classified",
        }
      : classifyFact(fact.claim, dataType);

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
      rawData: fact.rawData,
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
