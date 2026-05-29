"use client";

import { useEffect, useState } from "react";
import {
  fetchAgentConfigs,
  fetchModels,
  fetchPipelineConfig,
  indexModels,
  updateAgentConfig,
  updatePipelineConfig,
} from "@/lib/api.ts";

export default function SettingsPage() {
  const [models, setModels] = useState<Awaited<ReturnType<typeof fetchModels>>>(
    []
  );
  const [agents, setAgents] = useState<
    Awaited<ReturnType<typeof fetchAgentConfigs>>
  >([]);
  const [pipeline, setPipeline] = useState<
    Awaited<ReturnType<typeof fetchPipelineConfig>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [m, a, p] = await Promise.all([
        fetchModels().catch(() => []),
        fetchAgentConfigs().catch(() => []),
        fetchPipelineConfig().catch(() => []),
      ]);
      setModels(m);
      setAgents(a);
      setPipeline(p);
    } finally {
      setLoading(false);
    }
  }

  async function handleIndex() {
    setIndexing(true);
    try {
      await indexModels();
      await loadAll();
    } finally {
      setIndexing(false);
    }
  }

  async function toggleAgent(agentId: string, enabled: boolean) {
    setSaving(agentId);
    try {
      await updateAgentConfig(agentId, { enabled });
      await loadAll();
    } finally {
      setSaving(null);
    }
  }

  async function updateAgentModel(agentId: string, modelId: string) {
    setSaving(agentId);
    try {
      await updateAgentConfig(agentId, { modelId });
      await loadAll();
    } finally {
      setSaving(null);
    }
  }

  async function updatePipeline(key: string, value: string) {
    setSaving(key);
    try {
      await updatePipelineConfig(key, value);
      await loadAll();
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-zinc-500">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 font-semibold text-lg text-zinc-100">Settings</h1>

      {/* ─── Model Catalog ───────────────────────────────────────────────── */}
      <section className="mb-8 border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
            Model Catalog ({models.length} models)
          </h2>
          <button
            className="rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white text-xs hover:bg-amber-500 disabled:opacity-50"
            disabled={indexing}
            onClick={handleIndex}
            type="button"
          >
            {indexing ? "Indexing..." : "Re-index from AI/ML API"}
          </button>
        </div>

        {models.length === 0 && (
          <div className="py-4 text-center text-xs text-zinc-500">
            No models indexed. Click "Re-index" to fetch from AI/ML API.
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Model</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Context</th>
                <th className="pb-2 font-medium">Cost/1M</th>
                <th className="pb-2 font-medium">Capabilities</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {models.slice(0, 50).map((m) => (
                <tr className="border-zinc-800 border-t" key={m.modelId}>
                  <td className="py-2 font-mono">{m.name}</td>
                  <td className="py-2">{m.provider}</td>
                  <td className="py-2">
                    {m.contextLength?.toLocaleString() ?? "—"}
                  </td>
                  <td className="py-2">
                    ${m.costPer1mInput?.toFixed(2) ?? "—"} / $
                    {m.costPer1mOutput?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {m.capabilities.map((c) => (
                        <span
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase"
                          key={c}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {models.length > 50 && (
            <div className="py-2 text-center text-xs text-zinc-500">
              + {models.length - 50} more models
            </div>
          )}
        </div>
      </section>

      {/* ─── Agent Configuration ─────────────────────────────────────────── */}
      <section className="mb-8 border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-4 font-semibold text-sm text-zinc-400 uppercase tracking-wider">
          Agent Configuration
        </h2>

        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              className={`flex items-center gap-4 border border-zinc-800 px-3 py-2 ${
                agent.enabled ? "bg-zinc-900/50" : "bg-zinc-950 opacity-60"
              }`}
              key={agent.agentId}
            >
              <button
                className={`h-5 w-9 rounded-full transition ${
                  agent.enabled ? "bg-emerald-500" : "bg-zinc-700"
                }`}
                onClick={() => toggleAgent(agent.agentId, !agent.enabled)}
                type="button"
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    agent.enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>

              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs text-zinc-200">
                  {agent.agentId}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {agent.enabled ? "Active" : "Disabled"}
                  {saving === agent.agentId && " · Saving..."}
                </div>
              </div>

              <select
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                disabled={saving === agent.agentId}
                onChange={(e) =>
                  updateAgentModel(agent.agentId, e.target.value)
                }
                value={agent.modelId ?? ""}
              >
                <option value="">Select model...</option>
                {models.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.provider}/{m.name}
                  </option>
                ))}
              </select>

              <div className="text-right text-[10px] text-zinc-500">
                <div>max_tokens: {agent.maxTokens}</div>
                <div>temp: {agent.temperature}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pipeline Settings ───────────────────────────────────────────── */}
      <section className="mb-8 border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-4 font-semibold text-sm text-zinc-400 uppercase tracking-wider">
          Pipeline Settings
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pipeline.map((cfg) => (
            <div className="border border-zinc-800 p-3" key={cfg.key}>
              <label className="mb-1 block text-[10px] text-zinc-500 uppercase tracking-wider">
                {cfg.key.replace(/_/g, " ")}
              </label>
              <input
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                defaultValue={cfg.value}
                onBlur={(e) => {
                  if (e.target.value !== cfg.value) {
                    updatePipeline(cfg.key, e.target.value);
                  }
                }}
                type="text"
              />
              <p className="mt-1 text-[10px] text-zinc-600">
                {cfg.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
