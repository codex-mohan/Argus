"use client";

import { useRouter } from "next/navigation";
import type { Signal } from "@/lib/api.ts";

interface ConvergenceCardProps {
  signals: Signal[];
}

function findConvergence(signals: Signal[]): {
  headline: string;
  synthesis: string;
  confidence: number;
  tags: string[];
} | null {
  const companies = new Map<string, Set<string>>();

  for (const s of signals) {
    for (const company of ["NVIDIA", "AMD", "TSMC"]) {
      if (s.headline.toLowerCase().includes(company.toLowerCase())) {
        if (!companies.has(company)) {
          companies.set(company, new Set());
        }
        companies.get(company)!.add(s.lens);
      }
    }
  }

  for (const [company, lenses] of companies) {
    if (lenses.size >= 2) {
      const confidence = Math.min(0.95, 0.5 + lenses.size * 0.2);
      return {
        headline: `${company}: cross-lens convergence detected`,
        synthesis: `Multiple lenses (${Array.from(lenses).join(", ")}) are surfacing signals for ${company}. Correlation engine has detected overlapping patterns.`,
        confidence,
        tags: [company, ...Array.from(lenses)],
      };
    }
  }

  if (signals.length > 0) {
    const latest = signals[0]!;
    return {
      headline: latest.headline,
      synthesis: latest.synthesis,
      confidence: latest.confidence,
      tags: [latest.lens],
    };
  }

  return null;
}

function tagClass(tag: string): string {
  if (tag === "gtm") {
    return "border-gtm/20 bg-gtm-bg text-gtm";
  }
  if (tag === "finance") {
    return "border-finance/20 bg-finance-bg text-finance";
  }
  if (tag === "security") {
    return "border-security/20 bg-security-bg text-security";
  }
  return "border-truth/20 bg-truth/10 text-truth";
}

export default function ConvergenceCard({ signals }: ConvergenceCardProps) {
  const router = useRouter();
  const convergence = findConvergence(signals);

  return (
    <section className="relative border-border-subtle border-b px-6 py-6">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 font-mono text-[10px] text-truth uppercase tracking-[0.08em]">
            Correlation Signal
          </div>
          <h1 className="max-w-[40ch] font-display font-semibold text-text-primary text-xl leading-snug tracking-tight">
            {convergence?.headline ??
              "Waiting for agent convergence signals..."}
          </h1>
        </div>
        <div className="text-right font-mono text-[10px] text-text-muted">
          <div className="font-bold font-display text-lg text-truth">
            {convergence ? `${Math.round(convergence.confidence * 100)}%` : "--"}
          </div>
          <div>confidence</div>
        </div>
      </div>
      <p className="mb-4 max-w-[65ch] text-text-secondary text-xs leading-relaxed">
        {convergence?.synthesis ??
          "Agents are actively collecting and analyzing data. The correlation engine will surface convergent signals as they appear across multiple lenses."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {convergence ? (
          convergence.tags.map((tag) => (
            <span
              className={`rounded border px-2 py-0.5 font-mono text-[10px] ${tagClass(tag)}`}
              key={tag}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="rounded border border-border-medium bg-surface px-2 py-0.5 font-mono text-[10px] text-text-muted">
            Collecting...
          </span>
        )}
        {convergence && (
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="ml-auto rounded border border-zinc-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
          >
            View Full Reports
          </button>
        )}
      </div>
    </section>
  );
}
