"use client";

import { useEffect, useState } from "react";
import { fetchAgentConfigs, updateAgentConfig } from "@/lib/api.ts";

export default function AgentsPage() {
  const [agents, setAgents] = useState<
    Awaited<ReturnType<typeof fetchAgentConfigs>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const data = await fetchAgentConfigs();
      setAgents(data);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAgent(agentId: string, enabled: boolean) {
    setSaving(agentId);
    try {
      await updateAgentConfig(agentId, { enabled });
      await loadAgents();
    } finally {
      setSaving(null);
    }
  }

  async function updatePrompt(agentId: string, prompt: string) {
    setSaving(agentId);
    try {
      await updateAgentConfig(agentId, { systemPrompt: prompt });
      await loadAgents();
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-zinc-500">
        Loading agents...
      </div>
    );
  }

  const collectionAgents = agents.filter((a) => a.agentId.includes("-bot"));
  const lensAgents = agents.filter((a) => a.agentId.includes("-lens"));
  const synthesisAgents = agents.filter(
    (a) =>
      a.agentId.includes("correlation") ||
      a.agentId.includes("brief") ||
      a.agentId.includes("normalizer")
  );

  return (
    <div className="p-6">
      <h1 className="mb-6 font-semibold text-lg text-zinc-100">
        Agent Management
      </h1>

      <AgentGroup
        agents={collectionAgents}
        onPromptUpdate={updatePrompt}
        onToggle={toggleAgent}
        saving={saving}
        title="Collection Agents"
      />

      <AgentGroup
        agents={lensAgents}
        onPromptUpdate={updatePrompt}
        onToggle={toggleAgent}
        saving={saving}
        title="Lens Agents"
      />

      <AgentGroup
        agents={synthesisAgents}
        onPromptUpdate={updatePrompt}
        onToggle={toggleAgent}
        saving={saving}
        title="Synthesis"
      />
    </div>
  );
}

function AgentGroup({
  title,
  agents,
  saving,
  onToggle,
  onPromptUpdate,
}: {
  title: string;
  agents: Awaited<ReturnType<typeof fetchAgentConfigs>>;
  saving: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  onPromptUpdate: (id: string, prompt: string) => void;
}) {
  if (agents.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-4 font-semibold text-sm text-zinc-400 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            className={`border border-zinc-800 p-3 ${agent.enabled ? "bg-zinc-900/50" : "bg-zinc-950 opacity-60"}`}
            key={agent.agentId}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className={`h-5 w-9 rounded-full transition ${agent.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
                  onClick={() => onToggle(agent.agentId, !agent.enabled)}
                  type="button"
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                      agent.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="font-medium text-sm text-zinc-200">
                  {agent.agentId}
                </span>
                {saving === agent.agentId && (
                  <span className="text-[10px] text-amber-500">saving...</span>
                )}
              </div>
              <div className="flex gap-4 text-[10px] text-zinc-500">
                <span>model: {agent.modelId ?? "default"}</span>
                <span>temp: {agent.temperature}</span>
                <span>max_tokens: {agent.maxTokens}</span>
              </div>
            </div>

            {agent.systemPrompt && (
              <div className="mt-2 border-zinc-800 border-t pt-2">
                <label className="mb-1 block text-[10px] text-zinc-600 uppercase">
                  System Prompt
                </label>
                <textarea
                  className="w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                  defaultValue={agent.systemPrompt}
                  onBlur={(e) => {
                    if (e.target.value !== agent.systemPrompt) {
                      onPromptUpdate(agent.agentId, e.target.value);
                    }
                  }}
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
