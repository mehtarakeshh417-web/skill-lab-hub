import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listManagedUsers,
  adminResetUserPassword,
  adminChangeUsername,
  adminSetUserActive,
  adminResetSecurity,
  adminDeleteUser,
  adminUpdateUserProfile,
  type ManagedUser,
} from "@/lib/security.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { friendlyError } from "@/lib/messages";
import { toast } from "sonner";
import { exportXlsx, type ExportColumn } from "@/lib/export-report";
import { Loader2, KeyRound, UserCog, Power, ShieldOff, Trash2, RefreshCcw, Search, Pencil, FileSpreadsheet, Users2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  all: "All roles",
  admin: "Administrator",
  portal_manager: "Portal manager",
  sales_rep: "Sales representative",
  school: "School",
  teacher: "Teacher",
  student: "Student",
};

type Actor = "admin" | "manager";

export function UserManagementPanel({ actor }: { actor: Actor }) {
  const load = useServerFn(listManagedUsers);
  const resetPw = useServerFn(adminResetUserPassword);
  const chgUsername = useServerFn(adminChangeUsername);
  const setActive = useServerFn(adminSetUserActive);
  const resetSec = useServerFn(adminResetSecurity);
  const del = useServerFn(adminDeleteUser);
  const updProfile = useServerFn(adminUpdateUserProfile);

  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [setupFilter, setSetupFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [pwTarget, setPwTarget] = useState<ManagedUser | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [unameTarget, setUnameTarget] = useState<ManagedUser | null>(null);
  const [unameValue, setUnameValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTarget, setActiveTarget] = useState<{ user: ManagedUser; nextActive: boolean } | null>(null);
  const [secTarget, setSecTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"block" | "unblock" | "delete" | null>(null);

  const roles = actor === "admin"
    ? ["all", "admin", "portal_manager", "sales_rep", "school", "teacher", "student"]
    : ["all", "sales_rep", "school", "teacher", "student"];

  async function refresh() {
    setLoading(true);
    try { setRows(await load({ data: { roleFilter, search } }) as ManagedUser[]); }
    catch (e) { toast.error("We couldn't load the user list", { description: friendlyError(e, "Please refresh the page and try again.") }); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [roleFilter]);

  const visibleRows = rows.filter((u) => {
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "blocked" && u.isActive) return false;
    if (setupFilter === "pending" && !u.mustSetupSecurity) return false;
    if (setupFilter === "complete" && u.mustSetupSecurity) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.username, u.email, u.fullName ?? ""].some((v) => v.toLowerCase().includes(q));
  });
  const allSelected = visibleRows.length > 0 && visibleRows.every((u) => selected.includes(u.userId));

  function toggleAll() {
    setSelected(allSelected ? [] : visibleRows.map((u) => u.userId));
  }
  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exportList() {
    const cols: ExportColumn<ManagedUser>[] = [
      { header: "Name", value: (r) => r.fullName ?? "" },
      { header: "Username", value: (r) => r.username },
      { header: "Email", value: (r) => r.email },
      { header: "Role", value: (r) => ROLE_LABELS[r.role] ?? r.role },
      { header: "Status", value: (r) => (r.isActive ? "Active" : "Blocked") },
      { header: "Security setup", value: (r) => (r.mustSetupSecurity ? "Pending" : "Complete") },
      { header: "Created", value: (r) => new Date(r.createdAt).toLocaleDateString() },
    ];
    exportXlsx(visibleRows, cols, `avartan-users-${new Date().toISOString().slice(0, 10)}`);
  }

  async function runBulk() {
    if (!bulkAction) return;
    const targets = rows.filter((u) => selected.includes(u.userId));
    setBusy(true);
    let done = 0;
    let failed = 0;
    for (const u of targets) {
      try {
        if (bulkAction === "delete") await del({ data: { userId: u.userId } });
        else await setActive({ data: { userId: u.userId, active: bulkAction === "unblock" } });
        done += 1;
      } catch { failed += 1; }
    }
    setBusy(false);
    setBulkAction(null);
    setSelected([]);
    if (done) toast.success(`${done} account${done === 1 ? "" : "s"} updated`);
    if (failed) toast.error(`${failed} account${failed === 1 ? "" : "s"} could not be updated`, { description: "Some accounts may be protected. Please try them individually." });
    refresh();
  }

  async function submitProfile() {
    if (!editTarget) return;
    setBusy(true);
    try {
      await updProfile({ data: { userId: editTarget.userId, fullName: editName, email: editEmail } });
      toast.success("Profile updated", { description: `${editName} has been saved.` });
      setEditTarget(null);
      refresh();
    } catch (e) {
      toast.error("We couldn't save these details", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function confirmSetActive() {
    if (!activeTarget) return;
    const { user: u, nextActive } = activeTarget;
    setBusy(true);
    try {
      await setActive({ data: { userId: u.userId, active: nextActive } });
      toast.success(
        nextActive ? `${u.username} can sign in again` : `${u.username} has been deactivated`,
        { description: nextActive ? "Their account is active with the same username and password." : "They can no longer sign in until you reactivate the account." },
      );
      setActiveTarget(null);
      refresh();
    } catch (e) {
      toast.error(nextActive ? "We couldn't activate this account" : "We couldn't deactivate this account", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }
  async function confirmResetSecurity() {
    if (!secTarget) return;
    setBusy(true);
    try {
      await resetSec({ data: { userId: secTarget.userId } });
      toast.success("Security setup reset", { description: `${secTarget.username} will be asked to set a new PIN and security question at their next sign-in.` });
      setSecTarget(null);
      refresh();
    } catch (e) {
      toast.error("We couldn't reset the security setup", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await del({ data: { userId: deleteTarget.userId } });
      toast.success(`${deleteTarget.username} has been deleted`, { description: "Their login and profile have been removed from the portal." });
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      toast.error("We couldn't delete this account", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function submitPw() {
    if (!pwTarget) return;
    setBusy(true);
    try {
      await resetPw({ data: { userId: pwTarget.userId, newPassword: pwValue } });
      toast.success(`Password updated for ${pwTarget.username}`, { description: "Share the new password securely — they can sign in with it right away." });
      setPwTarget(null); setPwValue("");
    }
    catch (e) { toast.error("We couldn't update the password", { description: friendlyError(e) }); }
    finally { setBusy(false); }
  }
  async function submitUname() {
    if (!unameTarget) return;
    setBusy(true);
    try {
      await chgUsername({ data: { userId: unameTarget.userId, newUsername: unameValue } });
      toast.success("Username updated", { description: `This account now signs in as “${unameValue}”.` });
      setUnameTarget(null); setUnameValue(""); refresh();
    }
    catch (e) { toast.error("We couldn't update the username", { description: friendlyError(e, "That username may already be taken. Please try another one.") }); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> User Management</span>
            <span className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportList} disabled={visibleRows.length === 0}>
                <FileSpreadsheet className="h-4 w-4" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={refresh}><RefreshCcw className="h-4 w-4" /> Refresh</Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Security setup</Label>
              <Select value={setupFilter} onValueChange={setSetupFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input placeholder="Name, username or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button onClick={refresh}><Search className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          {selected.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
              <Users2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selected.length} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setBulkAction("block")}>Block</Button>
                <Button size="sm" variant="outline" onClick={() => setBulkAction("unblock")}>Unblock</Button>
                <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setBulkAction("delete")}>Delete</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all users" className="h-4 w-4 accent-primary" />
                  </TableHead>
                  <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
                  <TableHead>Setup</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {visibleRows.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.includes(u.userId)}
                          onChange={() => toggleOne(u.userId)}
                          aria-label={`Select ${u.username}`}
                          className="h-4 w-4 accent-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{u.fullName || u.username}</div>
                        <div className="text-xs text-muted-foreground">@{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge></TableCell>
                      <TableCell>
                        <Badge className={u.isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}>
                          {u.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.mustSetupSecurity ? <Badge variant="outline">pending</Badge> : <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">complete</Badge>}</TableCell>
                      <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setEditTarget(u); setEditName(u.fullName ?? u.username); setEditEmail(u.email); }} title="Edit details"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => { setPwTarget(u); setPwValue(""); }} title="Reset password"><KeyRound className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => { setUnameTarget(u); setUnameValue(u.username); }} title="Change username"><UserCog className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => setActiveTarget({ user: u, nextActive: !u.isActive })} title={u.isActive ? "Block account" : "Unblock account"}><Power className="h-3.5 w-3.5" /></Button>
                          {actor === "admin" && (
                            <Button size="sm" variant="outline" onClick={() => setSecTarget(u)} title="Reset security setup"><RefreshCcw className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setDeleteTarget(u)} title="Delete account"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleRows.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No users match your search or filters. Try a different name, or clear the filters to see everyone.
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password — {pwTarget?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>New password</Label>
            <Input type="password" value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="Min 6 characters" />
            <p className="text-xs text-muted-foreground">The user can sign in with this password immediately. They should change it after logging in.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitPw} disabled={busy || pwValue.length < 6}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!unameTarget} onOpenChange={(o) => !o && setUnameTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change username — {unameTarget?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>New username</Label>
            <Input value={unameValue} onChange={(e) => setUnameValue(e.target.value.trim().toLowerCase())} />
            <p className="text-xs text-muted-foreground">Must be unique. The user will sign in with this new username immediately.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnameTarget(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitUname} disabled={busy || unameValue.length < 3}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update username"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit details — {editTarget?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <p className="text-xs text-muted-foreground">These details appear across directories and reports. Changing the email also changes the address used for sign-in links.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitProfile} disabled={busy || editName.trim().length < 2}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(activeTarget) && activeTarget?.nextActive === false}
        onOpenChange={(o) => { if (!o) setActiveTarget(null); }}
        tone="warning"
        tone="warning"
        icon={Power}
        busy={busy}
        title="Deactivate this account?"
        description={<>You're about to deactivate <strong>{activeTarget?.user.username}</strong>. Their account stays in the portal, but they won't be able to use it until you turn it back on.</>}
        impact={[
          "They will be signed out and can no longer log in.",
          "Their records, classes and history are kept safely — nothing is deleted.",
          "You can reactivate this account at any time from this page.",
        ]}
        confirmLabel="Deactivate account"
        cancelLabel="Cancel"
        onConfirm={confirmSetActive}
      />

      <ConfirmDialog
        open={Boolean(activeTarget) && activeTarget?.nextActive === true}
        onOpenChange={(o) => { if (!o) setActiveTarget(null); }}
        tone="neutral"
        icon={Power}
        busy={busy}
        title="Reactivate this account?"
        description={<><strong>{activeTarget?.user.username}</strong> will be able to sign in again immediately using their existing username and password.</>}
        confirmLabel="Reactivate account"
        cancelLabel="Cancel"
        onConfirm={confirmSetActive}
      />

      <ConfirmDialog
        open={Boolean(secTarget)}
        onOpenChange={(o) => { if (!o) setSecTarget(null); }}
        tone="warning"
        icon={RefreshCcw}
        busy={busy}
        title="Reset security setup?"
        description={<>This clears the recovery PIN and security question for <strong>{secTarget?.username}</strong>.</>}
        impact={[
          "They will be asked to create a new PIN and security question the next time they sign in.",
          "Their password stays the same.",
        ]}
        confirmLabel="Reset security setup"
        cancelLabel="Cancel"
        onConfirm={confirmResetSecurity}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        tone="danger"
        icon={Trash2}
        busy={busy}
        title="Delete this account permanently?"
        description={<>This permanently removes <strong>{deleteTarget?.username}</strong> from the portal. This action cannot be undone.</>}
        impact={[
          "Their login is deleted and they lose access immediately.",
          "Their profile is removed from all directories and reports.",
          "If you only want to pause access, deactivate the account instead.",
        ]}
        confirmLabel="Delete permanently"
        cancelLabel="Keep account"
        onConfirm={confirmDelete}
      />

      {actor === "admin" && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldOff className="h-3 w-3" /> For your safety, you can't change or remove your own admin account here.</div>
      )}
    </div>
  );
}