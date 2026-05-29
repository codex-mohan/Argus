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
  } catch {
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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error ?? "Login failed");
    }
    setToken(data.token);
    setUser(data.user);
  }

  async function register(email: string, password: string, name: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error ?? "Registration failed");
    }
    setToken(data.token);
    setUser(data.user);
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
