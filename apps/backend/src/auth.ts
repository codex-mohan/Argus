/// <reference types="bun" />

/**
 * Auth Module — Argon2id password hashing, JWT sessions
 *
 * Replaces bcrypt with Argon2id per AGENTS.md update.
 * Uses hash-wasm (pure WebAssembly) for Bun compatibility.
 */

import { Database } from "bun:sqlite";
import { argon2id } from "hash-wasm";
import { jwtVerify, SignJWT } from "jose";

const db = new Database("argus_state.sqlite");

// ─── Schema ────────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    onboarding_step INTEGER NOT NULL DEFAULT 0,
    watchlist TEXT,
    created_at TEXT NOT NULL,
    last_login TEXT
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
`);

// ─── Argon2id Config ──────────────────────────────────────────────────────

const ARGON2_MEMORY = 65_536; // 64 MB
const ARGON2_ITERATIONS = 3;
const ARGON2_PARALLELISM = 4;
const ARGON2_HASH_LENGTH = 32;
const ARGON2_SALT_LENGTH = 16;

// ─── JWT Config ────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "argus-dev-secret-change-in-production"
);
const JWT_EXPIRY = "7d";

export interface User {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  onboardingComplete: boolean;
  onboardingStep: number;
  role: string;
  watchlist: string[];
}

export interface AuthResult {
  error?: string;
  success: boolean;
  token?: string;
  user?: Omit<User, "watchlist"> & { watchlist: string[] };
}

// ─── Argon2id Hashing ───────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(ARGON2_SALT_LENGTH));
  const hash = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "encoded",
  });
  return hash as string;
}

async function verifyPassword(
  password: string,
  encodedHash: string
): Promise<boolean> {
  try {
    const hash = await argon2id({
      password,
      salt: new Uint8Array(0), // salt extracted from encoded hash internally by hash-wasm
      parallelism: ARGON2_PARALLELISM,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY,
      hashLength: ARGON2_HASH_LENGTH,
      outputType: "encoded",
    });
    // hash-wasm argon2id doesn't have a direct verify function.
    // We parse the encoded hash and compare.
    const parts = encodedHash.split("$");
    if (parts.length < 6) {
      return false;
    }
    const saltBase64 = parts[4] ?? "";
    const hashBase64 = parts[5] ?? "";
    if (!(saltBase64 && hashBase64)) {
      return false;
    }
    const salt = Buffer.from(saltBase64, "base64");
    const expectedHash = Buffer.from(hashBase64, "base64");

    const computed = await argon2id({
      password,
      salt,
      parallelism: ARGON2_PARALLELISM,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY,
      hashLength: ARGON2_HASH_LENGTH,
      outputType: "binary",
    });

    const computedBuf = Buffer.from(computed as Uint8Array);
    if (computedBuf.length !== expectedHash.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < computedBuf.length; i++) {
      diff |= computedBuf[i]! ^ expectedHash[i]!;
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ─── JWT ──────────────────────────────────────────────────────────────────

export async function createToken(
  userId: string,
  email: string
): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
    });
    if (typeof payload.sub === "string" && typeof payload.email === "string") {
      return { sub: payload.sub, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── User CRUD ─────────────────────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role),
    onboardingComplete: Boolean(row.onboarding_complete),
    onboardingStep: Number(row.onboarding_step),
    watchlist: row.watchlist ? JSON.parse(String(row.watchlist)) : [],
    createdAt: String(row.created_at),
  };
}

export function getUserByEmail(email: string): User | null {
  const row = db
    .query("SELECT * FROM users WHERE email = ?")
    .get(email) as Record<string, unknown> | null;
  if (!row) {
    return null;
  }
  return rowToUser(row);
}

export function getUserById(id: string): User | null {
  const row = db.query("SELECT * FROM users WHERE id = ?").get(id) as Record<
    string,
    unknown
  > | null;
  if (!row) {
    return null;
  }
  return rowToUser(row);
}

// ─── Auth Operations ──────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const existing = getUserByEmail(email);
  if (existing) {
    return { success: false, error: "Email already registered" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO users (id, email, name, password_hash, role, onboarding_complete, onboarding_step, watchlist, created_at, last_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email.toLowerCase().trim(),
      name.trim(),
      passwordHash,
      "analyst",
      0,
      0,
      JSON.stringify([]),
      now,
      null,
    ]
  );

  const token = await createToken(id, email.toLowerCase().trim());
  const user = getUserById(id);
  if (!user) {
    return { success: false, error: "Failed to create user" };
  }

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      watchlist: user.watchlist,
      createdAt: user.createdAt,
    },
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = getUserByEmail(email.toLowerCase().trim());
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const row = db
    .query("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as { password_hash: string } | null;
  if (!row) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  // Update last login
  db.run("UPDATE users SET last_login = ? WHERE id = ?", [
    new Date().toISOString(),
    user.id,
  ]);

  const token = await createToken(user.id, user.email);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      watchlist: user.watchlist,
      createdAt: user.createdAt,
    },
  };
}

export async function getCurrentUser(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }
  return getUserById(payload.sub);
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export function updateOnboarding(
  userId: string,
  step: number,
  complete: boolean
): void {
  db.run(
    "UPDATE users SET onboarding_step = ?, onboarding_complete = ? WHERE id = ?",
    [step, complete ? 1 : 0, userId]
  );
}

export function updateUserWatchlist(userId: string, companies: string[]): void {
  db.run("UPDATE users SET watchlist = ? WHERE id = ?", [
    JSON.stringify(companies),
    userId,
  ]);
}

// ─── Middleware Helper ──────────────────────────────────────────────────────

export function extractToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  // Also check cookie
  const cookie = req.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/argus_session=([^;]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}
