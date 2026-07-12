import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startForgotPassword, resetPasswordWithSecret } from "@/lib/security.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, MessageCircleQuestion, Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Avartan" }] }),
  component: ForgotPage,
});

type Step = "identifier" | "choose" | "reset";

function ForgotPage() {
  const navigate = useNavigate();
  const start = useServerFn(startForgotPassword);
  const reset = useServerFn(resetPasswordWithSecret);

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<"pin" | "question">("pin");
  const [question, setQuestion] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await start({ data: { identifier } }) as { question: string | null; hasPin: boolean; isActive: boolean };
      if (!r.isActive) throw new Error("This account is deactivated. Please contact an administrator.");
      if (!r.hasPin && !r.question) throw new Error("This account hasn't completed security setup yet. Ask an admin to reset it.");
      setQuestion(r.question);
      setStep("choose");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lookup failed"); }
    finally { setBusy(false); }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    try {
      await reset({ data: { identifier, method, secret, newPassword } });
      toast.success("Password updated. Please sign in.");
      navigate({ to: "/auth" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Reset failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <Card className="w-full max-w-lg border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300/80">
            <KeyRound className="h-3.5 w-3.5" /> Account Recovery
          </div>
          <CardTitle className="font-display text-2xl text-white">Forgot Password</CardTitle>
          <p className="text-sm text-slate-300/70">Recover access using your Security PIN or Security Question.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === "identifier" && (
            <form onSubmit={onLookup} className="space-y-4">
              <div>
                <Label className="text-slate-200">Username or email</Label>
                <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g. admin or you@school.com" autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !identifier.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              </Button>
            </form>
          )}

          {step === "choose" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-300/80">Choose a recovery method:</div>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => { setMethod("pin"); setStep("reset"); }}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
                >
                  <KeyRound className="h-5 w-5 text-indigo-300" />
                  <div>
                    <div className="text-white font-medium">Use Security PIN</div>
                    <div className="text-xs text-slate-400">4–8 digit PIN you set during first login.</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("question"); setStep("reset"); }}
                  disabled={!question}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition disabled:opacity-50"
                >
                  <MessageCircleQuestion className="h-5 w-5 text-emerald-300" />
                  <div>
                    <div className="text-white font-medium">Use Security Question</div>
                    <div className="text-xs text-slate-400">{question ?? "Not set for this account."}</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={onReset} className="space-y-4">
              <div>
                <Label className="text-slate-200">
                  {method === "pin" ? "Enter your Security PIN" : question ?? "Answer"}
                </Label>
                <Input
                  type={method === "pin" ? "password" : "text"}
                  inputMode={method === "pin" ? "numeric" : "text"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={method === "pin" ? "••••" : "Your answer"}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-200">New password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <Label className="text-slate-200">Confirm</Label>
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}

          <div className="flex items-center justify-between pt-2 text-sm">
            <Link to="/auth" className="inline-flex items-center gap-1 text-slate-300/80 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
            {step !== "identifier" && (
              <button type="button" className="text-slate-400 hover:text-white" onClick={() => { setStep("identifier"); setSecret(""); setNewPassword(""); setConfirm(""); }}>
                Start over
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}