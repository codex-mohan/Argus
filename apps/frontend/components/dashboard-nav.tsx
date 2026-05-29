"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Agents", href: "/agents" },
  { label: "Signals", href: "/signals" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-zinc-800 border-b bg-zinc-950 px-4 py-2">
      <div className="mr-4 font-bold font-mono text-sm text-zinc-100">
        ARGUS
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            className={`rounded-md px-3 py-1.5 font-medium text-xs transition ${
              active
                ? "bg-amber-500/20 text-amber-300"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
