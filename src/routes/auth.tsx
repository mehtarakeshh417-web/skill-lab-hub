import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { mockSignIn, mockSignOut } from "@/lib/mock-auth";
import { recordAuthEvent } from "@/lib/audit.functions";
import { resolveLoginEmail } from "@/lib/security.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import avartanLogo from "@/assets/avartan-logo.jpg.asset.json";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  School2,
  UserCircle2,
} from "lucide-react";
import heroImg from "@/assets/hero-3d.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Avartan Skill Lab" }] }),
  component: AuthPage,
});

function resolveEmail(input: string) {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return trimmed;
  // Phone numbers cannot be guessed into an email — resolved server-side instead.
  if (/^[+()\-.\s\d]+$/.test(trimmed)) return null;
  // Username convenience: "admin" -> "admin@avartan.app"
  return `${trimmed.toLowerCase()}@avartan.app`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [fieldError, setFieldError] = useState<{ identifier?: string; password?: string; form?: string }>({});

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: ROLE_HOME[role], replace: true });
    }
  }, [user, role, loading, navigate]);

  const identifierError = useMemo(() => {
    if (!identifier.trim()) return "Enter your username, email or phone number.";
    return undefined;
  }, [identifier]);
  const passwordError = useMemo(() => {
    if (!password) return "Enter your password.";
    return undefined;
  }, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError({});
    if (identifierError || passwordError) {
      setFieldError({ identifier: identifierError, password: passwordError });
      return;
    }
    setSubmitting(true);
    const guessedEmail = resolveEmail(identifier);
    let error: { message: string } | null = null;
    if (guessedEmail) {
      const res = await supabase.auth.signInWithPassword({ email: guessedEmail, password });
      if (!res.error) {
        mockSignOut();
        setSubmitting(false);
        toast.success("Signed in successfully");
        void recordAuthEvent({ data: { event: "login", identifier } }).catch(() => null);
        return;
      }
      error = res.error;
    }

    // Second pass: resolve username / real email / phone number to the sign-in email.
    const resolved = await resolveLoginEmail({ data: { identifier, password } }).catch(() => null);
    if (resolved?.ok && resolved.email && resolved.email !== guessedEmail) {
      const res = await supabase.auth.signInWithPassword({ email: resolved.email, password });
      if (!res.error) {
        mockSignOut();
        setSubmitting(false);
        toast.success("Signed in successfully");
        void recordAuthEvent({ data: { event: "login", identifier } }).catch(() => null);
        return;
      }
      error = res.error;
    }

    // Demo-only fallback for seeded teacher/student flows that do not yet exist in backend auth.
    const mock = mockSignIn(identifier, password);
    if (mock.ok && mock.session) {
      setSubmitting(false);
      toast.success(`Welcome, ${mock.session.fullName}`, {
        description: `Signed in as ${mock.session.role.replace("_", " ")}`,
      });
      void recordAuthEvent({ data: { event: "login", identifier } }).catch(() => null);
      navigate({ to: ROLE_HOME[mock.session.role], replace: true });
      return;
    }
    setSubmitting(false);
    const description = mock.reason || error?.message || "Invalid credentials.";
    void recordAuthEvent({ data: { event: "login_failed", identifier, reason: description } }).catch(() => null);
    setFieldError({ form: description });
    toast.error("Sign in failed", { description });
  }

  const roles: Array<{ label: string; icon: typeof School2; color: string }> = [
    { label: "Schools", icon: School2, color: "from-emerald-500 to-teal-500" },
    { label: "Teachers", icon: GraduationCap, color: "from-sky-500 to-cyan-500" },
    { label: "Students", icon: UserCircle2, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex">
        <img src={heroImg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute -top-40 -left-20 h-[460px] w-[460px] rounded-full bg-accent/40 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-primary-glow/50 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        <Link to="/" className="relative flex items-center gap-2.5">
          <img src={avartanLogo.url} alt="Avartan" className="h-10 w-10 rounded-lg object-contain bg-white p-0.5" />
          <div className="font-display text-lg font-bold">Avartan Skill Lab</div>
        </Link>
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Welcome back
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.05]">
            Where curiosity <span className="block text-accent">meets code</span>
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Sign in to access role-based dashboards, interactive technology modules, and
            real-time progress tracking.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {roles.map((r) => (
              <div
                key={r.label}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} shadow-lg`}>
                  <r.icon className="h-5 w-5 text-white" />
                </div>
                <div className="mt-3 text-sm font-semibold">{r.label}</div>
                <div className="text-[11px] text-primary-foreground/70">Dedicated portal</div>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-primary-foreground/80 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            End-to-end encrypted sign-in · SOC 2 aligned
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Avartan Skill Lab. All rights reserved.
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            <img src={avartanLogo.url} alt="Avartan" className="h-6 w-6 rounded object-contain" /> Avartan Skill Lab
          </Link>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl sm:p-10">
            <div className="mb-6 flex items-center gap-3">
              <img src={avartanLogo.url} alt="Avartan" className="h-11 w-11 rounded-2xl object-contain bg-white p-1 shadow-lg shadow-emerald-500/30" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Portal sign-in
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Sign in
                </h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign in with the credentials issued for your role: School, Teacher, Student, Manager or Admin.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-semibold">
                  Username, email or phone
                </Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldError.identifier || fieldError.form) setFieldError({});
                  }}
                  placeholder="e.g. delhi-public, school@example.com or 9876543210"
                  autoComplete="username"
                  className={`h-12 text-base ${fieldError.identifier ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  aria-invalid={Boolean(fieldError.identifier)}
                />
                {fieldError.identifier ? (
                  <p className="text-xs font-medium text-rose-500">{fieldError.identifier}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <span className="text-xs text-muted-foreground">Case-sensitive</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldError.password || fieldError.form) setFieldError({});
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`h-12 pr-12 text-base ${fieldError.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                    aria-invalid={Boolean(fieldError.password)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldError.password ? (
                  <p className="text-xs font-medium text-rose-500">{fieldError.password}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-emerald-500"
                  />
                  Keep me signed in
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-emerald-500 hover:text-emerald-600"
                >
                  Forgot password?
                </Link>
              </div>

              {fieldError.form ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                  {fieldError.form}
                </div>
              ) : null}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="h-12 w-full text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>New to Avartan?</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button asChild variant="soft" size="lg" className="mt-4 h-12 w-full">
              <Link to="/register-school">Register your school</Link>
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to Avartan&apos;s acceptable-use policy.
          </p>
        </div>
      </div>
    </div>
  );
}