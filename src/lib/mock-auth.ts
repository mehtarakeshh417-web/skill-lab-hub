// Mock authentication registry + session.
// Stores seed credential matrices and any accounts created through the
// Portal Manager UI. Persisted to localStorage so the dashboards survive a
// reload exactly like a real session would.

import type { AppRole } from "./auth";

export type MockAccount = {
  username: string;
  password: string;
  role: AppRole;
  fullName: string;
  email: string;
  // Relational hierarchy
  schoolCode?: string;          // for school / teacher / student
  schoolName?: string;
  teacherId?: string;           // for student → teacher mapping
  teacherName?: string;
  classSection?: string;        // for student
  meta?: Record<string, string>;
};

export type MockSession = {
  username: string;
  role: AppRole;
  fullName: string;
  email: string;
  issuedAt: number;
};

const ACCOUNTS_KEY = "avartan.mock.accounts.v1";
const SESSION_KEY = "avartan.mock.session.v1";

const SEED_ACCOUNTS: MockAccount[] = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    fullName: "Platform Administrator",
    email: "admin@avartan.app",
  },
  {
    username: "manager",
    password: "manager123",
    role: "portal_manager",
    fullName: "Portal Operations Manager",
    email: "manager@avartan.app",
  },
  {
    username: "school",
    password: "school123",
    role: "school",
    fullName: "Avartan Test Academy",
    email: "school@avartan.app",
    schoolCode: "SCHOOL",
    schoolName: "Avartan Test Academy",
  },
  {
    username: "teacher",
    password: "teacher123",
    role: "teacher",
    fullName: "Lead Instructor",
    email: "teacher@avartan.app",
    schoolCode: "SCHOOL",
    schoolName: "Avartan Test Academy",
    teacherId: "TEACHER",
    teacherName: "Lead Instructor",
  },
  {
    username: "student",
    password: "student123",
    role: "student",
    fullName: "Demo Student",
    email: "student@avartan.app",
    schoolCode: "SCHOOL",
    schoolName: "Avartan Test Academy",
    teacherId: "TEACHER",
    teacherName: "Lead Instructor",
    classSection: "VI-A",
    meta: { admissionId: "STUDENT", grade: "6", section: "A" },
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function readAccounts(): MockAccount[] {
  if (!isBrowser()) return SEED_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
      return [...SEED_ACCOUNTS];
    }
    const parsed = JSON.parse(raw) as MockAccount[];
    // Ensure the 5 default seeds are always present (idempotent reseed).
    const merged = [...parsed];
    for (const seed of SEED_ACCOUNTS) {
      if (!merged.some((a) => a.username.toLowerCase() === seed.username.toLowerCase())) {
        merged.push(seed);
      }
    }
    if (merged.length !== parsed.length) {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return [...SEED_ACCOUNTS];
  }
}

function writeAccounts(accounts: MockAccount[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent("avartan-mock-accounts"));
}

export function listMockAccounts(): MockAccount[] {
  return readAccounts();
}

export function getMockAccount(username: string): MockAccount | undefined {
  return readAccounts().find(
    (a) => a.username.toLowerCase() === username.toLowerCase()
  );
}

export function subscribeMockAccounts(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("avartan-mock-accounts", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("avartan-mock-accounts", handler);
    window.removeEventListener("storage", handler);
  };
}

export function seedDefaultMockAccounts() {
  // Touches storage to ensure the five seeds exist on first run.
  readAccounts();
}

export function registerMockAccount(account: MockAccount): { ok: boolean; reason?: string } {
  const accounts = readAccounts();
  if (!account.username || !account.password) {
    return { ok: false, reason: "Username and password are required" };
  }
  if (accounts.some((a) => a.username.toLowerCase() === account.username.toLowerCase())) {
    return { ok: false, reason: "Username already exists" };
  }
  writeAccounts([...accounts, account]);
  return { ok: true };
}

export function removeMockAccount(username: string) {
  const accounts = readAccounts().filter(
    (a) => a.username.toLowerCase() !== username.toLowerCase()
  );
  writeAccounts(accounts);
}

export function getMockSession(): MockSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: MockSession | null) {
  if (!isBrowser()) return;
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new CustomEvent("avartan-mock-session"));
}

export function mockSignIn(
  identifier: string,
  password: string
): { ok: boolean; session?: MockSession; reason?: string } {
  const id = identifier.trim().toLowerCase();
  if (!id || !password) return { ok: false, reason: "Missing credentials" };
  const account = readAccounts().find(
    (a) => a.username.toLowerCase() === id || a.email.toLowerCase() === id
  );
  if (!account) return { ok: false, reason: "No matching account" };
  if (account.password !== password) return { ok: false, reason: "Invalid password" };
  const session: MockSession = {
    username: account.username,
    role: account.role,
    fullName: account.fullName,
    email: account.email,
    issuedAt: Date.now(),
  };
  writeSession(session);
  return { ok: true, session };
}

export function mockSignOut() {
  writeSession(null);
}

export function subscribeMockSession(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("avartan-mock-session", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("avartan-mock-session", handler);
    window.removeEventListener("storage", handler);
  };
}