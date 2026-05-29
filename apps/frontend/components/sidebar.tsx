"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context.tsx";
import { useSignalStream } from "@/lib/api.ts";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "⌘" },
  { label: "Chat", href: "/chat", icon: "◆" },
  { label: "Agents", href: "/agents", icon: "◈" },
  { label: "Signals", href: "/signals", icon: "◎" },
  { label: "Reports", href: "/reports", icon: "▤" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected } = useSignalStream();

  // Backend health check
  const [health, setHealth] = useState<{
    brightdata?: boolean;
    cognee?: boolean;
    pipeline?: boolean;
  }>({});

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        setHealth({
          brightdata: d.mcp?.brightdata?.connected ?? false,
          cognee: d.mcp?.cognee?.connected ?? false,
          pipeline: d.pipeline ?? false,
        });
      })
      .catch(() => setHealth({}));

    const id = setInterval(() => {
      fetch("/health")
        .then((r) => r.json().catch(() => ({})))
        .then((d) => {
          setHealth({
            brightdata: d.mcp?.brightdata?.connected ?? false,
            cognee: d.mcp?.cognee?.connected ?? false,
            pipeline: d.pipeline ?? false,
          });
        })
        .catch(() => setHealth({}));
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <aside className="flex w-56 flex-col border-zinc-800 border-r bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="font-bold text-lg text-zinc-100">ARGUS</span>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-bold text-[10px] text-amber-300">
          v2
        </span>
      </div>

      <nav className="flex-1 px-2 py-2">
        <div className="mb-2 px-2 font-semibold text-[10px] text-zinc-600 uppercase tracking-wider">
          Command
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  className={`flex items-center gap-2.5 rounded-md px-2 py-2 font-medium text-xs transition ${
                    active
                      ? "bg-amber-500/10 text-amber-300"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                  href={item.href}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-[10px]">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-2 font-semibold text-[10px] text-zinc-600 uppercase tracking-wider">
          Status
        </div>
        <div className="mt-2 space-y-2 px-2">
          <StatusBadge
            label="Bright Data"
            status={health.brightdata ? "connected" : "error"}
          />
          <StatusBadge
            label="Cognee"
            status={health.cognee ? "connected" : "degraded"}
          />
          <StatusBadge
            label="Pipeline"
            status={health.pipeline ? "connected" : "idle"}
          />
          <StatusBadge label="SSE" status={connected ? "connected" : "error"} />
        </div>
      </nav>

      <div className="border-zinc-800 border-t p-3">
        <UserSection />
      </div>
    </aside>
  );
}

function UserSection() {
  const { user, logout } = useAuth();

  return (
    <div>
      {user && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 font-bold text-[10px] text-zinc-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-[11px] text-zinc-200">
              {user.name}
            </div>
            <div className="truncate text-[10px] text-zinc-600">
              {user.email}
            </div>
          </div>
        </div>
      )}
      <div className="text-[10px] text-zinc-600">
        <div className="mb-1 font-semibold uppercase tracking-wider">
          Credits
        </div>
        <div className="h-1.5 w-full bg-zinc-800">
          <div className="h-full bg-emerald-500" style={{ width: "0%" }} />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Check /api/credits</span>
          {user ? (
            <button
              className="text-[10px] text-zinc-500 hover:text-red-400"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          ) : (
            <span className="text-emerald-500">Live</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: "connected" | "degraded" | "idle" | "error";
}) {
  const colors = {
    connected: "bg-emerald-500",
    degraded: "bg-amber-500",
    idle: "bg-zinc-600",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[status]}`} />
      <span className="text-[11px] text-zinc-400">{label}</span>
    </div>
  );
}
