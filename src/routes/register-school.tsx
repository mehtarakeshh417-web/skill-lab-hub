import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { parseFieldError } from "@/lib/registrations";
import { INDIA_STATES, citiesForState } from "@/lib/india-locations";
import avartanLogo from "@/assets/avartan-logo.jpg.asset.json";
import {
  ShieldCheck,
  ArrowLeft,
  Building2,
  UserSquare2,
  MapPin,
  Briefcase,
  ClipboardList,
  Loader2,
  AlertCircle,
  Send,
  ChevronDown,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/register-school")({
  head: () => ({
    meta: [
      { title: "Register your school — Avartan Skill Lab" },
      { name: "description", content: "Apply to bring Avartan Skill Lab to your institution. Submit your school details and our portal team will provision your accounts." },
      { property: "og:title", content: "Register your school — Avartan Skill Lab" },
      { property: "og:description", content: "Apply to bring Avartan Skill Lab to your institution. Submit your school details and our portal team will provision your accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterSchoolPage,
});

function RegisterSchoolPage() {
  return (
    <div className="light min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={avartanLogo.url} alt="Avartan" className="h-10 w-10 rounded-lg object-contain bg-white p-0.5 shadow-glow" />
            <div className="font-display text-lg font-bold tracking-tight">
              Avartan<span className="text-primary"> Skill Lab</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
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
  const empty = {
    schoolName: "",
    principalName: "",
    designation: "",
    state: "",
    city: "",
    area: "",
    salesRepName: "",
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
  const [submitted, setSubmitted] = useState<{ schoolName: string; requestRef: string } | null>(null);
  const [formError, setFormError] = useState<string>("");

  const update = (k: keyof typeof empty, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const updateState = (v: string) => {
    setForm((f) => ({ ...f, state: v, city: "" }));
    setErrors((e) => ({ ...e, state: "", city: "" }));
  };

  const LABELS: Record<keyof typeof empty, string> = {
    schoolName: "School Name",
    principalName: "Principal Name",
    designation: "Contact Designation",
    state: "State",
    city: "City",
    area: "Area",
    salesRepName: "Sales Representative",
    notes: "Submission Notes",
    username: "Login Username",
    password: "Login Password",
    email: "Contact Email",
    phone: "Phone Number",
    address: "Address",
  };

  const validateValue = (k: keyof typeof empty, raw: string): string => {
    const v = String(raw ?? "").trim();
    if (!v) return `${LABELS[k]} is missing — this field is required.`;
    if (k === "email" && !/^\S+@\S+\.\S+$/.test(v)) return "Enter a valid email address.";
    return "";
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    (Object.keys(empty) as (keyof typeof empty)[]).forEach((k) => {
      const msg = validateValue(k, form[k]);
      if (msg) e[k] = msg;
    });
    return e;
  };

  const focusField = (key: string) => {
    if (typeof document === "undefined") return;
    const el = document.querySelector<HTMLElement>(
      `[data-field="${key}"] input, [data-field="${key}"] select, [data-field="${key}"] textarea`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };

  const revealBanner = () => {
    if (typeof document === "undefined") return;
    const el = document.querySelector<HTMLElement>("[data-form-error]");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Re-validate a single field when the user leaves it (focusout bubbles to the form).
  const handleBlur = (ev: React.FocusEvent<HTMLFormElement>) => {
    const name = (ev.target as HTMLElement & { name?: string }).name as keyof typeof empty | undefined;
    if (!name || !(name in empty)) return;
    const msg = validateValue(name, form[name]);
    setErrors((e) => ({ ...e, [name]: msg }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const missing = Object.keys(e).map((k) => LABELS[k as keyof typeof empty]);
      setFormError(
        missing.length === 1
          ? `${missing[0]} is missing — please complete it before submitting.`
          : `${missing.length} required fields are missing: ${missing.join(", ")}`,
      );
      toast.error(
        missing.length === 1 ? `${missing[0]} is missing` : `${missing.length} required fields are missing`,
        { description: missing.join(", ") },
      );
      focusField(Object.keys(e)[0]);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/public/school-registrations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName.trim(),
          principalName: form.principalName.trim(),
          state: form.state.trim(),
          city: form.city.trim(),
          area: form.area.trim(),
          region: [form.city.trim(), form.state.trim()].filter(Boolean).join(" / "),
          designation: form.designation.trim(),
          notes: form.notes.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          salesRepName: form.salesRepName.trim(),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; field?: string; requestRef?: string }
        | null;
      if (!response.ok || !result?.ok) {
        const message = result?.error ?? "Registration could not be submitted. Please try again.";
        throw new Error(result?.field ? `[${result.field}] ${message}` : message);
      }
      const requestRef = result?.requestRef ?? "";
      toast.success("Registration submitted", {
        description: `${form.schoolName.trim()} · Request ID ${requestRef}`,
      });
      setSubmitted({ schoolName: form.schoolName.trim(), requestRef });
      setForm(empty);
      setErrors({});
      setFormError("");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const { field, message } = parseFieldError(raw);
      if (field && field in empty) {
        setErrors((e) => ({ ...e, [field]: message }));
        setFormError(`${LABELS[field as keyof typeof empty]}: ${message}`);
        focusField(field);
        toast.error(`${LABELS[field as keyof typeof empty]} needs attention`, { description: message });
      } else {
        setFormError(message);
        revealBanner();
        toast.error("Registration failed", { description: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="relative overflow-hidden border-t border-border/60 bg-background py-24">
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-6">
          <div className="slab-3d rounded-3xl border border-emerald-500/30 bg-card/70 p-10 text-center shadow-[0_30px_80px_-30px_rgba(16,185,129,0.5)] backdrop-blur-2xl">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Submitted for approval
            </h3>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Thank you — <span className="font-semibold text-foreground">{submitted.schoolName}</span> has been
              submitted and is now <span className="font-semibold text-amber-500">Pending Approval</span>. Our portal
              team will review your application, assign your school code, and once approved you can sign in with the
              credentials you created.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-border bg-card px-8 text-sm font-semibold transition-all hover:border-primary/50"
              >
                Back to home
              </Link>
              <button
                type="button"
                onClick={() => setSubmitted(null)}
                style={{ backgroundImage: "linear-gradient(100deg, var(--primary), var(--accent))" }}
                className="inline-flex h-14 items-center justify-center rounded-2xl px-8 text-sm font-bold text-primary-foreground shadow-[0_16px_40px_-12px_var(--primary)] ring-1 ring-inset ring-white/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Register another school
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
            Apply for your school's Avartan portal
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Complete the onboarding application below. Once approved, our deployment team will provision your dedicated school directory, educator workspaces, and student licenses.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          {/* Form Card */}
          <form
            onSubmit={submit}
            onBlur={handleBlur}
            noValidate
            className="slab-3d relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.5)] backdrop-blur-2xl sm:p-10"
          >
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />

            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight">Institutional registration</h3>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">All fields are mandatory unless marked optional. Your data is encrypted and visible only to authorized portal administrators.</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  <ClipboardList className="h-3.5 w-3.5" /> Approval Required
                </span>
              </div>

              <SectionHeading step="01" title="Institution details" caption="Identify the school applying for the portal." />
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field
                  name="schoolName"
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
                  name="principalName"
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
                  name="designation"
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
                <SelectField
                  name="state"
                  label="State"
                  icon={MapPin}
                  value={form.state}
                  onChange={updateState}
                  placeholder="Select a state"
                  options={INDIA_STATES}
                  error={errors.state}
                />
                <SelectField
                  name="city"
                  label="City"
                  icon={MapPin}
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  placeholder={form.state ? "Select a city" : "Select a state first"}
                  options={citiesForState(form.state)}
                  disabled={!form.state}
                  error={errors.city}
                  hint={form.state ? undefined : "Choose a state to load its cities."}
                />
                <Field
                  name="area"
                  label="Area"
                  icon={MapPin}
                  value={form.area}
                  onChange={(v) => update("area", v)}
                  placeholder="Kothrud"
                  error={errors.area}
                  focused={focused.area}
                  onFocus={() => setFocused((f) => ({ ...f, area: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, area: false }))}
                />
                <Field
                  name="salesRepName"
                  label="Sales Representative"
                  icon={UserCheck}
                  value={form.salesRepName}
                  onChange={(v) => update("salesRepName", v)}
                  placeholder="Full name of your Avartan representative"
                  error={errors.salesRepName}
                  focused={focused.salesRepName}
                  onFocus={() => setFocused((f) => ({ ...f, salesRepName: true }))}
                  onBlur={() => setFocused((f) => ({ ...f, salesRepName: false }))}
                  hint="Enter the exact name provided by your Avartan representative."
                />
              </div>

              <SectionHeading step="02" title="Portal credentials" caption="Used to sign in once your application is approved." />
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field
                  name="username"
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
                  name="password"
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
              </div>

              <SectionHeading step="03" title="Contact & location" caption="How our onboarding team reaches your institution." />
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field
                  name="email"
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
                  name="phone"
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
                    name="address"
                  label="Address"
                    icon={MapPin}
                    value={form.address}
                    onChange={(v) => update("address", v)}
                    placeholder="Street, city, state, PIN"
                    error={errors.address}
                    focused={focused.address}
                    onFocus={() => setFocused((f) => ({ ...f, address: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, address: false }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block" data-field="notes">
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Submission Notes
                    </span>
                    <div
                      className={
                        "group relative overflow-hidden rounded-2xl border bg-muted/50 transition-all duration-300 dark:bg-background/40 " +
                        (errors.notes
                          ? "border-rose-400/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
                          : "border-border focus-within:border-primary/70 focus-within:bg-background focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]")
                      }
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
                      <textarea
                        name="notes"
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        rows={4}
                        placeholder="Tell us about your school size, requested tracks, timelines, or any special requirements"
                        className="relative w-full resize-none bg-transparent px-5 py-4 text-base outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </label>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    {errors.notes ? (
                      <span className="inline-flex items-center gap-1 text-rose-400"><AlertCircle className="h-3.5 w-3.5" /> {errors.notes}</span>
                    ) : (
                      <span>Plain text only, no HTML.</span>
                    )}
                    <span className="tabular-nums">{form.notes.length} characters</span>
                  </div>
                </div>
              </div>

              {formError ? (
                <div
                  data-form-error
                  role="alert"
                  aria-live="assertive"
                  className="mt-8 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-600 shadow-[0_10px_30px_-14px_rgba(244,63,94,0.6)] dark:text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-5 border-t border-border/60 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
                  By submitting, you authorize Avartan to contact your institution regarding onboarding. Your application enters the
                  review queue as <span className="font-semibold text-amber-500 dark:text-amber-400">Pending Approval</span> and is typically processed within one business day.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundImage: "linear-gradient(100deg, var(--primary), var(--accent))" }}
                  className="inline-flex h-16 w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl px-10 text-base font-bold tracking-tight text-primary-foreground shadow-[0_16px_40px_-12px_var(--primary)] ring-1 ring-inset ring-white/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-14px_var(--primary)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {submitting ? "Submitting application…" : "Submit registration"}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
}

function SectionHeading({ step, title, caption }: { step: string; title: string; caption: string }) {
  return (
    <div className="mt-10 flex items-center gap-4 first:mt-8">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 font-display text-sm font-bold text-primary">
        {step}
      </span>
      <div className="min-w-0">
        <h4 className="font-display text-sm font-bold uppercase tracking-[0.14em]">{title}</h4>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
      <span className="ml-2 hidden h-px flex-1 bg-gradient-to-r from-border to-transparent sm:block" />
    </div>
  );
}

function Field({
  name, label, icon: Icon, value, onChange, placeholder, error, hint, maxLength, type,
  focused, onFocus, onBlur,
}: {
  name: string;
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
  return (
    <BaseField
      name={name}
      label={label}
      icon={Icon}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      hint={hint}
      maxLength={maxLength}
      type={type}
      focused={focused}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function SelectField({
  name, label, icon: Icon, value, onChange, placeholder, options, error, hint, disabled,
}: {
  name: string;
  label: string;
  icon: typeof Building2;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: (string | { value: string; label: string })[];
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const isActive = value.length > 0;
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className="group block" data-field={name}>
      <span className={
        "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 " +
        (isActive ? "text-primary" : "text-muted-foreground")
      }>
        <Icon className={"h-3.5 w-3.5 transition-colors duration-300 " + (isActive ? "text-primary" : "text-muted-foreground/70")} />
        {label}
      </span>
      <div
        className={
          "relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-muted/50 transition-all duration-300 dark:bg-background/40 " +
          (disabled ? "opacity-60 " : "") +
          (error
            ? "border-rose-400/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
            : "border-border focus-within:border-primary/70 focus-within:bg-background focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]")
        }
      >
        <Icon className={"relative ml-4 h-5 w-5 shrink-0 transition-colors duration-300 " + (error ? "text-rose-400" : isActive ? "text-primary" : "text-muted-foreground/60")} />
        <select
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={
            "relative h-14 w-full appearance-none bg-transparent px-1 pr-10 py-4 text-base outline-none " +
            (isActive ? "text-foreground" : "text-muted-foreground/60")
          }
        >
          <option value="">{placeholder ?? "Select"}</option>
          {items.map((o) => (
            <option key={o.value} value={o.value} className="text-foreground">{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 h-5 w-5 text-muted-foreground/60" />
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

function BaseField({
  name, label, icon: Icon, value, onChange, placeholder, error, hint, maxLength, type, listId,
  focused, onFocus, onBlur,
}: {
  name: string;
  label: string;
  icon: typeof Building2;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  type?: string;
  listId?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const isActive = focused || value.length > 0;
  return (
    <label className="group block" data-field={name}>
      <span className={
        "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 " +
        (isActive ? "text-primary" : "text-muted-foreground")
      }>
        <Icon className={"h-3.5 w-3.5 transition-colors duration-300 " + (isActive ? "text-primary" : "text-muted-foreground/70")} />
        {label}
      </span>
      <div
        className={
          "relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-muted/50 transition-all duration-300 dark:bg-background/40 " +
          (error
            ? "border-rose-400/60 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
            : "border-border focus-within:border-primary/70 focus-within:bg-background focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]")
        }
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
        <Icon className={"relative ml-4 h-5 w-5 shrink-0 transition-colors duration-300 " + (error ? "text-rose-400" : isActive ? "text-primary" : "text-muted-foreground/60")} />
        <input
          name={name}
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          list={listId}
          autoComplete={listId ? "off" : undefined}
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
