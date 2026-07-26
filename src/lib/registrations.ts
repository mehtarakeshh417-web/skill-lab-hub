// Cross-route mock store for public school self-registrations.
// Used by both the public homepage form (/) and the Portal Manager console.

import { useSyncExternalStore } from "react";

export type RegistrationStatus = "Pending Approval" | "Approved" | "Rejected";

export type SchoolRegistration = {
  id: string;
  schoolName: string;
  schoolCode: string;
  principalName: string;
  region: string;
  designation: string;
  notes: string;
  submittedAt: string; // ISO
  status: RegistrationStatus;
  generatedPassword?: string;
};

const seed: SchoolRegistration[] = [
  {
    id: "rg1", schoolName: "Jaipur Maker Academy", schoolCode: "SCH-JAI-204",
    principalName: "Dr. Neha Khandelwal", region: "Rajasthan / Jaipur",
    designation: "Principal", notes: "Requesting onboarding for grades 6–10 with HTML, Scratch and MySQL tracks.",
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "Pending Approval",
  },
  {
    id: "rg2", schoolName: "Kochi Coastal Tech School", schoolCode: "SCH-KCH-118",
    principalName: "Mr. Anil George", region: "Kerala / Kochi",
    designation: "Head of Academics", notes: "30 teacher accounts and 540 student licenses needed for AY26.",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "Pending Approval",
  },
  {
    id: "rg3", schoolName: "Chandigarh Bright Minds", schoolCode: "SCH-CHD-066",
    principalName: "Mrs. Simran Kaur", region: "Punjab / Chandigarh",
    designation: "Director", notes: "Pilot for primary computing curriculum across two campuses.",
    submittedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    status: "Pending Approval",
  },
];

let _regs: SchoolRegistration[] = [...seed];
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export function getRegistrations(): SchoolRegistration[] { return _regs; }

export function addRegistration(r: Omit<SchoolRegistration, "id" | "submittedAt" | "status">): SchoolRegistration {
  const item: SchoolRegistration = {
    ...r,
    id: `rg${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: "Pending Approval",
  };
  _regs = [item, ..._regs];
  emit();
  return item;
}

export function setRegistrationStatus(id: string, status: RegistrationStatus, generatedPassword?: string) {
  _regs = _regs.map((r) => (r.id === id ? { ...r, status, generatedPassword: generatedPassword ?? r.generatedPassword } : r));
  emit();
}

export function removeRegistration(id: string) {
  _regs = _regs.filter((r) => r.id !== id);
  emit();
}

export function isSchoolCodeTaken(code: string): boolean {
  const c = code.trim().toUpperCase();
  return _regs.some((r) => r.schoolCode.toUpperCase() === c);
}

export function useRegistrations(): SchoolRegistration[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => _regs,
    () => _regs,
  );
}

export function generatePassword(len = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let out = "";
  const buf = new Uint32Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) {
    const idx = (buf[i] || Math.floor(Math.random() * 1e9)) % chars.length;
    out += chars[idx];
  }
  return out;
}

/** Server errors may be tagged as "[fieldName] message" so the UI can attach them to a field. */
export function parseFieldError(message: string): { field?: string; message: string } {
  const m = /^\[([a-zA-Z]+)\]\s*(.*)$/.exec(message.trim());
  if (!m) return { message };
  return { field: m[1], message: m[2] };
}

function _unusedGeneratePassword(len = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let out = "";
  const buf = new Uint32Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) {
    const idx = (buf[i] || Math.floor(Math.random() * 1e9)) % chars.length;
    out += chars[idx];
  }
  return out;
}
