// Shared, user-facing message helpers.
// Keeps tone consistent: plain language, one clear next step, no raw error codes.

const TECHNICAL_PATTERNS: Array<{ test: RegExp; message: string }> = [
  { test: /failed to fetch|networkerror|network request failed/i, message: "We couldn't reach the server. Check your internet connection and try again." },
  { test: /unauthorized|401|no authorization header/i, message: "Your session has expired. Please sign in again to continue." },
  { test: /forbidden|403|not allowed|permission/i, message: "You don't have permission to do this. Contact your portal administrator if you need access." },
  { test: /not found|404/i, message: "We couldn't find that record. It may have been removed or renamed." },
  { test: /duplicate|already exists|unique constraint/i, message: "That entry already exists. Please use a different value." },
  { test: /timeout|timed out/i, message: "The request took too long to complete. Please try again in a moment." },
  { test: /invalid login credentials/i, message: "That username or password isn't correct. Please check and try again." },
  { test: /jwt|token|server function|rpc|supabase|postgrest|500|internal server/i, message: "Something went wrong on our side. Please try again — if it keeps happening, contact support." },
];

/** Turns any thrown value into a clear, non-technical sentence for the user. */
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!raw.trim()) return fallback;
  for (const { test, message } of TECHNICAL_PATTERNS) {
    if (test.test(raw)) return message;
  }
  const looksTechnical = /[{}<>]|\bat \w+\.\w+|\berror:\s|^[A-Z_]{4,}$/.test(raw) || raw.length > 180;
  if (looksTechnical) return fallback;
  return /[.!?]$/.test(raw) ? raw : `${raw}.`;
}

/** Pluralise a count with its noun, e.g. countLabel(1, "student") -> "1 student". */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}