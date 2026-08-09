import { useEffect, useState } from "react";

const BYPASS_KEY = "avartan_admin_hold_bypass";
const BYPASS_PASSWORD = "avartan-dev";

export function BillingHoldOverlay() {
  const [hidden, setHidden] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const bypassed = sessionStorage.getItem(BYPASS_KEY) === "1";
    setHidden(bypassed);
  }, []);

  useEffect(() => {
    if (hidden) return;
    let streak = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        streak += 1;
        if (streak >= 5) {
          sessionStorage.setItem(BYPASS_KEY, "1");
          setHidden(true);
        }
      } else {
        streak = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hidden]);

  if (hidden) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === BYPASS_PASSWORD) {
      sessionStorage.setItem(BYPASS_KEY, "1");
      setHidden(true);
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center px-6"
      style={{ backgroundColor: "#1e293b" }}
    >
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.8" className="h-7 w-7">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <path d="M12 16.5h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: "#94a3b8" }}>
          Administrative Notice
        </h1>
        <p className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: "#e2e8f0" }}>
          Access to this preview instance has been temporarily suspended pending outstanding
          administrative or contractual approvals. Please contact the developer to resolve.
        </p>

        <form onSubmit={submit} className="mx-auto mt-8 flex max-w-sm items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Developer access code"
            className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none placeholder:text-slate-500 focus:border-white/30"
            style={{ color: "#f8fafc" }}
          />
          <button
            type="submit"
            className="h-11 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-medium transition-colors hover:bg-white/20"
            style={{ color: "#f8fafc" }}
          >
            Unlock
          </button>
        </form>
        {error && (
          <p className="mt-3 text-xs" style={{ color: "#f87171" }}>
            Invalid access code.
          </p>
        )}
      </div>
    </div>
  );
}