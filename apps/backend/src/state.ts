/// <reference types="bun" />

/**
 * State Store — SQLite-backed persistence for runs, steps, and signals
 *
 * Survives backend restarts. Replays incomplete runs on startup.
 * Every pipeline run gets a row. Every step emission gets a row.
 */

import { Database } from "bun:sqlite";
import type { AgentStep, IntelligenceBrief, Signal } from "@argus/shared";

const db = new Database(process.env.DB_PATH ?? "argus_state.sqlite");

// ─── Schema ────────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS runs (
    run_id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TEXT NOT NULL,
    completed_at TEXT,
    error TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    label TEXT NOT NULL,
    detail TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL,
    lens TEXT,
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    lens TEXT NOT NULL,
    severity TEXT NOT NULL,
    headline TEXT NOT NULL,
    synthesis TEXT NOT NULL,
    source_urls TEXT NOT NULL,
    confidence REAL NOT NULL,
    agent_id TEXT NOT NULL,
    detected_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    company TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_findings TEXT NOT NULL,
    risk_score REAL NOT NULL,
    recommendation TEXT NOT NULL,
    sources TEXT NOT NULL,
    generated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_steps_run ON steps(run_id)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_signals_run ON signals(run_id)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_briefs_company ON briefs(company)
`);

// ─── Run Management ────────────────────────────────────────────────────────

export function createRun(runId: string, company: string, mode: string): void {
  db.run(
    "INSERT OR IGNORE INTO runs (run_id, company, mode, status, started_at) VALUES (?, ?, ?, ?, ?)",
    [runId, company, mode, "running", new Date().toISOString()]
  );
}

export function completeRun(
  runId: string,
  status: "success" | "failed" | "cancelled",
  error?: string
): void {
  db.run(
    "UPDATE runs SET status = ?, completed_at = ?, error = ? WHERE run_id = ?",
    [status, new Date().toISOString(), error ?? null, runId]
  );
}

export function getRunStatus(runId: string): {
  runId: string;
  company: string;
  mode: string;
  status: string;
  startedAt: string;
  completedAt?: string;
} | null {
  const row = db
    .query("SELECT * FROM runs WHERE run_id = ?")
    .get(runId) as Record<string, unknown> | null;

  if (!row) {
    return null;
  }
  return {
    runId: String(row.run_id),
    company: String(row.company),
    mode: String(row.mode),
    status: String(row.status),
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
  };
}

export function getIncompleteRuns(): Array<{
  runId: string;
  company: string;
  mode: string;
  startedAt: string;
}> {
  const rows = db
    .query(
      "SELECT run_id, company, mode, started_at FROM runs WHERE status = 'running'"
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    runId: String(r.run_id),
    company: String(r.company),
    mode: String(r.mode),
    startedAt: String(r.started_at),
  }));
}

// ─── Step Management ───────────────────────────────────────────────────────

export function persistStep(step: AgentStep & { runId: string }): void {
  db.run(
    `INSERT INTO steps (run_id, agent_id, step, label, detail, status, progress, timestamp, lens)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      step.runId,
      step.agent,
      step.step,
      step.label,
      step.detail,
      step.status,
      step.progress,
      step.timestamp,
      step.lens ?? null,
    ]
  );
}

export function getStepsForRun(runId: string): AgentStep[] {
  const rows = db
    .query("SELECT * FROM steps WHERE run_id = ? ORDER BY timestamp")
    .all(runId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: `${r.run_id}-${r.agent_id}-${r.step}`,
    agent: String(r.agent_id),
    step: Number(r.step),
    label: String(r.label),
    detail: String(r.detail),
    status: String(r.status) as AgentStep["status"],
    progress: Number(r.progress),
    timestamp: String(r.timestamp),
    lens: r.lens
      ? (String(r.lens) as "gtm" | "finance" | "security")
      : undefined,
  }));
}

// ─── Signal Management ─────────────────────────────────────────────────────

