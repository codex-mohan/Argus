"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  onboardingComplete: boolean;
  onboardingStep: number;
  role: string;
  watchlist: string[];
}

interface AuthContextType {
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("argus_token");
}

function setToken(token: string) {
  localStorage.setItem("argus_token", token);
}

function removeToken() {
  localStorage.removeItem("argus_token");
}

async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) {
    return null;
  }
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.user ?? null;
  } catch (err) {
    console.error("[Auth] fetchMe failed:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    console.log(`[Auth] Attempting login for ${email}`);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error(`[Auth] Login failed. Status: ${res.status}. Response wasn't JSON:`, text.slice(0, 100));
        throw new Error(`Server returned ${res.status} (Not JSON). Is the API URL correct?`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? `Login failed with status ${res.status}`);
      }
      setToken(data.token);
      setUser(data.user);
      console.log(`[Auth] Login successful for ${email}`);
    } catch (err) {
      console.error("[Auth] Login exception:", err);
      throw err;
    }
  }

  async function register(email: string, password: string, name: string) {
    console.log(`[Auth] Attempting register for ${email}`);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error(`[Auth] Register failed. Status: ${res.status}. Response wasn't JSON:`, text.slice(0, 100));
        throw new Error(`Server returned ${res.status} (Not JSON). Is the API URL correct?`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? `Registration failed with status ${res.status}`);
      }
      setToken(data.token);
      setUser(data.user);
      console.log(`[Auth] Registration successful for ${email}`);
    } catch (err) {
      console.error("[Auth] Register exception:", err);
      throw err;
    }
  }

  function logout() {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  }

  function updateUser(u: AuthUser) {
    setUser(u);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && !!user;
}
