import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { friendlyError } from "@/lib/messages";
import { useEffect, useState } from "react";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { completeSecuritySetup, getMySecurityStatus } from "@/lib/security.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { SECURITY_QUESTIONS } from "@/lib/security.constants";

export const Route = createFileRoute("/setup-security")({
  head: () => ({ meta: [{ title: "Security Setup — Avartan" }] }),
  component: SetupPage,
});

function SetupPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const complete = useServerFn(completeSecuritySetup);
  const status = useServerFn(getMySecurityStatus);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    status().then((s) => {
      if (!(s as { mustSetupSecurity: boolean }).mustSetupSecurity && role) navigate({ to: ROLE_HOME[role] });
    }).finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) return toast.error("Choose a PIN between 4 and 8 digits", { description: "Use numbers only — you'll need this PIN to recover your account." });
    if (pin !== confirmPin) return toast.error("Those PINs don't match", { description: "Enter the same PIN in both fields." });
    if (answer.trim().length < 2) return toast.error("Please answer your security question", { description: "Your answer helps us confirm it's really you." });
    setBusy(true);
    try {
      await complete({ data: { pin, question, answer } });
      toast.success("Your account is now secured", { description: "You can use your PIN or security answer to recover your account." });
      if (role) navigate({ to: ROLE_HOME[role], replace: true });
    } catch (e) { toast.error("We couldn't save your security details", { description: friendlyError(e) }); }
    finally { setBusy(false); }
  }

  if (checking || loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <Card className="w-full max-w-xl border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300/80">
            <ShieldCheck className="h-3.5 w-3.5" /> First-Login Security Setup
          </div>
          <CardTitle className="font-display text-2xl text-white">Protect your account</CardTitle>
          <p className="text-sm text-slate-300/70">Create a Security PIN and choose a security question. You'll use these if you forget your password.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-200">Security PIN (4–8 digits)</Label>
                <Input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
              </div>
              <div>
                <Label className="text-slate-200">Confirm PIN</Label>
                <Input type="password" inputMode="numeric" maxLength={8} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
            <div>
              <Label className="text-slate-200">Security Question</Label>
              <Select value={question} onValueChange={setQuestion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-200">Answer</Label>
              <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Not case-sensitive" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}