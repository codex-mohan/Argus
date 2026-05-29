/// <reference types="bun" />

/**
 * Configuration Store — SQLite-backed settings for models, agents, pipeline
 *
 * Every setting is persisted. No hardcoded defaults in code.
 * Models indexed from AI/ML API. Agent configs editable at runtime.
 */

import { Database } from "bun:sqlite";

const db = new Database("argus_state.sqlite");

// ─── Schema ────────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS model_catalog (
    model_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    context_length INTEGER,
    cost_per_1m_input REAL,
    cost_per_1m_output REAL,
    capabilities TEXT,
    indexed_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS agent_config (
    agent_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    model_id TEXT,
    system_prompt TEXT,
    max_tokens INTEGER DEFAULT 2000,
    temperature REAL DEFAULT 0.7,
    tools_enabled TEXT,
    poll_interval_minutes INTEGER,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipeline_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    default_lens TEXT DEFAULT 'finance',
    default_model TEXT,
    email_notifications INTEGER DEFAULT 0,
    slack_webhook TEXT,
    theme TEXT DEFAULT 'dark',
    updated_at TEXT NOT NULL
  )
`);

// ─── Default Pipeline Config ───────────────────────────────────────────────

const DEFAULT_CONFIG: Array<{
  key: string;
  value: string;
  description: string;
}> = [
  {
    key: "poll_interval_minutes",
    value: "5",
    description: "How often to run monitoring cycles",
  },
  {
    key: "cache_ttl_price",
    value: "60",
    description: "Price data cache TTL in minutes",
  },
  {
    key: "cache_ttl_news",
    value: "180",
    description: "News data cache TTL in minutes",
  },
  {
    key: "cache_ttl_social",
    value: "360",
    description: "Social data cache TTL in minutes",
  },
  {
    key: "cache_ttl_supplier",
    value: "720",
    description: "Supplier data cache TTL in minutes",
  },
  {
    key: "cache_ttl_filing",
    value: "1440",
    description: "Filing data cache TTL in minutes",
  },
  {
    key: "correlation_min_lenses",
    value: "2",
    description: "Minimum lenses required for correlation",
  },
  {
    key: "correlation_score_threshold",
    value: "60",
    description: "Minimum composite score to generate brief",
  },
  {
    key: "convergence_window_ms",
    value: "8000",
    description: "Milliseconds to wait for lens results before correlating",
  },
  {
    key: "fact_batch_window_ms",
    value: "5000",
    description: "Milliseconds to batch facts before lens analysis",
  },
  {
    key: "max_signals_per_run",
    value: "50",
    description: "Maximum signals to store per monitoring run",
  },
  {
    key: "brief_min_score",
    value: "60",
    description: "Minimum convergence score to write a brief",
  },
  {
    key: "llm_timeout_ms",
    value: "30000",
    description: "LLM call timeout in milliseconds",
  },
  {
    key: "brightdata_timeout_ms",
    value: "30000",
    description: "Bright Data scrape timeout",
  },
  {
    key: "credit_warn_hourly",
    value: "50",
    description: "Warn when hourly credit burn exceeds this",
  },
];

export function initDefaultConfig(): void {
  for (const cfg of DEFAULT_CONFIG) {
    db.run(
      "INSERT OR IGNORE INTO pipeline_config (key, value, description, updated_at) VALUES (?, ?, ?, ?)",
      [cfg.key, cfg.value, cfg.description, new Date().toISOString()]
    );
  }
}

// ─── Model Catalog ─────────────────────────────────────────────────────────

export interface ModelEntry {
  capabilities: string[];
  contextLength: number | null;
  costPer1mInput: number | null;
  costPer1mOutput: number | null;
  indexedAt: string;
  modelId: string;
  name: string;
  provider: string;
}

export function storeModels(models: ModelEntry[]): void {
  const stmt = db.query(`
    INSERT OR REPLACE INTO model_catalog
    (model_id, name, provider, context_length, cost_per_1m_input, cost_per_1m_output, capabilities, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of models) {
    stmt.run(
      m.modelId,
      m.name,
      m.provider,
      m.contextLength,
      m.costPer1mInput,
      m.costPer1mOutput,
      JSON.stringify(m.capabilities),
      m.indexedAt
    );
  }
}

