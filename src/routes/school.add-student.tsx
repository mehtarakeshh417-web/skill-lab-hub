import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Upload, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStudent } from "@/lib/students.functions";
import { listMyClassSections } from "@/lib/classes.functions";
import { studentCreateSchema, type StudentCreateInput } from "@/lib/students.schema";

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-input bg-background/70 px-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/40";

export const Route = createFileRoute("/school/add-student")({
  head: () => ({
    meta: [
      { title: "Add Student · Avartan School Console" },
      { name: "description", content: "Create a single student account with full profile, class, guardian and login details." },
      { property: "og:title", content: "Add Student · Avartan School Console" },
      { property: "og:description", content: "Create a single student account with full profile, class, guardian and login details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddStudentPage,
});

type FormState = {
  fullName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  rollNumber: string;
  className: string;
  section: string;
  gender: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  status: "active" | "inactive";
};

const EMPTY: FormState = {
  fullName: "",
  username: "",
  password: "",
  email: "",
  phone: "",
  rollNumber: "",
  className: "",
  section: "",
  gender: "",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  status: "active",
};

function AddStudentPage() {
  return (
    <AppShell requireRole="school" title="Add Student">
      <AddStudentWorkspace />
    </AppShell>
  );
}

function AddStudentWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createStudent);
  const fetchSections = useServerFn(listMyClassSections);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { data: sectionData, isLoading: sectionsLoading } = useQuery({
    queryKey: ["school-class-sections"],
    queryFn: () => fetchSections(),
    retry: false,
  });
  const sections = useMemo(() => sectionData?.sections ?? [], [sectionData]);

  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    sections.forEach((s) => {
      if (seen.has(s.className)) return;
      seen.add(s.className);
      list.push(s.className);
    });
    return list;
  }, [sections]);

  const sectionOptions = useMemo(
    () => sections.filter((s) => s.className === form.className),
    [sections, form.className],
  );

  // Keep the section choice consistent with the selected class.
  useEffect(() => {
    if (!form.className) return;
    if (form.section && !sectionOptions.some((s) => s.sectionName === form.section)) {
      setForm((prev) => ({ ...prev, section: "" }));
    }
  }, [form.className, form.section, sectionOptions]);

  const selectedSection = sections.find(
    (s) => s.className === form.className && s.sectionName === form.section,
  );

  const mutation = useMutation({
    mutationFn: (data: StudentCreateInput) => create({ data }),
    onSuccess: async (rec) => {
      await queryClient.invalidateQueries({ queryKey: ["school-students"] });
      toast.success(`${rec.fullName} has been added`, {
        description: `Login username: ${rec.username}`,
      });
      setForm(EMPTY);
      setErrors({});
    },
    onError: (err) => {
      toast.error("Could not create student", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = studentCreateSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      });
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/school"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/school/bulk-students"><Upload className="h-4 w-4" /> Bulk upload instead</Link>
        </Button>
      </div>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-8"
      >
        <header className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/25">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Create a student account</h2>
            <p className="text-sm text-muted-foreground">
              Same fields as the bulk upload template. Fields marked * are required.
            </p>
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name *" error={errors.fullName}>
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Username *" error={errors.username}>
            <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="jane.doe" autoComplete="off" />
          </Field>
          <Field label="Password *" error={errors.password}>
            <Input value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="welcome123" autoComplete="new-password" />
          </Field>
          <Field label="Email *" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@school.com" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9876543210" />
          </Field>
          <Field label="Roll Number" error={errors.rollNumber}>
            <Input value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} placeholder="R-101" />
          </Field>
          <Field label="Class" error={errors.className}>
            <select
              value={form.className}
              onChange={(e) => set("className", e.target.value)}
              className={SELECT_CLASS}
              disabled={sectionsLoading || classOptions.length === 0}
            >
              <option value="">
                {sectionsLoading ? "Loading classes…" : "Select a class"}
              </option>
              {classOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section" error={errors.section}>
            <select
              value={form.section}
              onChange={(e) => set("section", e.target.value)}
              className={SELECT_CLASS}
              disabled={!form.className || sectionOptions.length === 0}
            >
              <option value="">
                {form.className ? "Select a section" : "Pick a class first"}
              </option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={s.sectionName}>
                  {s.sectionName}
                  {s.teacherName ? ` — ${s.teacherName}` : " — no teacher yet"}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            {classOptions.length === 0 && !sectionsLoading ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground/80">
                No classes or sections have been registered yet.{" "}
                <Link to="/school" className="font-semibold text-amber-600 underline underline-offset-4">
                  Set them up in Classes &amp; Sections
                </Link>{" "}
                so new students are allocated to a teacher automatically.
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground/80">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  {selectedSection?.teacherName
                    ? `${selectedSection.teacherName} leads this section and will see this student automatically.`
                    : "The teacher mapped to this section will see this student automatically."}
                </span>
              </div>
            )}
          </div>
          <Field label="Gender" error={errors.gender}>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background/70 px-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth" error={errors.dateOfBirth}>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Guardian Name" error={errors.guardianName}>
            <Input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Guardian Phone" error={errors.guardianPhone}>
            <Input value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} placeholder="9876543211" />
          </Field>
          <Field label="Status" error={errors.status}>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as "active" | "inactive")}
              className="h-11 w-full rounded-xl border border-input bg-background/70 px-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" error={errors.address}>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main Street" />
            </Field>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="submit" variant="hero" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {mutation.isPending ? "Creating student…" : "Create student"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => { setForm(EMPTY); setErrors({}); }}
            disabled={mutation.isPending}
          >
            Clear form
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => navigate({ to: "/school" })}
            disabled={mutation.isPending}
          >
            Done
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}