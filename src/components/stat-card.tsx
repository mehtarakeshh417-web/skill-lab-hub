import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={cn("slab-3d gloss-sweep relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-card/60 backdrop-blur-xl p-6", className)}>
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="chip-3d flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-4 font-display text-4xl font-bold tracking-tight text-gradient">{value}</div>
      {trend && <div className="relative mt-1 text-xs font-semibold text-success">{trend}</div>}
    </div>
  );
}