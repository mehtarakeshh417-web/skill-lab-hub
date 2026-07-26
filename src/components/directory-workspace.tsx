import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  School2, GraduationCap, Users, Briefcase, Search, RefreshCcw, Download, FileSpreadsheet,
  KeyRound, UserCog, Power, Trash2, ChevronDown, Loader2, MapPin, Mail, Phone, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { friendlyError, countLabel } from "@/lib/messages";
import { adminResetUserPassword, adminChangeUsername, adminSetUserActive } from "@/lib/security.functions";
import { deleteSchoolWithDependents, deleteDirectoryPerson } from "@/lib/directory.functions";
import type { PersonRow, SchoolRow } from "@/lib/directory.server";
import { exportCsv, exportXlsx, type ExportColumn } from "@/lib/export-report";
import { cn } from "@/lib/utils";

type Filters = { search: string; state: string; city: string; region: string; schoolId: string; status: string };

type DirectoryData = {
  audience: "admin" | "manager";
  schools: SchoolRow[];
  teachers: PersonRow[];
  students: PersonRow[];
  salesReps: PersonRow[];
  facets: { states: string[]; cities: string[]; regions: string[]; schools: Array<{ id: string; name: string }> };
  totals: Record<string, number>;
};

type Tab = "schools" | "teachers" | "students" | "salesReps";

const TAB_META: Record<Tab, { label: string; icon: typeof School2 }> = {
  schools: { label: "Schools", icon: School2 },
  teachers: { label: "Teachers", icon: GraduationCap },
  students: { label: "Students", icon: Users },
  salesReps: { label: "Sales Reps", icon: Briefcase },
};

