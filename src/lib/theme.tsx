import { useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeMode = "dark" | "light";
const STORAGE_KEY = "avartan.theme";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  root.style.colorScheme = mode;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    let initial: ThemeMode = "dark";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") initial = stored;
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) initial = "light";
    } catch { /* ignore */ }
    setMode(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => setTheme(mode === "dark" ? "light" : "dark"), [mode, setTheme]);

  return { mode, setTheme, toggle };
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