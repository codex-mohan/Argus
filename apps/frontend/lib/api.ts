"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "";

export interface AgentStatus {
  id: string;
  lastRun: string;
  status: string;
  task: string;
}

export interface Signal {
  agent_id: string;
  confidence: number;
  detected_at: string;
  headline: string;
  id: string;
  lens: "gtm" | "finance" | "security";
  severity: "low" | "medium" | "high" | "critical";
  source_urls: string[];
  synthesis: string;
}

export interface StepEvent {
  agentId: string;
  detail: string;
  label: string;
  lens?: string;
  progress: number;
  status: "running" | "success" | "failed" | "skipped";
  step: number;
  timestamp: string;
}

export interface ConvergenceEvent {
  company: string;
  compositeScore: number;
  contradictions: Array<{
    lensA: string;
    lensB: string;
    description: string;
    severity: "minor" | "major";
  }>;
  signals: Array<{
    headline: string;
    synthesis: string;
    confidence: number;
    sourceUrls: string[];
  }>;
  verdict: "converged" | "contradicted" | "insufficient";
}

export interface BriefEvent {
  brief: {
    headline: string;
    summary: string;
    keyFindings: string[];
    riskScore: number;
    recommendation: string;
    sources: string[];
  };
  company: string;
}

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch(`${API_BASE}/api/signals`);
  if (!res.ok) {
    throw new Error("Failed to fetch signals");
  }
  const data = await res.json();
  return data.signals as Signal[];
}

export async function fetchAgentStatus(): Promise<AgentStatus[]> {
  const res = await fetch(`${API_BASE}/api/agents/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch agent status");
  }
  const data = await res.json();
  return data.agents as AgentStatus[];
}

export async function fetchWatchlist(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/watchlist`);
  if (!res.ok) {
    throw new Error("Failed to fetch watchlist");
  }
  const data = await res.json();
  return data.companies as string[];
}

export async function addToWatchlist(company: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company }),
  });
  if (!res.ok) {
    throw new Error("Failed to add to watchlist");
  }
  const data = await res.json();
  return data.companies as string[];
}

export async function removeFromWatchlist(company: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/watchlist`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company }),
  });
  if (!res.ok) {
    throw new Error("Failed to remove from watchlist");
  }
  const data = await res.json();
  return data.companies as string[];
}

export async function queryNetwork(
  query: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error("Query failed");
  }
  return res.json();
}

export async function triggerRun(
  company: string,
  mode: string
): Promise<{ runId: string }> {
  const res = await fetch(`${API_BASE}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, mode }),
  });
  if (!res.ok) {
    throw new Error("Failed to trigger run");
  }
  return res.json();
}

export async function triggerReplay(scenario: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error("Failed to trigger replay");
  }
}

export function useSignalStream() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const init = useCallback(() => {
    fetchSignals()
      .then((initial) => setSignals(initial))
      .catch((err) => {
        console.warn("Initial signals failed:", err);
        setError("Failed to load initial signals");
      });

    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`${API_BASE}/api/signals/stream`);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      if (!event.data || event.data.startsWith(":")) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "lens_analysis_complete" ||
          data.type === "convergence_detected" ||
          data.type === "brief_ready"
        ) {
          // These events may also carry signals — ignore for signal list
          return;
        }
        if (data.headline && data.lens) {
          const signal: Signal = data;
          setSignals((prev) => [signal, ...prev].slice(0, 200));
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      reconnectTimer.current = setTimeout(() => init(), 5000);
    };
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      esRef.current?.close();
    };
  }, [init]);

  return { signals, connected, error };
}

export async function fetchModels(): Promise<
  Array<{
    modelId: string;
    name: string;
    provider: string;
    contextLength: number | null;
    costPer1mInput: number | null;
    costPer1mOutput: number | null;
    capabilities: string[];
    indexedAt: string;
  }>
> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) {
    throw new Error("Failed to fetch models");
  }
  const data = await res.json();
  return data.models ?? [];
}

export async function indexModels(
  apiKey?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const res = await fetch(`${API_BASE}/api/models/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    throw new Error("Failed to index models");
  }
  return res.json();
}

export async function fetchAgentConfigs(): Promise<
  Array<{
    agentId: string;
    enabled: boolean;
    modelId: string | null;
    systemPrompt: string | null;
    maxTokens: number;
    temperature: number;
    toolsEnabled: string[];
    pollIntervalMinutes: number | null;
    updatedAt: string;
  }>
> {
  const res = await fetch(`${API_BASE}/api/agents/config`);
  if (!res.ok) {
    throw new Error("Failed to fetch agent configs");
  }
  const data = await res.json();
  return data.agents ?? [];
}

export async function updateAgentConfig(
  agentId: string,
  updates: Partial<{
    enabled: boolean;
    modelId: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
    toolsEnabled: string[];
    pollIntervalMinutes: number;
  }>
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, ...updates }),
  });
  if (!res.ok) {
    throw new Error("Failed to update agent config");
  }
}

export async function fetchPipelineConfig(): Promise<
  Array<{
    key: string;
    value: string;
    description: string;
    updatedAt: string;
  }>
> {
  const res = await fetch(`${API_BASE}/api/pipeline/config`);
  if (!res.ok) {
    throw new Error("Failed to fetch pipeline config");
  }
  const data = await res.json();
  return data.config ?? [];
}

export async function updatePipelineConfig(
  key: string,
  value: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/pipeline/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    throw new Error("Failed to update pipeline config");
  }
}

export function useEventStream() {
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [convergence, setConvergence] = useState<ConvergenceEvent | null>(null);
  const [brief, setBrief] = useState<BriefEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/signals/stream`);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      if (!event.data || event.data.startsWith(":")) {
        return;
      }
      try {
        const data = JSON.parse(event.data);

        if (data.type === "step_emitted") {
          const step: StepEvent = {
            agentId: data.agentId,
            step: data.step,
            label: data.label,
            detail: data.detail,
            status: data.status,
            progress: data.progress,
            timestamp: data.timestamp,
            lens: data.lens,
          };
          setSteps((prev) => [...prev, step].slice(-100));
        }

        if (data.type === "convergence_detected") {
          const conv: ConvergenceEvent = {
            company: data.company,
            compositeScore: data.compositeScore,
            verdict: data.verdict,
            signals: data.signals,
            contradictions: data.contradictions,
          };
          setConvergence(conv);
        }

        if (data.type === "brief_ready") {
          const b: BriefEvent = {
            company: data.company,
            brief: data.brief,
          };
          setBrief(b);
        }
      } catch {
        // ignore
      }
    };

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  return { steps, convergence, brief, connected };
}

export function useAgentStatus(pollMs = 5000) {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchAgentStatus();
        if (!cancelled) {
          setAgents(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Agent status unavailable");
        }
      }
    };
    load();
    const id = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { agents, error };
}

export function useWatchlist() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWatchlist()
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  const add = useCallback(async (company: string) => {
    setLoading(true);
    try {
      const updated = await addToWatchlist(company);
      setCompanies(updated);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (company: string) => {
    setLoading(true);
    try {
      const updated = await removeFromWatchlist(company);
      setCompanies(updated);
    } finally {
      setLoading(false);
    }
  }, []);

  return { companies, add, remove, loading };
}