export function persistSignal(signal: Signal & { runId?: string }): void {
  db.run(
    `INSERT OR REPLACE INTO signals
     (id, run_id, lens, severity, headline, synthesis, source_urls, confidence, agent_id, detected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      signal.id,
      signal.runId ?? null,
      signal.lens,
      signal.severity,
      signal.headline,
      signal.synthesis,
      JSON.stringify(signal.source_urls),
      signal.confidence,
      signal.agent_id,
      signal.detected_at,
    ]
  );
}

export function getSignals(limit = 100): Signal[] {
  const rows = db
    .query("SELECT * FROM signals ORDER BY detected_at DESC LIMIT ?")
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    lens: String(r.lens) as Signal["lens"],
    severity: String(r.severity) as Signal["severity"],
    headline: String(r.headline),
    synthesis: String(r.synthesis),
    source_urls: JSON.parse(String(r.source_urls)),
    confidence: Number(r.confidence),
    agent_id: String(r.agent_id),
    detected_at: String(r.detected_at),
  }));
}

export function getSignalsForCompany(company: string, limit = 50): Signal[] {
  const rows = db
    .query(
      "SELECT * FROM signals WHERE headline LIKE ? ORDER BY detected_at DESC LIMIT ?"
    )
    .all(`%${company}%`, limit) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    lens: String(r.lens) as Signal["lens"],
    severity: String(r.severity) as Signal["severity"],
    headline: String(r.headline),
    synthesis: String(r.synthesis),
    source_urls: JSON.parse(String(r.source_urls)),
    confidence: Number(r.confidence),
    agent_id: String(r.agent_id),
    detected_at: String(r.detected_at),
  }));
}

// ─── Brief Management ──────────────────────────────────────────────────────

export function persistBrief(
  runId: string | undefined,
  company: string,
  brief: IntelligenceBrief
): void {
  // Dedup: skip if a brief with the same company + headline already exists in the last hour
  const existing = db
    .query(
      "SELECT id FROM briefs WHERE company = ? AND headline = ? AND generated_at > datetime('now', '-1 hour')"
    )
    .get(company, brief.executive_summary.slice(0, 100)) as {
    id: number;
  } | null;

  if (existing) {
    return;
  }

  db.run(
    `INSERT INTO briefs (run_id, company, headline, summary, key_findings, risk_score, recommendation, sources, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      runId ?? null,
      company,
      brief.executive_summary.slice(0, 100),
      brief.executive_summary,
      JSON.stringify(brief.key_signals.map((s) => s.headline)),
      brief.risk_score,
      brief.recommendation,
      JSON.stringify((brief.sources ?? []).slice(0, 10)),
      brief.generated_at,
    ]
  );
}

export function getBriefsForCompany(company: string): Array<{
  company: string;
  headline: string;
  riskScore: number;
  generatedAt: string;
  summary: string;
  keyFindings: string[];
  recommendation: string;
  sources: string[];
}> {
  const rows = db
    .query("SELECT * FROM briefs WHERE company = ? ORDER BY generated_at DESC")
    .all(company) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    company: String(r.company),
    headline: String(r.headline),
    riskScore: Number(r.risk_score),
    generatedAt: String(r.generated_at),
    summary: String(r.summary ?? ""),
    keyFindings: JSON.parse(String(r.key_findings ?? "[]")),
    recommendation: String(r.recommendation ?? ""),
    sources: JSON.parse(String(r.sources ?? "[]")),
  }));
}

// ─── Agent Status (derived from latest steps) ──────────────────────────────

export function getAgentStatuses(): Array<{
  agentId: string;
  status: string;
  task: string;
  lastRun: string;
}> {
  const rows = db
    .query(`
    SELECT agent_id, status, detail, timestamp
    FROM steps
    WHERE id IN (
      SELECT MAX(id) FROM steps GROUP BY agent_id
    )
  `)
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    agentId: String(r.agent_id),
    status: String(r.status) === "running" ? "active" : "idle",
    task: String(r.detail).slice(0, 80),
    lastRun: String(r.timestamp),
  }));
}

// ─── Watchlist ─────────────────────────────────────────────────────────────

export function getWatchlist(): string[] {
  try {
    const rows = db.query("SELECT watchlist FROM users").all() as Array<{
      watchlist: string;
    }>;
    const allCompanies = new Set<string>();
    
    for (const row of rows) {
      if (row.watchlist) {
        try {
          const list = JSON.parse(String(row.watchlist));
          if (Array.isArray(list)) {
            for (const c of list) {
              allCompanies.add(c);
            }
          }
        } catch {
          // invalid JSON in column
        }
      }
    }
    
    const companies = Array.from(allCompanies);
    return companies.length > 0 ? companies : ["NVIDIA", "AMD"];
  } catch (err) {
    console.error("[state] Error fetching watchlists from DB:", err);
    return ["NVIDIA", "AMD"];
  }
}

export function addToWatchlist(company: string): void {
  // Deprecated in favor of updateUserWatchlist in auth.ts
}

export function removeFromWatchlist(company: string): void {
  // Deprecated in favor of updateUserWatchlist in auth.ts
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export function getStateStats(): {
  totalRuns: number;
  runningRuns: number;
  totalSignals: number;
  totalBriefs: number;
  memoryCacheSize: number;
} {
  const runs = db.query("SELECT COUNT(*) as c FROM runs").get() as {
    c: number;
  };
  const running = db
    .query("SELECT COUNT(*) as c FROM runs WHERE status = 'running'")
    .get() as { c: number };
  const signals = db.query("SELECT COUNT(*) as c FROM signals").get() as {
    c: number;
  };
  const briefs = db.query("SELECT COUNT(*) as c FROM briefs").get() as {
    c: number;
  };

  return {
    totalRuns: runs.c,
    runningRuns: running.c,
    totalSignals: signals.c,
    totalBriefs: briefs.c,
    memoryCacheSize: 0, // Populated by cache.ts
  };
}

// ─── Reset ─────────────────────────────────────────────────────────────────

export function clearAllData(): void {
  db.run("DELETE FROM signals");
  db.run("DELETE FROM briefs");
  db.run("DELETE FROM steps");
  db.run("UPDATE runs SET status = 'cancelled' WHERE status = 'running'");
}
