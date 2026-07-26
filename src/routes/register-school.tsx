import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitSchoolRegistration } from "@/lib/registrations.functions";
import { addRegistration } from "@/lib/registrations";
import { ThemeToggle } from "@/lib/theme";
import avartanLogo from "@/assets/avartan-logo.jpg.asset.json";
import {
  ShieldCheck,
  Layers,
  ArrowLeft,
  Building2,
  UserSquare2,
  MapPin,
  Briefcase,
  ClipboardList,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/register-school")({
  head: () => ({
    meta: [
      { title: "Register Your School — Avartan Skill Lab" },
      { name: "description", content: "Apply to bring Avartan Skill Lab to your institution. Submit your school details and our portal team will provision your accounts." },
      { property: "og:title", content: "Register Your School — Avartan Skill Lab" },
      { property: "og:description", content: "Apply to bring Avartan Skill Lab to your institution. Submit your school details and our portal team will provision your accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterSchoolPage,
});

function RegisterSchoolPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={avartanLogo.url} alt="Avartan" className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 shadow-glow" />
            <div className="font-display text-lg font-bold tracking-tight">
              Avartan<span className="text-primary"> Skill Lab</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="btn-3d inline-flex h-11 items-center gap-2 rounded-full border border-border/60 bg-card/60 px-5 text-sm font-semibold backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_28px_-8px_hsl(var(--primary)/0.7)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </header>
      <RegisterSchool />
    </div>
  );
}

// ============================================================
// Public School Self-Registration Form
// ============================================================
function RegisterSchool() {
  const submitFn = useServerFn(submitSchoolRegistration);

  const empty = {
    schoolName: "",
    schoolCode: "",
    principalName: "",
    region: "",
    designation: "",
    notes: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    address: "",
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const update = (k: keyof typeof empty, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const code = form.schoolCode.trim().toUpperCase();
    if (!form.schoolName.trim() || form.schoolName.trim().length < 3) e.schoolName = "Please enter the full institutional name.";
    if (!code) e.schoolCode = "School code is required.";
    else if (code.length < 3) e.schoolCode = "School code must be at least 3 characters.";
    if (!form.principalName.trim()) e.principalName = "Principal name is required.";
    if (!form.region.trim()) e.region = "Region / area is required.";
    if (!form.designation.trim()) e.designation = "Contact designation is required.";
    if (!form.username.trim()) e.username = "Choose a login username.";
    if (!form.password) e.password = "Choose a password.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid contact email required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (form.notes.length > 600) e.notes = "Notes must be under 600 characters.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitFn({
        data: {
          schoolName: form.schoolName.trim(),
          schoolCode: form.schoolCode.trim().toUpperCase(),
          principalName: form.principalName.trim(),
          region: form.region.trim(),
          designation: form.designation.trim(),
          notes: form.notes.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      });
      // Also mirror into local session list for the sidebar preview.
      addRegistration({
        schoolName: form.schoolName.trim(),
        schoolCode: form.schoolCode.trim().toUpperCase(),
        principalName: form.principalName.trim(),
        region: form.region.trim(),
        designation: form.designation.trim(),
        notes: form.notes.trim(),
      });
      toast.success("Registration submitted", {
        description: `${form.schoolName.trim()} · status: Pending Approval`,
      });
      setForm(empty);
      setErrors({});
    } catch (err) {
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="register-school" className="relative overflow-hidden border-t border-border/60 bg-background py-20">
      <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[420px] w-[520px] rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="chip-3d inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-xl shadow-[0_0_24px_-6px_hsl(var(--primary)/0.55)]">
            <Building2 className="h-3.5 w-3.5" /> Institutional Onboarding
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Apply for your school's Avartan portal.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Complete the onboarding application below. Once approved, our deployment team will provision your dedicated school directory, educator workspaces, and student licenses.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          {/* Form Card */}
          <form
            onSubmit={submit}
            noValidate
            className="slab-3d relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-2xl sm:p-10"
          >
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />

            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight">Institutional Registration</h3>
                  <p className="mt-1 text-xs text-muted-foreground">All fields are mandatory unless marked optional. Your data is encrypted and visible only to authorized portal administrators.</p>
                </div>
                <span className="chip-3d inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <ClipboardList className="h-3.5 w-3.5" /> Approval Required
                </span>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Institutional School Name"
                  icon={Building2}
                  value={form.schoolName}
                  onChange={(v) => update("schoolName", v)}
                  placeholder="Delhi Public Pilot School"
                  error={errors.schoolName}
                  focused={focused.schoolName}
                  onFocus={() => setFocused((f) => ({ ...f, schoolName: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, schoolName: false }))}
                />
                <Field
                  label="Requested Unique School Code"
                  icon={Layers}
                  value={form.schoolCode}
                  onChange={(v) => update("schoolCode", v.toUpperCase())}
                  placeholder="SCH-DEL-208"
                  error={errors.schoolCode}
                  hint="4–16 chars · uppercase letters, digits, hyphen"
                  maxLength={16}
                  focused={focused.schoolCode}
                  onFocus={() => setFocused((f) => ({ ...f, schoolCode: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, schoolCode: false }))}
                />
                <Field
                  label="Principal Name"
                  icon={UserSquare2}
                  value={form.principalName}
                  onChange={(v) => update("principalName", v)}
                  placeholder="Dr. Aarti Sharma"
                  error={errors.principalName}
                  focused={focused.principalName}
                  onFocus={() => setFocused((f) => ({ ...f, principalName: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, principalName: false }))}
                />
                <Field
                  label="Region / Area"
                  icon={MapPin}
                  value={form.region}
                  onChange={(v) => update("region", v)}
                  placeholder="Maharashtra / Pune"
                  error={errors.region}
                  focused={focused.region}
                  onFocus={() => setFocused((f) => ({ ...f, region: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, region: false }))}
                />
                <Field
                  label="Contact Designation"
                  icon={Briefcase}
                  value={form.designation}
                  onChange={(v) => update("designation", v)}
                  placeholder="Vice Principal / Director"
                  error={errors.designation}
                  focused={focused.designation}
                  onFocus={() => setFocused((f) => ({ ...f, designation: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, designation: false }))}
                />
                <Field
                  label="Login Username"
                  icon={UserSquare2}
                  value={form.username}
                  onChange={(v) => update("username", v)}
                  placeholder="dps-delhi"
                  error={errors.username}
                  hint="You will use this to sign in after approval."
                  focused={focused.username}
                  onFocus={() => setFocused((f) => ({ ...f, username: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, username: false }))}
                />
                <Field
                  label="Login Password"
                  icon={ShieldCheck}
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  placeholder="Create a secure password"
                  error={errors.password}
                  type="password"
                  focused={focused.password}
                  onFocus={() => setFocused((f) => ({ ...f, password: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, password: false }))}
                />
                <Field
                  label="Contact Email"
                  icon={Send}
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="principal@school.edu"
                  error={errors.email}
                  focused={focused.email}
                  onFocus={() => setFocused((f) => ({ ...f, email: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, email: false }))}
                />
                <Field
                  label="Phone Number"
                  icon={Briefcase}
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder="+91 98xxxxxxxx"
                  error={errors.phone}
                  focused={focused.phone}
                  onFocus={() => setFocused((f) => ({ ...f, phone: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, phone: false }))}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Address"
                    icon={MapPin}
                    value={form.address}
                    onChange={(v) => update("address", v)}
                    placeholder="Street, city, state, PIN"
                    focused={focused.address}
                    onFocus={() => setFocused((f) => ({ ...f, address: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, address: false }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submission Notes
                      <span className="text-[10px] font-normal normal-case text-muted-foreground/70">optional</span>
                    </span>
                    <div
                      className={
                        "group relative overflow-hidden rounded-2xl border bg-background/40 shadow-inner transition-all duration-300 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] " +
                        (errors.notes
                          ? "border-rose-400/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
                          : "border-border/60 focus-within:border-primary/60")
                      }
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
                      <textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        rows={4}
                        maxLength={600}
                        placeholder="Tell us about your school size, requested tracks, timelines, or any special requirements…"
                        className="relative w-full resize-none bg-transparent px-5 py-4 text-base outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </label>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    {errors.notes ? (
                      <span className="inline-flex items-center gap-1 text-rose-400"><AlertCircle className="h-3.5 w-3.5" /> {errors.notes}</span>
                    ) : (
                      <span>Plain text only · no HTML.</span>
                    )}
                    <span className="tabular-nums">{form.notes.length}/600</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs text-muted-foreground leading-relaxed">
                  By submitting, you authorize Avartan to contact your institution regarding onboarding. Your application enters the
                  review queue as <span className="font-semibold text-amber-400">Pending Approval</span> and will typically be processed within one business day.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl px-8 text-base font-bold text-primary-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-primary-glow to-primary opacity-95 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute inset-0 rounded-2xl shadow-[0_18px_50px_-10px_hsl(var(--primary)/0.85)] transition-shadow duration-300 group-hover:shadow-[0_24px_60px_-10px_hsl(var(--primary))]" />
                  <span className="absolute inset-0 -translate-x-full overflow-hidden rounded-2xl">
                    <span className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]" />
                  </span>
                  <span className="relative inline-flex items-center gap-2">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    {submitting ? "Submitting Application…" : "Submit Registration"}
                  </span>
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
}

function Field({
  label, icon: Icon, value, onChange, placeholder, error, hint, maxLength, type,
  focused, onFocus, onBlur,
}: {
  label: string;
  icon: typeof Building2;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  type?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const isActive = focused || value.length > 0;
  return (
    <label className="group block">
      <span className={
        "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 " +
        (isActive ? "text-primary" : "text-muted-foreground")
      }>
        <Icon className={"h-3.5 w-3.5 transition-colors duration-300 " + (isActive ? "text-primary" : "text-muted-foreground/70")} />
        {label}
      </span>
      <div
        className={
          "relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-background/40 shadow-inner transition-all duration-300 " +
          (error
            ? "border-rose-400/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
            : "border-border/60 focus-within:border-primary/60 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] focus-within:bg-background/60")
        }
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
        <Icon className={"relative ml-4 h-5 w-5 shrink-0 transition-colors duration-300 " + (error ? "text-rose-400" : isActive ? "text-primary" : "text-muted-foreground/60")} />
        <input
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          className="relative h-14 w-full bg-transparent px-1 py-4 text-base outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      <div className="mt-2 min-h-[16px] text-[11px]">
        {error ? (
          <span className="inline-flex items-center gap-1 text-rose-400"><AlertCircle className="h-3.5 w-3.5" /> {error}</span>
        ) : hint ? (
          <span className="text-muted-foreground/80">{hint}</span>
        ) : null}
      </div>
    </label>
  );
}
