"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context.tsx";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-1 font-bold text-2xl text-zinc-100">ARGUS</h1>
          <p className="text-xs text-zinc-500">
            Create your intelligence account
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              Full Name
            </label>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              Email
            </label>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              Password
            </label>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
            <p className="mt-1 text-[10px] text-zinc-600">
              Minimum 8 characters. No complexity rules.
            </p>
          </div>

          <button
            className="w-full rounded bg-amber-600 py-2 font-semibold text-sm text-white hover:bg-amber-500 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <a className="text-amber-400 hover:underline" href="/login">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
