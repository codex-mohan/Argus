"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context.tsx";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 font-sans selection:bg-white/30 selection:text-white py-12">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,var(--color-gtm)_0%,transparent_70%)] opacity-10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,var(--color-finance)_0%,transparent_70%)] opacity-10 blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 39.5h40M39.5 0v40' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-[fade-in-up_0.8s_ease-out_both]">
        {/* Logo Header */}
        <div className="mb-10 text-center">
          <Link href="/landing" className="inline-block transition-opacity hover:opacity-80">
            <h1 className="font-display text-4xl font-light tracking-widest text-white">
              ARGUS
            </h1>
          </Link>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Create Intelligence Account
          </p>
        </div>

        {/* Auth Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="mb-8">
            <h2 className="text-xl font-medium text-white">Join the platform</h2>
            <p className="mt-1 text-sm text-white/50">
              Set up your account to start gathering intelligence.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="animate-[fade-in_0.3s_ease-out] rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Full Name
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  type="text"
                  value={name}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Email Address
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@enterprise.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                  minLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>
              <p className="mt-1 text-[10px] text-white/30">
                Minimum 8 characters. No complexity rules.
              </p>
            </div>

            <button
              className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link
            className="font-medium text-white transition-colors hover:text-white/80"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