export function getModels(provider?: string): ModelEntry[] {
  const sql = provider
    ? "SELECT * FROM model_catalog WHERE provider = ? ORDER BY provider, name"
    : "SELECT * FROM model_catalog ORDER BY provider, name";

  const rows = db.query(sql).all(provider ?? []) as Array<
    Record<string, unknown>
  >;

  return rows.map((r) => ({
    modelId: String(r.model_id),
    name: String(r.name),
    provider: String(r.provider),
    contextLength: r.context_length ? Number(r.context_length) : null,
    costPer1mInput: r.cost_per_1m_input ? Number(r.cost_per_1m_input) : null,
    costPer1mOutput: r.cost_per_1m_output ? Number(r.cost_per_1m_output) : null,
    capabilities: JSON.parse(String(r.capabilities ?? "[]")),
    indexedAt: String(r.indexed_at),
  }));
}

export function getModelById(modelId: string): ModelEntry | null {
  const row = db
    .query("SELECT * FROM model_catalog WHERE model_id = ?")
    .get(modelId) as Record<string, unknown> | null;
  if (!row) {
    return null;
  }
  return {
    modelId: String(row.model_id),
    name: String(row.name),
    provider: String(row.provider),
    contextLength: row.context_length ? Number(row.context_length) : null,
    costPer1mInput: row.cost_per_1m_input
      ? Number(row.cost_per_1m_input)
      : null,
    costPer1mOutput: row.cost_per_1m_output
      ? Number(row.cost_per_1m_output)
      : null,
    capabilities: JSON.parse(String(row.capabilities ?? "[]")),
    indexedAt: String(row.indexed_at),
  };
}

export function clearModelCatalog(): void {
  db.run("DELETE FROM model_catalog");
}

// ─── Agent Config ──────────────────────────────────────────────────────────

export interface AgentConfig {
  agentId: string;
  enabled: boolean;
  maxTokens: number;
  modelId: string | null;
  pollIntervalMinutes: number | null;
  systemPrompt: string | null;
  temperature: number;
  toolsEnabled: string[];
  updatedAt: string;
}

const DEFAULT_AGENT_CONFIGS: Array<Partial<AgentConfig> & { agentId: string }> =
  [
    // ─── Workers: cheap + fast (DeepSeek V4 Flash, 1M ctx) ─────────────────
    {
      agentId: "market-data-bot",
      modelId: "deepseek-v4-flash",
      maxTokens: 32_000,
      temperature: 0.5,
    },
    {
      agentId: "news-data-bot",
      modelId: "deepseek-v4-flash",
      maxTokens: 32_000,
      temperature: 0.5,
    },
    {
      agentId: "social-data-bot",
      modelId: "deepseek-v4-flash",
      maxTokens: 32_000,
      temperature: 0.5,
    },
    {
      agentId: "supplier-data-bot",
      modelId: "deepseek-v4-flash",
      maxTokens: 32_000,
      temperature: 0.5,
    },
    {
      agentId: "filing-data-bot",
      modelId: "deepseek-v4-flash",
      maxTokens: 32_000,
      temperature: 0.5,
    },
    {
      agentId: "gtm-lens",
      modelId: "deepseek-v4-flash",
      maxTokens: 64_000,
      temperature: 0.3,
    },
    {
      agentId: "finance-lens",
      modelId: "deepseek-v4-flash",
      maxTokens: 64_000,
      temperature: 0.3,
    },
    {
      agentId: "security-lens",
      modelId: "deepseek-v4-flash",
      maxTokens: 64_000,
      temperature: 0.3,
    },
    {
      agentId: "normalizer",
      modelId: "deepseek-v4-flash",
      maxTokens: 1000,
      temperature: 0.1,
    },
    // ─── Orchestration: high-quality reasoning (Kimi K2.6, 256K ctx) ────────
    {
      agentId: "correlation-engine",
      modelId: "moonshot/kimi-k2-6",
      maxTokens: 64_000,
      temperature: 0.2,
    },
    {
      agentId: "brief-writer",
      modelId: "moonshot/kimi-k2-6",
      maxTokens: 128_000,
      temperature: 0.4,
    },
    // ─── Chat: configurable via settings ─────────────────────────────────────
    {
      agentId: "chat-assistant",
      modelId: "deepseek-v4-flash",
      maxTokens: 64_000,
      temperature: 0.3,
    },
  ];

