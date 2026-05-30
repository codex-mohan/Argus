"use client";

import type { ReactNode } from "react";
import RouteGuard from "@/components/route-guard.tsx";
import { Sidebar } from "@/components/sidebar.tsx";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden bg-base">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
