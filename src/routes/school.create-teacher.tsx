import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTeacher } from "@/lib/teachers.functions";
import { teacherCreateSchema } from "@/lib/teachers.schema";

export const Route = createFileRoute("/school/create-teacher")({
  head: () => ({ meta: [{ title: "Create Teacher · School" }] }),
  component: CreateTeacherPage,
});

function CreateTeacherPage() {
  return (
    <AppShell requireRole="school" title="Create Teacher">
      <CreateTeacherForm />
    </AppShell>
  );
}

function CreateTeacherForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useServerFn(createTeacher);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    employeeId: "",
    subject: "",
    department: "",
    qualification: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    status: "active" as "active" | "inactive",
  });

  const mutation = useMutation({
    mutationFn: create,
    onSuccess: async (teacher) => {
      await queryClient.invalidateQueries({ queryKey: ["school-teachers"] });
      toast.success(`${teacher.fullName} added`, { description: `Login: ${teacher.username}` });
      navigate({ to: "/school" });
    },
    onError: (err) =>
      toast.error("Could not create teacher", {
        description: err instanceof Error ? err.message : "Please check the fields and try again.",
      }),
  });

  const update = (k: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = teacherCreateSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please complete the required fields", {
        description: parsed.error.issues[0]?.message,
      });
      return;
    }
    mutation.mutate({ data: parsed.data });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/school" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to School dashboard
      </Link>
      <form onSubmit={onSubmit} className="rounded-3xl border border-white/20 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-4 border-b border-border/60 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-lg shadow-emerald-500/30">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Create teacher</h2>
            <p className="text-sm text-muted-foreground">
              Provision a new teacher for your school with login credentials.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.fullName} onChange={update("fullName")} placeholder="Jane Doe" required />
          </Field>
          <Field label="Employee ID">
            <Input value={form.employeeId} onChange={update("employeeId")} placeholder="TCH-001" />
          </Field>
          <Field label="Username *">
            <Input value={form.username} onChange={update("username")} placeholder="jane.doe" required />
          </Field>
          <Field label="Password *">
            <Input type="password" value={form.password} onChange={update("password")} placeholder="Any password" required />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={update("email")} placeholder="jane@school.com" required />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={update("phone")} placeholder="9876543210" />
          </Field>
          <Field label="Subject">
            <Input value={form.subject} onChange={update("subject")} placeholder="Computer Science" />
          </Field>
          <Field label="Department">
            <Input value={form.department} onChange={update("department")} placeholder="STEM" />
          </Field>
          <Field label="Qualification">
            <Input value={form.qualification} onChange={update("qualification")} placeholder="M.Sc. Computer Science" />
          </Field>
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={update("gender")}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={update("status")}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea
              value={form.address}
              onChange={update("address")}
              placeholder="Residential address"
              rows={3}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button type="button" variant="soft" asChild>
            <Link to="/school">Cancel</Link>
          </Button>
          <Button type="submit" variant="hero" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create teacher"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ""}`}>
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}