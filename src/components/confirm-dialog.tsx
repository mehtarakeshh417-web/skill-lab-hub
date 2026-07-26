import { type ReactNode } from "react";
import { AlertTriangle, Loader2, ShieldAlert, Power, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "warning" | "neutral";

const TONE = {
  danger: { icon: ShieldAlert, ring: "bg-destructive/10 text-destructive", button: "destructive" as const },
  warning: { icon: AlertTriangle, ring: "bg-amber-500/10 text-amber-600 dark:text-amber-400", button: "default" as const },
  neutral: { icon: Info, ring: "bg-primary/10 text-primary", button: "default" as const },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  impact,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "warning",
  busy = false,
  icon: IconOverride,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  details?: ReactNode;
  impact?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  icon?: typeof Power;
  onConfirm: () => void;
}) {
  const toneCfg = TONE[tone];
  const Icon = IconOverride ?? toneCfg.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <div className={cn("mb-2 flex h-12 w-12 items-center justify-center rounded-2xl", toneCfg.ring)}>
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {impact && impact.length > 0 && (
          <ul className="space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm">
            {impact.map((line) => (
              <li key={line} className="flex gap-2 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {details}

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={toneCfg.button} className="rounded-xl" disabled={busy} onClick={onConfirm}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}