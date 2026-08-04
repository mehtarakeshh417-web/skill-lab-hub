import { useEffect, useState } from "react";
import { HelpCircle, X, ArrowRight, ArrowLeft, Sparkles, Layers, Code2, BrainCircuit, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  title: string;
  body: string;
  icon: typeof Sparkles;
  accent: string;
};

const STEPS: Step[] = [
  {
    title: "Switch role views",
    body: "Use the role selector in the left sidebar to switch between Admin, Portal Manager, School, Teacher and Student views. Each panel updates to match the selected role.",
    icon: Layers,
    accent: "from-emerald-500/40 to-teal-500/30",
  },
  {
    title: "Explore the technology labs",
    body: "Open the Student view to access the full set of labs, including HTML/CSS, SQL, Java, Scratch, Scratch Jr, Word, Excel, PowerPoint and Paint. Each lab is fully functional.",
    icon: Code2,
    accent: "from-emerald-500/40 to-teal-500/30",
  },
  {
    title: "Generate quizzes with AI",
    body: "In the Teacher console, the assignment creator can structure MCQ, true/false, fill-in-the-blank or mixed quizzes, and generate questions automatically. Review, edit and publish from a single flow.",
    icon: BrainCircuit,
    accent: "from-amber-500/40 to-rose-500/30",
  },
  {
    title: "Admin analytics and controls",
    body: "In the Admin role, the control center shows platform-wide analytics, system health, the user directory, the audit trail and data export tools.",
    icon: BarChart3,
    accent: "from-sky-500/40 to-emerald-500/30",
  },
];

const STORAGE_KEY = "avartan.tour.seen";

export function QuickTourTrigger() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Auto-open first time only
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  };
  const start = () => { setStep(0); setOpen(true); };

  const s = STEPS[step];

  return (
    <>
      <button
        type="button"
        aria-label="Open quick tour"
        onClick={start}
        className={cn(
          "group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground backdrop-blur-md transition-all duration-300",
          "hover:border-primary/50 hover:text-foreground hover:shadow-[0_0_24px_-6px_var(--primary)]",
        )}
      >
        <HelpCircle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
        <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full ring-1 ring-primary/30" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={close} />
          <div
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-6 shadow-[0_30px_80px_-20px_rgba(99,102,241,0.6)] backdrop-blur-xl",
              "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            )}
          >
            <div className={cn("pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl opacity-50 transition-all duration-700", s.accent)} />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 blur-3xl" />

            <button
              onClick={close}
              aria-label="Close tour"
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                <Sparkles className="h-3 w-3" /> Quick tour · {step + 1} of {STEPS.length}
              </div>
              <div className="mb-4 flex items-start gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.7)]", s.accent)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{s.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4 flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-500",
                      i === step ? "bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_10px_-1px_rgba(99,102,241,0.8)]" : "bg-border/60 hover:bg-border",
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep((p) => Math.max(0, p - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:border-primary/50 disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep((p) => Math.min(STEPS.length - 1, p + 1))}
                    className="group inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)] transition-transform hover:scale-[1.03]"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={close}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)] transition-transform hover:scale-[1.03]"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Get started
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}