function StatusPill({ status }: { status: string }) {
  const tone = status === "active"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
    : status === "pending"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize", tone)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function DirectoryWorkspace({
  data, loading, filters, onFilters, onRefresh, defaultTab = "schools",
}: {
  data?: DirectoryData;
  loading: boolean;
  filters: Filters;
  onFilters: (f: Filters) => void;
  onRefresh: () => void;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [pwTarget, setPwTarget] = useState<{ userId: string; label: string } | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [unameTarget, setUnameTarget] = useState<{ userId: string; label: string } | null>(null);
  const [unameValue, setUnameValue] = useState("");
  const [deleteSchool, setDeleteSchool] = useState<SchoolRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [activeTarget, setActiveTarget] = useState<{ userId: string; label: string; nextActive: boolean } | null>(null);
  const [personTarget, setPersonTarget] = useState<{ kind: "teacher" | "student" | "sales_rep"; row: PersonRow } | null>(null);
  const [bulkTarget, setBulkTarget] = useState<string[] | null>(null);

  const resetPw = useServerFn(adminResetUserPassword);
  const chgUname = useServerFn(adminChangeUsername);
  const setActive = useServerFn(adminSetUserActive);
  const delSchool = useServerFn(deleteSchoolWithDependents);
  const delPerson = useServerFn(deleteDirectoryPerson);

  const isAdmin = data?.audience === "admin";

  const people: PersonRow[] = useMemo(() => {
    if (!data) return [];
    if (tab === "teachers") return data.teachers;
    if (tab === "students") return data.students;
    if (tab === "salesReps") return data.salesReps;
    return [];
  }, [data, tab]);

  const schools = data?.schools ?? [];
  const rowCount = tab === "schools" ? schools.length : people.length;

  function applySearch() {
    onFilters({ ...filters, search: draftSearch });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exportRows(kind: "csv" | "xlsx") {
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === "schools") {
      const cols: ExportColumn<SchoolRow>[] = [
        { header: "School", value: (r) => r.name },
        { header: "Code", value: (r) => r.schoolCode },
        { header: "Username", value: (r) => r.username },
        { header: "Email", value: (r) => r.email },
        { header: "Phone", value: (r) => r.phone },
        { header: "Principal", value: (r) => r.principalName },
        { header: "Designation", value: (r) => r.designation },
        { header: "Area", value: (r) => r.area },
        { header: "City", value: (r) => r.city },
        { header: "State", value: (r) => r.state },
        { header: "Sales rep", value: (r) => r.salesRepName },
        { header: "Teachers", value: (r) => r.teacherCount },
        { header: "Students", value: (r) => r.studentCount },
        { header: "Status", value: (r) => r.status },
        { header: "Created", value: (r) => new Date(r.createdAt).toLocaleDateString() },
      ];
      const summary: Array<[string, string | number]> = [
        ["Total schools", schools.length],
        ["Total teachers", data?.totals.teachers ?? 0],
        ["Total students", data?.totals.students ?? 0],
        ["Active schools", schools.filter((s) => s.status === "active").length],
      ];
      if (kind === "csv") exportCsv(schools, cols, `avartan-schools-${stamp}`);
      else exportXlsx(schools, cols, `avartan-schools-${stamp}`, summary);
      return;
    }
    const cols: ExportColumn<PersonRow>[] = [
      { header: "Name", value: (r) => r.fullName },
      { header: "Username", value: (r) => r.username },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: tab === "students" ? "Class" : tab === "teachers" ? "Subject" : "Designation", value: (r) => r.meta1 },
      { header: tab === "students" ? "Section" : "Department", value: (r) => r.meta2 },
      { header: "School", value: (r) => r.schoolName },
      { header: "City", value: (r) => r.city },
      { header: "State", value: (r) => r.state },
      { header: "Status", value: (r) => r.status },
      { header: "Created", value: (r) => new Date(r.createdAt).toLocaleDateString() },
    ];
    const name = `avartan-${TAB_META[tab].label.toLowerCase().replace(/\s+/g, "-")}-${stamp}`;
    if (kind === "csv") exportCsv(people, cols, name);
    else exportXlsx(people, cols, name, [["Rows exported", people.length]]);
  }

  async function confirmToggleActive() {
    if (!activeTarget) return;
    const { userId, label, nextActive } = activeTarget;
    setBusy(true);
    try {
      await setActive({ data: { userId, active: nextActive } });
      toast.success(
        nextActive ? `${label} can sign in again` : `${label} has been deactivated`,
        { description: nextActive ? "The account is active with the same username and password." : "This account can no longer sign in until you reactivate it." },
      );
      setActiveTarget(null);
      onRefresh();
    } catch (e) {
      toast.error(nextActive ? "We couldn't activate this account" : "We couldn't deactivate this account", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function submitPassword() {
    if (!pwTarget) return;
    setBusy(true);
    try {
      await resetPw({ data: { userId: pwTarget.userId, newPassword: pwValue } });
      toast.success(`Password updated for ${pwTarget.label}`, { description: "Share the new password securely — they can sign in with it right away." });
      setPwTarget(null); setPwValue("");
    } catch (e) {
      toast.error("We couldn't update the password", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function submitUsername() {
    if (!unameTarget) return;
    setBusy(true);
    try {
      await chgUname({ data: { userId: unameTarget.userId, newUsername: unameValue } });
      toast.success("Username updated", { description: `This account now signs in as “${unameValue.trim()}”.` });
      setUnameTarget(null); setUnameValue("");
      onRefresh();
    } catch (e) {
      toast.error("We couldn't update the username", { description: friendlyError(e, "That username may already be taken. Please try another one.") });
    } finally { setBusy(false); }
  }

  async function submitSchoolDelete() {
    if (!deleteSchool) return;
    setBusy(true);
    try {
      const res = await delSchool({ data: { schoolId: deleteSchool.id } }) as { teachersDeleted: number; studentsDeleted: number };
      toast.success(`${deleteSchool.name} has been deleted`, {
        description: `${countLabel(res.teachersDeleted, "teacher account")} and ${countLabel(res.studentsDeleted, "student account")} were removed with it.`,
      });
      setDeleteSchool(null); setConfirmText("");
      onRefresh();
    } catch (e) {
      toast.error("We couldn't delete this school", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function confirmDeletePerson() {
    if (!personTarget) return;
    setBusy(true);
    try {
      await delPerson({ data: { kind: personTarget.kind, id: personTarget.row.id } });
      toast.success(`${personTarget.row.fullName} has been deleted`, { description: "Their login and profile have been removed from the portal." });
      setPersonTarget(null);
      onRefresh();
    } catch (e) {
      toast.error("We couldn't delete this account", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  function requestBulkDeactivate(userIds: Array<string | null>) {
    const ids = userIds.filter(Boolean) as string[];
    if (!ids.length) {
      toast.warning("Nothing to deactivate", { description: "The accounts you selected don't have a portal login yet." });
      return;
    }
    setBulkTarget(ids);
  }

  async function confirmBulkDeactivate() {
    const ids = bulkTarget ?? [];
    if (!ids.length) return;
    setBusy(true);
    try {
      for (const id of ids) await setActive({ data: { userId: id, active: false } });
      toast.success(`${countLabel(ids.length, "account")} deactivated`, { description: "They can no longer sign in until you reactivate them." });
      setBulkTarget(null);
      setSelected([]);
      onRefresh();
    } catch (e) {
      toast.error("We couldn't finish deactivating every account", { description: friendlyError(e, "Some accounts may have been updated. Refresh to see the latest status.") });
    } finally { setBusy(false); }
  }

  const personKind = tab === "teachers" ? "teacher" : tab === "students" ? "student" : "sales_rep";

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="sticky top-2 z-20 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-elegant backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Search</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                placeholder="Name, code, username, email, phone…"
                className="rounded-xl"
              />
              <Button onClick={applySearch} className="rounded-xl px-5"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
          <FilterSelect label="Region / Area" value={filters.region} options={data?.facets.regions ?? []} onChange={(v) => onFilters({ ...filters, region: v })} />
          <FilterSelect label="State" value={filters.state} options={data?.facets.states ?? []} onChange={(v) => onFilters({ ...filters, state: v, city: "all" })} />
          <FilterSelect label="City" value={filters.city} options={data?.facets.cities ?? []} onChange={(v) => onFilters({ ...filters, city: v })} />
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Label>
            <Select value={filters.status} onValueChange={(v) => onFilters({ ...filters, status: v })}>
              <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-4">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">School</Label>
            <Select value={filters.schoolId} onValueChange={(v) => onFilters({ ...filters, schoolId: v })}>
              <SelectTrigger className="mt-2 rounded-xl"><SelectValue placeholder="All schools" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {(data?.facets.schools ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-8">
            <Button variant="outline" className="rounded-xl" onClick={onRefresh}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
            <Button variant="outline" className="rounded-xl" onClick={() => exportRows("csv")}><Download className="h-4 w-4" /> CSV</Button>
            <Button variant="hero" className="rounded-xl" onClick={() => exportRows("xlsx")}><FileSpreadsheet className="h-4 w-4" /> Excel report</Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setDraftSearch(""); onFilters({ search: "", state: "all", city: "all", region: "all", schoolId: "all", status: "all" }); }}
            >
              Clear filters
            </Button>
            <span className="ml-auto text-sm font-medium text-muted-foreground">{rowCount} record{rowCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setSelected([]); setExpanded(null); }}>
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl p-2 sm:grid-cols-4">
          {(Object.keys(TAB_META) as Tab[]).map((key) => {
            const Icon = TAB_META[key].icon;
            const count = key === "schools" ? schools.length
              : key === "teachers" ? (data?.teachers.length ?? 0)
              : key === "students" ? (data?.students.length ?? 0)
              : (data?.salesReps.length ?? 0);
            return (
              <TabsTrigger key={key} value={key} className="rounded-xl py-3 text-sm font-semibold">
                <Icon className="mr-2 h-4 w-4" /> {TAB_META[key].label}
                <Badge variant="secondary" className="ml-2">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-4">
            <span className="text-sm font-semibold">{selected.length} selected</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={busy}
              onClick={() => requestBulkDeactivate(
                tab === "schools"
                  ? schools.filter((s) => selected.includes(s.id)).map((s) => s.userId)
                  : people.filter((p) => selected.includes(p.id)).map((p) => p.userId),
              )}
            >
              <Power className="h-4 w-4" /> Deactivate selected
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setSelected([])}>Clear selection</Button>
          </div>
        )}

        <TabsContent value="schools" className="mt-4 space-y-3">
          {loading ? <LoadingRows /> : schools.length === 0 ? <EmptyRows label="No schools match your current search or filters. Try clearing the filters to see every school." /> : schools.map((s) => (
            <div key={s.id} className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl transition-shadow hover:shadow-glow">
              <div className="flex flex-wrap items-start gap-4">
                <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggleSelect(s.id)} className="mt-2" />
                <div className="min-w-[220px] flex-1">
                  <div className="font-display text-lg font-bold tracking-tight">{s.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{s.schoolCode}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{[s.city, s.state].filter(Boolean).join(", ") || "—"}</span>
                  </div>
                </div>
                <div className="min-w-[200px] space-y-1 text-sm">
                  <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{s.email || "—"}</div>
                  <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{s.phone || "—"}</div>
                </div>
                <div className="flex min-w-[160px] gap-2">
                  <Badge variant="secondary" className="rounded-lg">{s.teacherCount} teachers</Badge>
                  <Badge variant="secondary" className="rounded-lg">{s.studentCount} students</Badge>
                </div>
                <StatusPill status={s.status} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" disabled={!s.userId} onClick={() => { setPwTarget({ userId: s.userId!, label: s.name }); setPwValue(""); }}>
                    <KeyRound className="h-4 w-4" /> Password
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" disabled={!s.userId} onClick={() => { setUnameTarget({ userId: s.userId!, label: s.name }); setUnameValue(s.username); }}>
                    <UserCog className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy || !s.userId}
                    title={s.status === "active" ? "Deactivate school login" : "Reactivate school login"}
                    onClick={() => s.userId && setActiveTarget({ userId: s.userId, label: s.name, nextActive: s.status !== "active" })}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => { setDeleteSchool(s); setConfirmText(""); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expanded === s.id && "rotate-180")} />
                  </Button>
                </div>
              </div>
              {expanded === s.id && (
                <div className="mt-6 grid gap-4 rounded-2xl border border-border/50 bg-background/50 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail label="Login username" value={s.username} />
                  <Detail label="Principal" value={s.principalName || "—"} />
                  <Detail label="Designation" value={s.designation || "—"} />
                  <Detail label="Sales representative" value={s.salesRepName} />
                  <Detail label="Area" value={s.area || "—"} />
                  <Detail label="Address" value={s.address || "—"} />
                  <Detail label="Onboarded" value={new Date(s.createdAt).toLocaleString()} />
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { onFilters({ ...filters, schoolId: s.id }); setTab("teachers"); }}
                    >
                      View roster
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {(["teachers", "students", "salesReps"] as Tab[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {loading ? <LoadingRows /> : people.length === 0 ? <EmptyRows label={`No ${TAB_META[key].label.toLowerCase()} match your current search or filters. Try clearing the filters to see everyone.`} /> : people.map((p) => (
              <div key={p.id} className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl transition-shadow hover:shadow-glow">
                <div className="flex flex-wrap items-center gap-4">
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                  <div className="min-w-[200px] flex-1">
                    <div className="font-semibold">{p.fullName}</div>
                    <div className="text-xs font-mono text-muted-foreground">{p.username}</div>
                  </div>
                  <div className="min-w-[200px] space-y-1 text-sm">
                    <div className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{p.email || "—"}</div>
                    <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{p.phone || "—"}</div>
                  </div>
                  <div className="min-w-[150px] text-sm">
                    <div className="font-medium">{p.meta1 || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.meta2 || "—"}</div>
                  </div>
                  {key !== "salesReps" && (
                    <div className="min-w-[160px] text-sm">
                      <div className="font-medium">{p.schoolName}</div>
                      <div className="text-xs text-muted-foreground">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</div>
                    </div>
                  )}
                  <StatusPill status={p.status} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setPwTarget({ userId: p.userId, label: p.fullName }); setPwValue(""); }}>
                      <KeyRound className="h-4 w-4" /> Password
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setUnameTarget({ userId: p.userId, label: p.fullName }); setUnameValue(p.username); }}>
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={busy}
                      title={p.status === "active" ? "Deactivate account" : "Reactivate account"}
                      onClick={() => setActiveTarget({ userId: p.userId, label: p.fullName, nextActive: p.status !== "active" })}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="destructive" className="rounded-xl" disabled={busy} title="Delete account" onClick={() => setPersonTarget({ kind: personKind, row: p })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Password dialog */}
      <Dialog open={Boolean(pwTarget)} onOpenChange={(o) => { if (!o) { setPwTarget(null); setPwValue(""); } }}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Set a new password</DialogTitle>
            <DialogDescription>{pwTarget?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>New password</Label>
            <Input value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="Minimum 6 characters" className="rounded-xl" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPwValue(randomPassword())}>Generate</Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-xl" disabled={!pwValue} onClick={() => { navigator.clipboard?.writeText(pwValue); toast.success("Password copied to your clipboard"); }}>Copy</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button className="rounded-xl" disabled={busy || pwValue.length < 6} onClick={submitPassword}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Username dialog */}
      <Dialog open={Boolean(unameTarget)} onOpenChange={(o) => { if (!o) { setUnameTarget(null); setUnameValue(""); } }}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> Change username</DialogTitle>
            <DialogDescription>{unameTarget?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>New username</Label>
            <Input value={unameValue} onChange={(e) => setUnameValue(e.target.value)} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setUnameTarget(null)}>Cancel</Button>
            <Button className="rounded-xl" disabled={busy || unameValue.trim().length < 3} onClick={submitUsername}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cascade delete dialog */}
      <Dialog open={Boolean(deleteSchool)} onOpenChange={(o) => { if (!o) { setDeleteSchool(null); setConfirmText(""); } }}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Delete school permanently</DialogTitle>
            <DialogDescription>
              Deleting <strong>{deleteSchool?.name}</strong> also removes {countLabel(deleteSchool?.teacherCount ?? 0, "teacher account")} and {countLabel(deleteSchool?.studentCount ?? 0, "student account")}, including their logins and records. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>To confirm, type the school code <span className="font-mono">{deleteSchool?.schoolCode}</span> below</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => setDeleteSchool(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" disabled={busy || confirmText.trim().toUpperCase() !== (deleteSchool?.schoolCode ?? "")} onClick={submitSchoolDelete}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete school and accounts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(activeTarget) && activeTarget?.nextActive === false}
        onOpenChange={(o) => { if (!o) setActiveTarget(null); }}
        tone="warning"
        icon={Power}
        busy={busy}
        title="Deactivate this account?"
        description={<>You're about to deactivate <strong>{activeTarget?.label}</strong>. The account stays in the portal, but it can't be used until you turn it back on.</>}
        impact={[
          "They will be signed out and can no longer log in.",
          "All records, classes and history are kept safely — nothing is deleted.",
          "You can reactivate this account at any time from this directory.",
        ]}
        confirmLabel="Deactivate account"
        cancelLabel="Cancel"
        onConfirm={confirmToggleActive}
      />

      <ConfirmDialog
        open={Boolean(activeTarget) && activeTarget?.nextActive === true}
        onOpenChange={(o) => { if (!o) setActiveTarget(null); }}
        tone="neutral"
        icon={Power}
        busy={busy}
        title="Reactivate this account?"
        description={<><strong>{activeTarget?.label}</strong> will be able to sign in again immediately with their existing username and password.</>}
        confirmLabel="Reactivate account"
        cancelLabel="Cancel"
        onConfirm={confirmToggleActive}
      />

      <ConfirmDialog
        open={Boolean(bulkTarget)}
        onOpenChange={(o) => { if (!o) setBulkTarget(null); }}
        tone="warning"
        icon={Power}
        busy={busy}
        title={`Deactivate ${countLabel(bulkTarget?.length ?? 0, "account")}?`}
        description="These accounts will be paused together. Nothing is deleted, and you can reactivate any of them later."
        impact={[
          "Everyone selected will be signed out and unable to log in.",
          "Their records and history stay exactly as they are.",
        ]}
        confirmLabel="Deactivate selected"
        cancelLabel="Cancel"
        onConfirm={confirmBulkDeactivate}
      />

      <ConfirmDialog
        open={Boolean(personTarget)}
        onOpenChange={(o) => { if (!o) setPersonTarget(null); }}
        tone="danger"
        icon={Trash2}
        busy={busy}
        title="Delete this account permanently?"
        description={<>This permanently removes <strong>{personTarget?.row.fullName}</strong> from the portal. This action cannot be undone.</>}
        impact={[
          "Their login is deleted and they lose access immediately.",
          "Their profile disappears from directories, rosters and reports.",
          "If you only want to pause access, deactivate the account instead.",
        ]}
        confirmLabel="Delete permanently"
        cancelLabel="Keep account"
        onConfirm={confirmDeletePerson}
      />
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="lg:col-span-2">
      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-border/60 bg-card/60 py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function EmptyRows({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-8 py-16 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}