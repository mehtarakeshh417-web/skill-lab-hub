import { type LucideIcon, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Purely visual count-up. Falls back to the raw value for non-numeric input. */
function AnimatedValue({ value }: { value: string | number }) {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[, ]/g, ""));
  const animatable = Number.isFinite(numeric) && Math.abs(numeric) > 0 && Math.abs(numeric) < 1_000_000;
  const [display, setDisplay] = useState(animatable ? 0 : numeric);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!animatable) return;
    const duration = 700;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(numeric * eased));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [numeric, animatable]);

  if (!animatable) return <>{value}</>;
  return <>{display.toLocaleString()}</>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  to,
  search,
  hash,
  onClick,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  /** When provided, the whole card becomes a link to the detailed view. */
  to?: string;
  search?: Record<string, string>;
  hash?: string;
  /** When provided (and no `to`), the whole card becomes a button. */
  onClick?: () => void;
  /** Short line telling the user what opens when they click the card. */
  hint?: string;
}) {
  const interactive = Boolean(to || onClick || hash);

  const body = (
    <>
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="chip-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-4 font-display text-4xl font-bold tracking-tight text-gradient tabular-nums">
        <AnimatedValue value={value} />
      </div>
      {trend && <div className="relative mt-1 text-xs font-semibold text-success">{trend}</div>}
      {interactive && (
        <div className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 transition-opacity group-hover:opacity-100">
          {hint ?? "View details"}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      )}
    </>
  );

  const base = cn(
    "slab-3d gloss-sweep relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-card/60 p-6 backdrop-blur-xl",
    interactive &&
      "group cursor-pointer text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  if (to) {
    return (
      <Link to={to} search={search} hash={hash} className={base} aria-label={`${label}: ${value}. ${hint ?? "View details"}`}>
        {body}
      </Link>
    );
  }

  if (!to && hash) {
    return (
      <a href={`#${hash}`} className={base} aria-label={`${label}: ${value}. ${hint ?? "View details"}`}>
        {body}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, "w-full")} aria-label={`${label}: ${value}. ${hint ?? "View details"}`}>
        {body}
      </button>
    );
  }

  return <div className={base}>{body}</div>;
}