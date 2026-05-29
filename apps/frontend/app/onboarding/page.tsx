"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context.tsx";
import { TagInput } from "@/components/tag-input.tsx";

const STEPS = [
  {
    id: 0,
    label: "Welcome",
    description: "Your three-lens intelligence platform",
  },
  { id: 1, label: "Connect", description: "Data sources & providers" },
  { id: 2, label: "Watchlist", description: "Companies to monitor" },
  { id: 3, label: "Complete", description: "Start analyzing" },
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(user?.onboardingStep ?? 0);
  const [watchlistItems, setWatchlistItems] = useState<string[]>(user?.watchlist ?? []);
  const [saving, setSaving] = useState(false);

  // If onboarding is already complete, redirect
  if (user?.onboardingComplete) {
    window.location.href = "/dashboard";
    return null;
  }

  async function saveStep(newStep: number, complete = false) {
    setSaving(true);
    try {
      const token = localStorage.getItem("argus_token");
      const res = await fetch("/api/auth/onboarding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          step: newStep,
          complete,
          watchlist: watchlistItems.length > 0 ? watchlistItems : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
      }
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    const nextStep = step + 1;
    if (nextStep >= STEPS.length - 1) {
      await saveStep(nextStep, true);
      window.location.href = "/dashboard";
    } else {
      await saveStep(nextStep, false);
      setStep(nextStep);
    }
  }

  async function back() {
    const prevStep = Math.max(0, step - 1);
    await saveStep(prevStep, false);
    setStep(prevStep);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-2xl">
        {/* Timeline Stepper */}
        <div className="mb-10">
          <div className="relative flex items-center justify-between">
            {/* Background line — full width behind everything */}
            <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-zinc-800" />

            {STEPS.map((s, i) => {
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div
                  className="relative z-10 flex flex-col items-center gap-2"
                  key={s.id}
                >
                  {/* Circle — bg-zinc-950 hides the line behind it */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-zinc-950 font-bold text-sm transition-colors ${
                      isActive
                        ? "border-amber-500 text-amber-400"
                        : isDone
                          ? "border-emerald-500 text-emerald-400"
                          : "border-zinc-700 text-zinc-600"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-semibold text-xs ${
                        isActive
                          ? "text-amber-400"
                          : isDone
                            ? "text-emerald-400"
                            : "text-zinc-600"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {s.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="border border-zinc-800 bg-zinc-950 p-8">
          {step === 0 && <WelcomeStep />}
          {step === 1 && <ConnectStep />}
          {step === 2 && (
            <WatchlistStep
              tags={watchlistItems}
              onChange={setWatchlistItems}
            />
          )}
          {step === 3 && <CompleteStep />}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              className="rounded border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
              disabled={step === 0 || saving}
              onClick={back}
              type="button"
            >
              Back
            </button>
            <button
              className="rounded bg-amber-600 px-6 py-2 font-semibold text-white text-xs hover:bg-amber-500 disabled:opacity-50"
              disabled={saving}
              onClick={next}
              type="button"
            >
              {saving
                ? "Saving..."
                : step === STEPS.length - 1
                  ? "Go to Dashboard"
                  : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg text-zinc-100">
        Welcome to Argus
      </h2>
      <p className="mb-6 text-sm text-zinc-400 leading-relaxed">
        Argus is a unified enterprise intelligence platform. One set of web
        data, three lenses:
      </p>
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          {
            label: "GTM Lens",
            color: "text-amber-400",
            desc: "Competitor moves, hiring signals, buying intent",
          },
          {
            label: "Finance Lens",
            color: "text-emerald-400",
            desc: "Alpha signals, supply-chain stress, filing divergence",
          },
          {
            label: "Security Lens",
            color: "text-red-400",
            desc: "Vendor risk, regulatory actions, threat intel",
          },
        ].map((lens) => (
          <div className="border border-zinc-800 p-4" key={lens.label}>
            <div className={`mb-1 font-bold text-xs uppercase ${lens.color}`}>
              {lens.label}
            </div>
            <div className="text-[10px] text-zinc-500 leading-relaxed">
              {lens.desc}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Every web signal is stored once in Cognee, then analyzed through all
        three lenses. Cross-lens correlation reveals what no single lens can see
        alone.
      </p>
    </div>
  );
}

function ConnectStep() {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg text-zinc-100">
        Connect Data Sources
      </h2>
      <p className="mb-6 text-sm text-zinc-400">
        Argus uses Bright Data for web collection and Cognee for persistent
        memory. These are configured server-side and will be active once your
        pipeline starts.
      </p>
      <div className="space-y-3">
        {[
          {
            name: "Bright Data",
            desc: "Web scraping & SERP",
            status: "Configured",
          },
          {
            name: "Cognee MCP",
            desc: "Persistent knowledge graph",
            status: "Configured",
          },
          {
            name: "AI/ML API",
            desc: "LLM provider (DeepSeek, Claude, Gemini)",
            status: "Configured",
          },
        ].map((src) => (
          <div
            className="flex items-center justify-between border border-zinc-800 p-3"
            key={src.name}
          >
            <div>
              <div className="text-sm text-zinc-200">{src.name}</div>
              <div className="text-[10px] text-zinc-500">{src.desc}</div>
            </div>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              {src.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistStep({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg text-zinc-100">
        Configure Watchlist
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        Add the companies you want to monitor. Press Enter after each one or paste comma-separated values.
      </p>
      <TagInput tags={tags} onChange={onChange} placeholder="Type company name and press Enter..." />
      <p className="mt-2 text-[10px] text-zinc-600">
        Tip: Add 3-5 companies to start. You can always expand your watchlist from the dashboard.
      </p>
    </div>
  );

}

function CompleteStep() {
  return (
    <div className="text-center">
      <div className="mb-4 text-4xl">🎯</div>
      <h2 className="mb-2 font-semibold text-lg text-zinc-100">
        You&apos;re all set
      </h2>
      <p className="text-sm text-zinc-400">
        Your Argus command deck is ready. The pipeline will begin monitoring
        your watchlist and surfacing signals across all three lenses.
      </p>
    </div>
  );
}
