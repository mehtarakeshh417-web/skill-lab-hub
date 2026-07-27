import { useEffect, useState, useCallback, useRef } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeMode = "dark" | "light";
const STORAGE_KEY = "avartan.theme";
const ACCENT_KEY = "avartan.accent";

export type AccentTheme = {
  id: string;
  label: string;
  swatch: string;
};

export const ACCENTS: AccentTheme[] = [
  { id: "crimson", label: "Crimson", swatch: "oklch(0.55 0.20 25)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.55 0.17 12)" },
  { id: "orange", label: "Sunset", swatch: "oklch(0.55 0.17 55)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.60 0.15 80)" },
  { id: "emerald", label: "Emerald", swatch: "oklch(0.55 0.15 162)" },
  { id: "teal", label: "Teal", swatch: "oklch(0.55 0.12 190)" },
  { id: "cyan", label: "Ocean", swatch: "oklch(0.55 0.13 210)" },
  { id: "blue", label: "Sapphire", swatch: "oklch(0.55 0.17 250)" },
  { id: "indigo", label: "Indigo", swatch: "oklch(0.55 0.17 275)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.55 0.17 305)" },
  { id: "magenta", label: "Orchid", swatch: "oklch(0.55 0.18 340)" },
  { id: "slate", label: "Graphite", swatch: "oklch(0.55 0.045 250)" },
];

/* tiny shared store so every picker on the page stays in sync */
const listeners = new Set<() => void>();
let currentMode: ThemeMode = "dark";
let currentAccent = "crimson";
const emit = () => listeners.forEach((l) => l());

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  root.style.colorScheme = mode;
}

function applyAccent(accent: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-accent", accent);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(currentMode);
  const [accent, setAccentState] = useState<string>(currentAccent);

  useEffect(() => {
    const sync = () => {
      setMode(currentMode);
      setAccentState(currentAccent);
    };
    listeners.add(sync);
    return () => void listeners.delete(sync);
  }, []);

  useEffect(() => {
    let initial: ThemeMode = "dark";
    let initialAccent = "crimson";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") initial = stored;
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) initial = "light";
      const storedAccent = localStorage.getItem(ACCENT_KEY);
      if (storedAccent && ACCENTS.some((a) => a.id === storedAccent)) initialAccent = storedAccent;
    } catch { /* ignore */ }
    currentMode = initial;
    currentAccent = initialAccent;
    applyTheme(initial);
    applyAccent(initialAccent);
    emit();
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    currentMode = next;
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    emit();
  }, []);

  const setAccent = useCallback((next: string) => {
    currentAccent = next;
    applyAccent(next);
    try { localStorage.setItem(ACCENT_KEY, next); } catch { /* ignore */ }
    emit();
  }, []);

  const toggle = useCallback(() => setTheme(mode === "dark" ? "light" : "dark"), [mode, setTheme]);

  return { mode, setTheme, toggle, accent, setAccent };
}

export function ThemePicker({
  className,
  align = "right",
  side = "bottom",
}: {
  className?: string;
  align?: "left" | "right";
  side?: "bottom" | "top";
}) {
  const { mode, setTheme, accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Change theme"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/60 backdrop-blur-md transition-all duration-300",
          "hover:border-primary/50 hover:shadow-[0_0_24px_-6px_var(--primary)] active:scale-95",
          open && "border-primary/60",
        )}
      >
        <Palette className="h-4 w-4 text-primary" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-64 rounded-2xl border border-border/60 bg-popover/95 p-4 shadow-lg backdrop-blur-xl",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Appearance</span>
            <div className="flex rounded-lg border border-border/60 p-0.5">
              {(["light", "dark"] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTheme(m)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold capitalize transition-colors",
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "light" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Color theme</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.label}
                aria-label={`${a.label} theme`}
                onClick={() => setAccent(a.id)}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all duration-200 active:scale-95",
                  accent === a.id ? "border-primary/70 bg-primary/10" : "border-transparent hover:border-border",
                )}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg shadow-sm"
                  style={{ background: a.swatch }}
                >
                  {accent === a.id && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="w-full truncate text-center text-[0.6rem] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "group relative inline-flex h-8 w-[58px] items-center rounded-full border border-border/60 bg-card/60 px-1 backdrop-blur-md transition-all duration-500",
        "hover:border-primary/50 hover:shadow-[0_0_24px_-6px_var(--primary)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_4px_14px_-2px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out",
          isDark
            ? "translate-x-0 from-emerald-500 to-teal-500"
            : "translate-x-[26px] from-amber-300 to-orange-400",
        )}
      >
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 text-white transition-all duration-500",
            isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 text-white transition-all duration-500",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
          )}
        />
      </span>
      <Sun className={cn("ml-1 h-3 w-3 transition-opacity", isDark ? "opacity-30" : "opacity-0")} />
      <Moon className={cn("ml-auto mr-1 h-3 w-3 transition-opacity", isDark ? "opacity-0" : "opacity-30")} />
    </button>
  );
}