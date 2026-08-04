import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { parseFieldError } from "@/lib/registrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  approveSchoolRegistration,
  listSchoolRegistrations,
  rejectSchoolRegistration,
} from "@/lib/registrations.functions";
import { listActiveSalesReps } from "@/lib/sales-reps.functions";
import type { ApproveRegistrationInput } from "@/lib/registrations.schema";
import { useAuth } from "@/lib/auth";
import { Check, X, Pencil, Clock, School2, MailWarning } from "lucide-react";

type Tab = "pending" | "approved" | "rejected" | "all";

export function PendingSchoolsPanel({ audience }: { audience: "admin" | "manager" }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const fetchList = useServerFn(listSchoolRegistrations);
  const fetchReps = useServerFn(listActiveSalesReps);
  const approveFn = useServerFn(approveSchoolRegistration);
  const rejectFn = useServerFn(rejectSchoolRegistration);

  const [tab, setTab] = useState<Tab>("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salesRepId, setSalesRepId] = useState<Record<string, string>>({});
  const [schoolCode, setSchoolCode] = useState<Record<string, string>>({});
  const [loginUsername, setLoginUsername] = useState<Record<string, string>>({});
  const [loginPassword, setLoginPassword] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["school-registrations"],
    queryFn: () => fetchList(),
    enabled: Boolean(session),
  });
  const { data: reps } = useQuery({
    queryKey: ["sales-reps", "brief"],
    queryFn: () => fetchReps(),
    enabled: Boolean(session),
  });

  const list = data?.records ?? [];
  const filtered = useMemo(() => {
    if (tab === "all") return list;
    return list.filter((r) => r.status === tab);
  }, [list, tab]);

  const approve = useMutation({
    mutationFn: (payload: ApproveRegistrationInput) => approveFn({ data: payload }),
    onSuccess: () => {
      toast.success("Registration approved & school activated");
      qc.invalidateQueries({ queryKey: ["school-registrations"] });
      qc.invalidateQueries({ queryKey: ["schools", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["sales-reps"] });
      setEditingId(null);
    },
    onError: (err: unknown) =>
      toast.error("Approval failed", {
        description: parseFieldError(err instanceof Error ? err.message : String(err)).message,
      }),
  });

  const reject = useMutation({
    mutationFn: (payload: { id: string; reason: string }) => rejectFn({ data: payload }),
    onSuccess: () => {
      toast.success("Registration rejected");
      qc.invalidateQueries({ queryKey: ["school-registrations"] });
    },
    onError: (err: unknown) =>
      toast.error("Rejection failed", {
        description: parseFieldError(err instanceof Error ? err.message : String(err)).message,
      }),
  });

  const counts = data?.counts ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Total" value={counts.total} tone="slate" />
        <StatChip label="Pending" value={counts.pending} tone="amber" />
        <StatChip label="Approved" value={counts.approved} tone="emerald" />
        <StatChip label="Rejected" value={counts.rejected} tone="rose" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "hero" : "outline"}
            size="sm"
            onClick={() => setTab(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Viewing as {audience === "admin" ? "Administrator" : "Portal Manager"}
        </span>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading registrations…</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-14 text-center">
          <School2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No {tab === "all" ? "" : tab} registrations.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((r) => {
          const isEditing = editingId === r.id;
          const draft = edits[r.id] ?? {};
          const val = (k: string, fallback: string) => draft[k] ?? fallback;
          const setDraft = (k: string, v: string) =>
            setEdits((e) => ({ ...e, [r.id]: { ...(e[r.id] ?? {}), [k]: v } }));
          const chosenRep = salesRepId[r.id] ?? r.salesRepId ?? "";
          const isPlaceholderCode = /^PENDING-/i.test(r.schoolCode);
          const assignedCode = schoolCode[r.id] ?? (isPlaceholderCode ? "" : r.schoolCode);
          const activeReps = (reps ?? []).filter((x) => x.status === "active");
          const isPlaceholderUser = /^pending-/i.test(r.username);
          const assignedUsername = loginUsername[r.id] ?? (isPlaceholderUser ? "" : r.username);
          const assignedPassword = loginPassword[r.id] ?? "";
          const credentialsReady =
            assignedUsername.trim().length >= 3 && assignedPassword.length >= 8;
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-lg backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{r.schoolName}</h3>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3" /> {new Date(r.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Code <span className="font-mono">{isPlaceholderCode ? "Not assigned" : r.schoolCode}</span> · {r.region || "—"} ·
                    {" "}Principal: {r.principalName || "—"} ({r.designation || "—"})
                  </p>
                </div>
                {r.status === "rejected" && r.rejectionReason && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-500">
                    <MailWarning className="h-3.5 w-3.5" /> {r.rejectionReason}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FieldPair
                  label="Login username"
                  value={isPlaceholderUser ? "Assigned at approval" : r.username}
                  mono
                />
                <FieldPair
                  label="Contact email"
                  value={audience === "manager" ? maskEmail(r.email) : r.email}
                />
                <FieldPair
                  label="Phone"
                  value={audience === "manager" ? maskPhone(r.phone) : r.phone}
                />
                <FieldPair label="Address" value={r.address || "—"} />
                <FieldPair label="State" value={r.state || "—"} />
                <FieldPair label="District" value={r.city || "—"} />
                <FieldPair label="City" value={r.area || "—"} />
                <FieldPair label="Submission notes" value={r.notes || "— none provided —"} full />
              </div>

              {r.status === "pending" && (
                <>
                  {isEditing && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 md:grid-cols-2">
                      <LabeledInput label="School name" value={val("schoolName", r.schoolName)} onChange={(v) => setDraft("schoolName", v)} />
                      <LabeledInput label="Principal" value={val("principalName", r.principalName)} onChange={(v) => setDraft("principalName", v)} />
                      <LabeledInput label="Designation" value={val("designation", r.designation)} onChange={(v) => setDraft("designation", v)} />
                      <LabeledInput label="State" value={val("state", r.state)} onChange={(v) => setDraft("state", v)} />
                      <LabeledInput label="District" value={val("city", r.city)} onChange={(v) => setDraft("city", v)} />
                      <LabeledInput label="City" value={val("area", r.area)} onChange={(v) => setDraft("area", v)} />
                      <LabeledInput label="Email" value={val("email", r.email)} onChange={(v) => setDraft("email", v)} />
                      <LabeledInput label="Phone" value={val("phone", r.phone)} onChange={(v) => setDraft("phone", v)} />
                      <LabeledInput label="Address" value={val("address", r.address)} onChange={(v) => setDraft("address", v)} />
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
                        <Textarea rows={2} value={val("notes", r.notes)} onChange={(e) => setDraft("notes", e.target.value)} />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
                    <div className="flex-1 min-w-[240px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        School code *
                      </label>
                      <Input
                        placeholder="e.g. SCH-DEL-208"
                        value={assignedCode}
                        onChange={(e) =>
                          setSchoolCode((s) => ({ ...s, [r.id]: e.target.value.toUpperCase() }))
                        }
                        className="font-mono"
                      />
                    </div>
                    <div className="flex-1 min-w-[240px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Login username *
                      </label>
                      <Input
                        placeholder="e.g. dps-delhi"
                        value={assignedUsername}
                        onChange={(e) =>
                          setLoginUsername((s) => ({ ...s, [r.id]: e.target.value.toLowerCase().trim() }))
                        }
                        className="font-mono"
                      />
                    </div>
                    <div className="flex-1 min-w-[240px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Login password *
                      </label>
                      <Input
                        type="text"
                        placeholder="Minimum 8 characters"
                        value={assignedPassword}
                        onChange={(e) => setLoginPassword((s) => ({ ...s, [r.id]: e.target.value }))}
                      />
                    </div>
                    <div className="flex-1 min-w-[240px]">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Assign sales rep *
                      </label>
                      <select
                        value={chosenRep}
                        onChange={(e) => setSalesRepId((s) => ({ ...s, [r.id]: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select an active sales rep…</option>
                        {activeReps.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.fullName} — {x.designation || "Sales"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(isEditing ? null : r.id)}>
                      <Pencil className="h-4 w-4" /> {isEditing ? "Done editing" : "Edit details"}
                    </Button>
                    <Button
                      variant="hero"
                      size="sm"
                      disabled={!chosenRep || !assignedCode.trim() || !credentialsReady || approve.isPending}
                      onClick={() =>
                        approve.mutate({
                          id: r.id,
                          salesRepId: chosenRep,
                          schoolCode: assignedCode.trim(),
                          username: assignedUsername.trim(),
                          password: assignedPassword,
                          ...(isEditing
                            ? {
                                schoolName: val("schoolName", r.schoolName),
                                principalName: val("principalName", r.principalName),
                                designation: val("designation", r.designation),
                                state: val("state", r.state),
                                city: val("city", r.city),
                                area: val("area", r.area),
                                email: val("email", r.email),
                                phone: val("phone", r.phone),
                                address: val("address", r.address),
                                notes: val("notes", r.notes),
                              }
                            : {}),
                        })
                      }
                    >
                      <Check className="h-4 w-4" /> Approve & activate
                    </Button>
                    <div className="flex-1 min-w-[240px]">
                      <Input
                        placeholder="Rejection reason (optional)"
                        value={rejectReason[r.id] ?? ""}
                        onChange={(e) => setRejectReason((s) => ({ ...s, [r.id]: e.target.value }))}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reject.isPending}
                      onClick={() => reject.mutate({ id: r.id, reason: rejectReason[r.id] ?? "" })}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "slate" | "amber" | "emerald" | "rose" }) {
  const toneClass = {
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  }[tone];
  return (
    <div className={`rounded-2xl border px-5 py-4 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: "border-amber-500/40 bg-amber-500/10 text-amber-500",
    approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
    rejected: "border-rose-500/40 bg-rose-500/10 text-rose-500",
  };
  return <Badge className={`border ${map[status]} capitalize`}>{status}</Badge>;
}

function FieldPair({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </label>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "••••••";
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(4, name.length - visible.length))}@${domain}`;
}
function maskPhone(phone: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 4) return phone ? "••••" : "";
  return `${digits.slice(0, 2)}${"•".repeat(Math.max(4, digits.length - 4))}${digits.slice(-2)}`;
}