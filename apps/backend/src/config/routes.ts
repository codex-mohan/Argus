/// <reference types="bun" />

/**
 * Settings / Configuration API Routes
 */

import { getIndexedModelStats, indexModels } from "./indexer.ts";
import {
  getAgentConfig,
  getAllAgentConfigs,
  getAllPipelineConfig,
  getModelById,
  getModels,
  getUserSettings,
  setPipelineConfig,
  updateAgentConfig,
  upsertUserSettings,
} from "./store.ts";

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ─── Models ────────────────────────────────────────────────────────────────

export async function handleListModels(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") ?? undefined;
  const models = getModels(provider);
  return jsonResponse({ models, count: models.length });
}

export async function handleGetModel(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const modelId = url.searchParams.get("id");
  if (!modelId) {
    return jsonResponse({ error: "Model ID required" }, 400);
  }
  const model = getModelById(modelId);
  if (!model) {
    return jsonResponse({ error: "Model not found" }, 404);
  }
  return jsonResponse({ model });
}

export async function handleIndexModels(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { apiKey?: string } | undefined;
    const result = await indexModels(body?.apiKey);
    return jsonResponse(result);
  } catch {
    const result = await indexModels();
    return jsonResponse(result);
  }
}

export async function handleModelStats(): Promise<Response> {
  return jsonResponse(getIndexedModelStats());
}

// ─── Agent Config ─────────────────────────────────────────────────────────

export async function handleListAgentConfigs(): Promise<Response> {
  return jsonResponse({ agents: getAllAgentConfigs() });
}

export async function handleGetAgentConfig(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("id");
  if (!agentId) {
    return jsonResponse({ error: "Agent ID required" }, 400);
  }
  const config = getAgentConfig(agentId);
  if (!config) {
    return jsonResponse({ error: "Agent not found" }, 404);
  }
  return jsonResponse({ config });
}

export async function handleUpdateAgentConfig(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      agentId: string;
      enabled?: boolean;
      modelId?: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      toolsEnabled?: string[];
      pollIntervalMinutes?: number;
    };

    if (!body.agentId) {
      return jsonResponse({ error: "agentId required" }, 400);
    }

    updateAgentConfig(body.agentId, {
      enabled: body.enabled,
      modelId: body.modelId,
      systemPrompt: body.systemPrompt,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      toolsEnabled: body.toolsEnabled,
      pollIntervalMinutes: body.pollIntervalMinutes,
    });

    return jsonResponse({
      success: true,
      config: getAgentConfig(body.agentId),
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      400
    );
  }
}

// ─── Pipeline Config ────────────────────────────────────────────────────────

export async function handleListPipelineConfig(): Promise<Response> {
  return jsonResponse({ config: getAllPipelineConfig() });
}

export async function handleUpdatePipelineConfig(
  req: Request
): Promise<Response> {
  try {
    const body = (await req.json()) as { key: string; value: string };
    if (!body.key || body.value === undefined) {
      return jsonResponse({ error: "key and value required" }, 400);
    }
    setPipelineConfig(body.key, body.value);
    return jsonResponse({ success: true, key: body.key, value: body.value });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      400
    );
  }
}

// ─── User Settings ────────────────────────────────────────────────────────

export async function handleGetUserSettings(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "default";
  const settings = getUserSettings(userId);
  return jsonResponse({ settings: settings ?? null });
}

export async function handleUpdateUserSettings(
  req: Request
): Promise<Response> {
  try {
    const body = (await req.json()) as {
      userId?: string;
      defaultLens?: string;
      defaultModel?: string;
      emailNotifications?: boolean;
      slackWebhook?: string;
      theme?: string;
    };
    const userId = body.userId ?? "default";
    upsertUserSettings(userId, {
      defaultLens: body.defaultLens,
      defaultModel: body.defaultModel,
      emailNotifications: body.emailNotifications,
      slackWebhook: body.slackWebhook,
      theme: body.theme,
    });
    return jsonResponse({ success: true, settings: getUserSettings(userId) });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      400
    );
  }
}
