import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Avartan Skill Lab" }] }),
  component: AuthPage,
});

function resolveEmail(input: string) {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return trimmed;
  // Username convenience: "admin" -> "admin@avartan.app"
  return `${trimmed.toLowerCase()}@avartan.app`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: ROLE_HOME[role], replace: true });
    }
  }, [user, role, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    setSubmitting(true);
    const email = resolveEmail(identifier);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    toast.success("Welcome back!");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="font-display text-lg font-bold">Avartan Skill Lab</div>
        </Link>
        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Where curiosity meets code.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Sign in to access role-based dashboards, interactive technology modules, and
            real-time progress tracking.
          </p>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
            <div className="text-xs uppercase tracking-widest text-primary-foreground/70">Demo credentials</div>
            <div className="mt-3 grid gap-2 font-mono text-sm">
              <div className="flex justify-between"><span>admin</span><span className="text-primary-foreground/70">admin123</span></div>
              <div className="flex justify-between"><span>manager</span><span className="text-primary-foreground/70">manager123</span></div>
            </div>
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Avartan Skill Lab. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <Sparkles className="h-4 w-4 text-primary" /> Avartan Skill Lab
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight">Sign in to your portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your username or email to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or email</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
            New schools, teachers and students are created via the portal by an admin or portal manager.
          </div>
        </div>
      </div>
    </div>
  );
}