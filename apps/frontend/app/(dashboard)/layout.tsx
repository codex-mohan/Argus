"use client";

import type { ReactNode } from "react";
import RouteGuard from "@/components/route-guard.tsx";
import { Sidebar } from "@/components/sidebar.tsx";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-base">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}
