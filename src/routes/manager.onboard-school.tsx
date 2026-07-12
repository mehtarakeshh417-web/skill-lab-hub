import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { registerMockAccount } from "@/lib/mock-auth";
import { addRegistration } from "@/lib/registrations";
import { toast } from "sonner";
import { ArrowLeft, School2, KeyRound, UserPlus2 } from "lucide-react";

export const Route = createFileRoute("/manager/onboard-school")({
  head: () => ({ meta: [{ title: "Onboard School · Avartan Skill Lab" }] }),
  component: OnboardSchool,
});

function OnboardSchool() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    schoolName: "",
    schoolCode: "",
    principalName: "",
    region: "",
    designation: "Principal",
    notes: "",
    username: "",
    password: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolName || !form.schoolCode || !form.username || !form.password) {
      toast.error("School name, code, username and password are required");
      return;
    }
    setSaving(true);
    const email = form.email || `${form.username.toLowerCase()}@avartan.app`;
    const res = registerMockAccount({
      username: form.username.trim(),
      password: form.password,
      role: "school",
      fullName: form.schoolName,
      email,
      schoolCode: form.schoolCode.trim().toUpperCase(),
      schoolName: form.schoolName,
    });
    if (!res.ok) {
      setSaving(false);
      toast.error(res.reason || "Could not create school account");
      return;
    }
    addRegistration({
      schoolName: form.schoolName,
      schoolCode: form.schoolCode.trim().toUpperCase(),
      principalName: form.principalName || form.schoolName,
      region: form.region,
      designation: form.designation,
      notes: form.notes,
      generatedPassword: form.password,
    });
    toast.success(`School "${form.schoolName}" onboarded. Login: ${form.username}`);
    setSaving(false);
    navigate({ to: "/manager" });
  };

  return (
    <AppShell requireRole="portal_manager" title="Onboard School">
      <div className="mx-auto max-w-4xl">
        <Link to="/manager" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Operations
        </Link>

        <form
          onSubmit={onSubmit}
          className="slab-3d rounded-3xl border border-white/20 bg-card/75 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-4 border-b border-border/60 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <School2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Create a new school</h2>
              <p className="text-sm text-muted-foreground">
                Register the institution and issue login credentials. The school user can sign in with the username & password below.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Field label="School name *">
              <Input value={form.schoolName} onChange={update("schoolName")} placeholder="Avartan Skill Academy" />
            </Field>
            <Field label="School code *">
              <Input value={form.schoolCode} onChange={update("schoolCode")} placeholder="SCH-BLR-001" />
            </Field>
            <Field label="Principal / Head">
              <Input value={form.principalName} onChange={update("principalName")} placeholder="Dr. A. Sharma" />
            </Field>
            <Field label="Region">
              <Input value={form.region} onChange={update("region")} placeholder="Karnataka / Bengaluru" />
            </Field>
            <Field label="Designation">
              <Input value={form.designation} onChange={update("designation")} placeholder="Principal" />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.email} onChange={update("email")} placeholder="school@example.com" />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <Textarea rows={3} value={form.notes} onChange={update("notes")} placeholder="Grades, tracks, licenses…" />
            </Field>
          </div>

          <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-500">
              <KeyRound className="h-4 w-4" /> School login credentials
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Username *">
                <Input value={form.username} onChange={update("username")} placeholder="jaipur-maker" autoComplete="off" />
              </Field>
              <Field label="Password *">
                <Input value={form.password} onChange={update("password")} placeholder="Set a strong password" autoComplete="new-password" />
              </Field>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The school will use these credentials on the sign-in page to access their School dashboard.
            </p>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/manager" })}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" size="xl" disabled={saving}>
              <UserPlus2 className="h-5 w-5" /> {saving ? "Creating…" : "Create school & issue login"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}