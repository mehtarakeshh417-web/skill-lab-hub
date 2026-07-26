import { ScrollText } from "lucide-react";

export function AuditTrailPlaceholder() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-10 shadow-elegant backdrop-blur-xl lg:p-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <ScrollText className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">Audit trail workspace</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Portal activity continues to be recorded securely in the background. The detailed audit
          trail view will be configured here next — nothing is lost in the meantime.
        </p>
      </div>
    </div>
  );
}