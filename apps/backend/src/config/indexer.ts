/// <reference types="bun" />

/**
 * AI/ML API Model Indexer
 *
 * Fetches available models from aimlapi.com/v1/models and stores
 * them in the local catalog for selection in settings.
 */

import { Database } from "bun:sqlite";
import { clearModelCatalog, type ModelEntry, storeModels } from "./store.ts";

const BASE_URL = "https://api.aimlapi.com/v1";

interface AimlApiModel {
  context_length?: number;
  id: string;
  object: string;
  owned_by?: string;
  pricing?: {
    prompt?: number;
    completion?: number;
  };
}

function normalizeModelId(id: string): string {
  return id;
}

function detectCapabilities(model: AimlApiModel): string[] {
  const caps: string[] = [];
  const id = model.id.toLowerCase();

  if (
    id.includes("claude") ||
    id.includes("gpt") ||
    id.includes("gemini") ||
    id.includes("kimi") ||
    id.includes("deepseek")
  ) {
    caps.push("chat");
  }
  if (
    id.includes("claude") ||
    id.includes("gpt-4") ||
    id.includes("o1") ||
    id.includes("deepseek-reasoner")
  ) {
    caps.push("reasoning");
  }
  if (id.includes("embedding") || id.includes("embed")) {
    caps.push("embeddings");
  }
  if (id.includes("vision") || id.includes("vl") || id.includes("multimodal")) {
    caps.push("vision");
  }
  if (
    id.includes("image") ||
    id.includes("dall") ||
    id.includes("flux") ||
    id.includes("stable")
  ) {
    caps.push("image");
  }
  if (id.includes("audio") || id.includes("whisper") || id.includes("tts")) {
    caps.push("audio");
  }
  if (caps.length === 0) {
    caps.push("chat");
  }

  return caps;
}

export async function indexModels(apiKey?: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const key = apiKey ?? process.env.AIMLAPI_KEY ?? "";

  if (!key) {
    return { success: false, count: 0, error: "AIMLAPI_KEY not set" };
  }

  try {
    const response = await fetch(`${BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        count: 0,
        error: `HTTP ${response.status}: ${text.slice(0, 300)}`,
      };
    }

    const raw = (await response.json()) as Record<string, unknown>;
    // Some providers return { data: [...] }, others return { models: [...] }, others return the array directly
    let models: AimlApiModel[] = [];
    if (Array.isArray(raw.data)) {
      models = raw.data as AimlApiModel[];
    } else if (Array.isArray(raw.models)) {
      models = raw.models as AimlApiModel[];
    } else if (Array.isArray(raw)) {
      models = raw as unknown as AimlApiModel[];
    }

    if (models.length === 0) {
      return { success: false, count: 0, error: `API returned 0 models. Response keys: ${Object.keys(raw).join(", ")}` };
    }

    console.log(`[indexer] Fetched ${models.length} models from AI/ML API`);

    // Log which providers exist in the response
    const providers = new Set<string>();
    for (const m of models) {
      providers.add(m.owned_by ?? m.id.split("/")[0] ?? "unknown");
    }
    console.log(`[indexer] Available providers: ${[...providers].sort().join(", ")}`);
    console.log(`[indexer] Sample model IDs: ${models.slice(0, 5).map((m) => m.id).join(", ")}`);

    const entries: ModelEntry[] = models.map((m) => ({
      modelId: normalizeModelId(m.id),
      name: m.id.split("/").pop() ?? m.id,
      provider: m.owned_by ?? m.id.split("/")[0] ?? "unknown",
      contextLength: m.context_length ?? null,
      costPer1mInput: m.pricing?.prompt ? m.pricing.prompt * 1_000_000 : null,
      costPer1mOutput: m.pricing?.completion
        ? m.pricing.completion * 1_000_000
        : null,
      capabilities: detectCapabilities(m),
      indexedAt: new Date().toISOString(),
    }));

    storeModels(entries);

    console.log(`[indexer] Stored ${entries.length} models in catalog`);

    return { success: true, count: entries.length };
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getIndexedModelStats(): {
  total: number;
  byProvider: Record<string, number>;
  byCapability: Record<string, number>;
  lastIndexed: string | null;
} {
  const db = new Database("argus_state.sqlite");

  const total = db.query("SELECT COUNT(*) as c FROM model_catalog").get() as {
    c: number;
  };

  const providers = db
    .query(
      "SELECT provider, COUNT(*) as c FROM model_catalog GROUP BY provider"
    )
    .all() as Array<Record<string, unknown>>;
  const byProvider: Record<string, number> = {};
  for (const p of providers) {
    byProvider[String(p.provider)] = Number(p.c);
  }

  const caps = db
    .query("SELECT capabilities FROM model_catalog")
    .all() as Array<{ capabilities: string }>;
  const byCapability: Record<string, number> = {};
  for (const row of caps) {
    const list = JSON.parse(row.capabilities) as string[];
    for (const c of list) {
      byCapability[c] = (byCapability[c] ?? 0) + 1;
    }
  }

  const last = db
    .query("SELECT MAX(indexed_at) as d FROM model_catalog")
    .get() as { d: string | null };

  db.close();

  return {
    total: total.c,
    byProvider,
    byCapability,
    lastIndexed: last?.d ?? null,
  };
}
