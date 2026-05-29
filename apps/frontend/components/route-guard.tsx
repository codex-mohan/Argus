"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context.tsx";

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ["/login", "/register", "/"];
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (!loading) {
      if (!(user || isPublic)) {
        // Not logged in and trying to access protected route
        router.replace("/login");
      } else if (
        user &&
        !user.onboardingComplete &&
        pathname !== "/onboarding" &&
        !isPublic
      ) {
        // Logged in but onboarding not complete
        router.replace("/onboarding");
      } else if (
        user &&
        user.onboardingComplete &&
        (pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/onboarding")
      ) {
        // Already fully onboarded, redirect to dashboard
        router.replace("/dashboard");
      }
    }
  }, [user, loading, pathname, router, isPublic]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Only render children if:
  // - Public path (login, register, landing)
  // - Authenticated user on protected path
  // - Onboarding page when user exists but not complete
  if (isPublic || user) {
    return <>{children}</>;
  }

  // Not authenticated, not public — will redirect
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-sm text-zinc-500">Redirecting...</div>
    </div>
  );
}