export function initDefaultAgentConfigs(): void {
  for (const cfg of DEFAULT_AGENT_CONFIGS) {
    db.run(
      `INSERT OR IGNORE INTO agent_config (agent_id, enabled, model_id, max_tokens, temperature, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cfg.agentId,
        1,
        cfg.modelId ?? null,
        cfg.maxTokens ?? 2000,
        cfg.temperature ?? 0.7,
        new Date().toISOString(),
      ]
    );
  }
}

export function getAgentConfig(agentId: string): AgentConfig | null {
  const row = db
    .query("SELECT * FROM agent_config WHERE agent_id = ?")
    .get(agentId) as Record<string, unknown> | null;
  if (!row) {
    return null;
  }
  return {
    agentId: String(row.agent_id),
    enabled: Boolean(row.enabled),
    modelId: row.model_id ? String(row.model_id) : null,
    systemPrompt: row.system_prompt ? String(row.system_prompt) : null,
    maxTokens: Number(row.max_tokens),
    temperature: Number(row.temperature),
    toolsEnabled: JSON.parse(String(row.tools_enabled ?? "[]")),
    pollIntervalMinutes: row.poll_interval_minutes
      ? Number(row.poll_interval_minutes)
      : null,
    updatedAt: String(row.updated_at),
  };
}

export function getAllAgentConfigs(): AgentConfig[] {
  const rows = db
    .query("SELECT * FROM agent_config ORDER BY agent_id")
    .all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    agentId: String(r.agent_id),
    enabled: Boolean(r.enabled),
    modelId: r.model_id ? String(r.model_id) : null,
    systemPrompt: r.system_prompt ? String(r.system_prompt) : null,
    maxTokens: Number(r.max_tokens),
    temperature: Number(r.temperature),
    toolsEnabled: JSON.parse(String(r.tools_enabled ?? "[]")),
    pollIntervalMinutes: r.poll_interval_minutes
      ? Number(r.poll_interval_minutes)
      : null,
    updatedAt: String(r.updated_at),
  }));
}

export function updateAgentConfig(
  agentId: string,
  updates: Partial<Omit<AgentConfig, "agentId" | "updatedAt">>
): void {
  const existing = getAgentConfig(agentId);
  if (!existing) {
    throw new Error(`Agent ${agentId} not found`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.enabled !== undefined) {
    fields.push("enabled = ?");
    values.push(updates.enabled ? 1 : 0);
  }
  if (updates.modelId !== undefined) {
    fields.push("model_id = ?");
    values.push(updates.modelId);
  }
  if (updates.systemPrompt !== undefined) {
    fields.push("system_prompt = ?");
    values.push(updates.systemPrompt);
  }
  if (updates.maxTokens !== undefined) {
    fields.push("max_tokens = ?");
    values.push(updates.maxTokens);
  }
  if (updates.temperature !== undefined) {
    fields.push("temperature = ?");
    values.push(updates.temperature);
  }
  if (updates.toolsEnabled !== undefined) {
    fields.push("tools_enabled = ?");
    values.push(JSON.stringify(updates.toolsEnabled));
  }
  if (updates.pollIntervalMinutes !== undefined) {
    fields.push("poll_interval_minutes = ?");
    values.push(updates.pollIntervalMinutes);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(agentId);

  db.run(
    `UPDATE agent_config SET ${fields.join(", ")} WHERE agent_id = ?`,
    values
  );
}

// ─── Pipeline Config ──────────────────────────────────────────────────────

export function getPipelineConfig(key: string): string | null {
  const row = db
    .query("SELECT value FROM pipeline_config WHERE key = ?")
    .get(key) as { value: string } | null;
  return row?.value ?? null;
}

export function getAllPipelineConfig(): Array<{
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}> {
  const rows = db
    .query("SELECT * FROM pipeline_config ORDER BY key")
    .all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    key: String(r.key),
    value: String(r.value),
    description: String(r.description),
    updatedAt: String(r.updated_at),
  }));
}

export function setPipelineConfig(key: string, value: string): void {
  db.run("UPDATE pipeline_config SET value = ?, updated_at = ? WHERE key = ?", [
    value,
    new Date().toISOString(),
    key,
  ]);
}

// ─── User Settings ─────────────────────────────────────────────────────────

export function getUserSettings(userId: string): {
  userId: string;
  defaultLens: string;
  defaultModel: string | null;
  emailNotifications: boolean;
  slackWebhook: string | null;
  theme: string;
} | null {
  const row = db
    .query("SELECT * FROM user_settings WHERE user_id = ?")
    .get(userId) as Record<string, unknown> | null;
  if (!row) {
    return null;
  }
  return {
    userId: String(row.user_id),
    defaultLens: String(row.default_lens),
    defaultModel: row.default_model ? String(row.default_model) : null,
    emailNotifications: Boolean(row.email_notifications),
    slackWebhook: row.slack_webhook ? String(row.slack_webhook) : null,
    theme: String(row.theme),
  };
}

export function upsertUserSettings(
  userId: string,
  settings: Partial<{
    defaultLens: string;
    defaultModel: string;
    emailNotifications: boolean;
    slackWebhook: string;
    theme: string;
  }>
): void {
  const existing = getUserSettings(userId);
  if (existing) {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (settings.defaultLens !== undefined) {
      fields.push("default_lens = ?");
      values.push(settings.defaultLens);
    }
    if (settings.defaultModel !== undefined) {
      fields.push("default_model = ?");
      values.push(settings.defaultModel);
    }
    if (settings.emailNotifications !== undefined) {
      fields.push("email_notifications = ?");
      values.push(settings.emailNotifications ? 1 : 0);
    }
    if (settings.slackWebhook !== undefined) {
      fields.push("slack_webhook = ?");
      values.push(settings.slackWebhook);
    }
    if (settings.theme !== undefined) {
      fields.push("theme = ?");
      values.push(settings.theme);
    }

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(userId);

    db.run(
      `UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = ?`,
      values
    );
  } else {
    db.run(
      `INSERT INTO user_settings (user_id, default_lens, default_model, email_notifications, slack_webhook, theme, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        settings.defaultLens ?? "finance",
        settings.defaultModel ?? null,
        settings.emailNotifications ? 1 : 0,
        settings.slackWebhook ?? null,
        settings.theme ?? "dark",
        new Date().toISOString(),
      ]
    );
  }
}

