"use client";

interface AuditScoreRingProps {
  label: string;
  score: number;
  size?: number;
  subtle?: boolean;
  verdict?: string;
}

const TONE_COLORS = {
  good: "rgb(16, 185, 129)", // emerald-500
  mid: "rgb(245, 158, 11)", // amber-500
  bad: "rgb(239, 68, 68)", // red-500
};

function scoreTone(score: number): "good" | "mid" | "bad" {
  if (score >= 70) {
    return "good";
  }
  if (score >= 40) {
    return "mid";
  }
  return "bad";
}

export function AuditScoreRing({
  score,
  label,
  verdict,
  size = 100,
  subtle = false,
}: AuditScoreRingProps) {
  const valid = Number.isFinite(score) && score >= 0;
  const clamped = valid ? Math.max(0, Math.min(100, score)) : 0;
  const tone = valid ? scoreTone(clamped) : "bad";
  const strokeColor = subtle ? "rgb(82, 82, 91)" : TONE_COLORS[tone];

  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90 transform" height={size} width={size}>
          <circle
            cx={c}
            cy={c}
            fill="none"
            r={r}
            stroke="rgb(39, 39, 42)"
            strokeWidth={stroke}
          />
          {valid && (
            <circle
              cx={c}
              cy={c}
              fill="none"
              r={r}
              stroke={strokeColor}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              strokeWidth={stroke}
              style={{ transition: "stroke-dasharray 600ms ease-out" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {valid ? (
            <>
              <span className="font-bold text-2xl text-zinc-100 tracking-tight">
                {clamped}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                / 100
              </span>
            </>
          ) : (
            <span className="text-xs text-zinc-600 uppercase tracking-wider">
              —
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="font-semibold text-xs text-zinc-300 uppercase tracking-wider">
          {label}
        </div>
        {verdict && (
          <div
            className={`mt-0.5 font-mono text-[11px] uppercase ${
              verdict === "converged"
                ? "text-emerald-300"
                : verdict === "contradicted"
                  ? "text-red-300"
                  : "text-zinc-500"
            }`}
          >
            {verdict}
          </div>
        )}
      </div>
    </div>
  );
}
