import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { changeMyPassword } from "@/lib/security.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings/change-password")({
  head: () => ({ meta: [{ title: "Change Password" }] }),
  component: () => (
    <AppShell title="Change Password">
      <Page />
    </AppShell>
  ),
});

function Page() {
  const change = useServerFn(changeMyPassword);
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      await change({ data: { currentPassword: current, newPassword: next } });
      toast.success("Password changed.");
      navigate({ to: "/" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Change your password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Current password</Label><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
            <div><Label>New password</Label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
            <div><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <Button type="submit" disabled={busy || !current || next.length < 6}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}