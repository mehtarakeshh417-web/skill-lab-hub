import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSalesRep, listActiveSalesReps } from "@/lib/sales-reps.functions";
import { salesRepCreateSchema } from "@/lib/sales-reps.schema";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, UserPlus2 } from "lucide-react";

export function SalesRepForm({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const create = useServerFn(createSalesRep);
  const fetchReps = useServerFn(listActiveSalesReps);

  const { data: reps } = useQuery({
    queryKey: ["sales-reps", "brief"],
    queryFn: () => fetchReps(),
    enabled: Boolean(session),
    retry: false,
  });

  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    designation: "Sales Executive",
    department: "Sales",
    reportingManagerId: "",
    status: "active" as "active" | "inactive",
  });

  const mutation = useMutation({
    mutationFn: create,
    onSuccess: async (rep) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-reps"] }),
        queryClient.invalidateQueries({ queryKey: ["schools", "dashboard"] }),
      ]);
      toast.success(`${rep.fullName} added`, { description: `Login: ${rep.username}` });
      navigate({ to: backTo });
    },
    onError: (err) =>
      toast.error("Could not create sales rep", {
        description: err instanceof Error ? err.message : "Please check the fields and try again.",
      }),
  });

  const update = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const managerOptions = useMemo(
    () => (reps ?? []).filter((r) => r.status === "active"),
    [reps],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = salesRepCreateSchema.safeParse({
      ...form,
      reportingManagerId: form.reportingManagerId ? form.reportingManagerId : null,
    });
    if (!parsed.success) {
      toast.error("Please complete the required fields", { description: parsed.error.issues[0]?.message });
      return;
    }
    mutation.mutate({ data: parsed.data });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={backTo} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      <form onSubmit={onSubmit} className="rounded-3xl border border-white/20 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-4 border-b border-border/60 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <UserPlus2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Create sales representative</h2>
            <p className="text-sm text-muted-foreground">
              Adds a new sales team member with login credentials and a reporting line.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Field label="Full name *">
            <Input value={form.fullName} onChange={update("fullName")} placeholder="Jane Doe" required />
          </Field>
          <Field label="Employee ID">
            <Input value={form.employeeId} onChange={update("employeeId")} placeholder="EMP-1042" />
          </Field>
          <Field label="Username *">
            <Input value={form.username} onChange={update("username")} placeholder="jane.doe" required />
          </Field>
          <Field label="Password *">
            <Input type="password" value={form.password} onChange={update("password")} placeholder="Min 8 characters" required />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={update("email")} placeholder="jane@company.com" required />
          </Field>
          <Field label="Phone *">
            <Input value={form.phone} onChange={update("phone")} placeholder="9876543210" required />
          </Field>
          <Field label="Designation *">
            <Input value={form.designation} onChange={update("designation")} placeholder="Sales Executive" required />
          </Field>
          <Field label="Department">
            <Input value={form.department} onChange={update("department")} placeholder="Sales" />
          </Field>
          <Field label="Reporting manager">
            <select
              value={form.reportingManagerId}
              onChange={update("reportingManagerId")}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Admin (default)</option>
              {managerOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} — {r.designation || "Sales"}
                </option>
              ))}
            </select>
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
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button type="button" variant="soft" asChild>
            <Link to={backTo}>Cancel</Link>
          </Button>
          <Button type="submit" variant="hero" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create sales rep"}
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