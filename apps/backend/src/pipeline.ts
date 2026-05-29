/// <reference types="bun" />

/**
 * Pipeline Orchestrator v2 — Event-driven intelligence pipeline
 *
 * Replaces the sequential for-loop with an event-driven architecture.
 * Schedule emits MonitorTick → Collection agents react → Normalizer →
   Lens agents → Correlation → Brief writer → Alerts.
 */

import { startCacheCleanup, stopCacheCleanup } from "./cache.ts";
import { emit, emitReplayScenario, type MonitorTick } from "./events.ts";
import {
  addToWatchlist,
  createRun,
  getWatchlist,
  removeFromWatchlist,
} from "./state.ts";

// Import all event subscribers (side-effect: registers handlers)
import "./agents/collection/v2.ts";
import "./agents/normalizer.ts";
import "./agents/lenses/v2.ts";
import "./agents/correlation/v2.ts";
import "./agents/briefwriter.ts";

// ─── Scheduling ────────────────────────────────────────────────────────────

let intervalId: Timer | null = null;
let isRunning = false;

export function startPipeline(pollMinutes = 5): void {
  if (isRunning) {
    console.log("[pipeline] Already running");
    return;
  }

  isRunning = true;
  startCacheCleanup(15);

  const tick = () => {
    const companies = getWatchlist();
    for (const company of companies) {
      const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      createRun(runId, company, "live");

      const tick: MonitorTick = {
        type: "monitor_tick",
        runId,
        company,
        timestamp: new Date().toISOString(),
        mode: "live",
      };

      emit(tick);
    }
  };

  tick();
  intervalId = setInterval(tick, pollMinutes * 60 * 1000);
  console.log(
    `[pipeline] Started — polling every ${pollMinutes} minutes for: ${getWatchlist().join(", ")}`
  );
}

export function stopPipeline(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  stopCacheCleanup();
  console.log("[pipeline] Stopped");
}

export function triggerManualRun(
  company: string,
  mode: "live" | "cached" = "live"
): string {
  const runId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  createRun(runId, company, mode);

  const tick: MonitorTick = {
    type: "monitor_tick",
    runId,
    company,
    timestamp: new Date().toISOString(),
    mode,
  };

  emit(tick);
  return runId;
}

export function triggerReplay(scenarioId: string): void {
  emitReplayScenario(scenarioId);
}

export { addToWatchlist, getWatchlist, removeFromWatchlist };

export function isPipelineRunning(): boolean {
  return isRunning;
}

console.log(
  "[pipeline] Event-driven pipeline loaded. Call startPipeline() to begin."
);