// ─── Model Resolver ──────────────────────────────────────────────────────────

export interface ResolvedModel {
  api: string;
  id: string;
  name: string;
  provider: string;
}

export function resolveAgentModel(agentId: string): ResolvedModel {
  const cfg = getAgentConfig(agentId);
  const modelId = cfg?.modelId ?? "deepseek-v4-flash";
  const parts = modelId.split("/");
  const name = parts.length > 1 ? parts.slice(1).join("/") : modelId;

  return {
    id: modelId,
    name,
    provider: "aimlapi",
    api: "chat-completions",
  };
}

// ─── Seed Model Catalog ─────────────────────────────────────────────────────

const SEED_MODELS: Array<Omit<ModelEntry, "indexedAt">> = [
  {
    modelId: "deepseek-v4-flash",
    name: "deepseek-v4-flash",
    provider: "deepseek",
    contextLength: 1_000_000,
    costPer1mInput: 0.15,
    costPer1mOutput: 0.60,
    capabilities: ["chat", "reasoning"],
  },
  {
    modelId: "moonshot/kimi-k2-6",
    name: "kimi-k2-6",
    provider: "moonshot",
    contextLength: 256_000,
    costPer1mInput: 2.00,
    costPer1mOutput: 8.00,
    capabilities: ["chat", "reasoning"],
  },
  {
    modelId: "deepseek/deepseek-chat",
    name: "deepseek-chat",
    provider: "deepseek",
    contextLength: 64_000,
    costPer1mInput: 0.27,
    costPer1mOutput: 1.10,
    capabilities: ["chat", "reasoning"],
  },
];

function seedModelCatalog(): void {
  const now = new Date().toISOString();
  for (const m of SEED_MODELS) {
    db.run(
      `INSERT OR IGNORE INTO model_catalog (model_id, name, provider, context_length, cost_per_1m_input, cost_per_1m_output, capabilities, indexed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.modelId, m.name, m.provider, m.contextLength, m.costPer1mInput, m.costPer1mOutput, JSON.stringify(m.capabilities), now]
    );
  }
  console.log(`[config] Seeded ${SEED_MODELS.length} known models into catalog`);
}

// ─── Init ───────────────────────────────────────────────────────────────────

export function initConfigStore(): void {
  seedModelCatalog();
  initDefaultConfig();
  initDefaultAgentConfigs();
  console.log("[config] Store initialized with defaults");
}

// Auto-init
initConfigStore();
