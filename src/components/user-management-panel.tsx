import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listManagedUsers,
  adminResetUserPassword,
  adminChangeUsername,
  adminSetUserActive,
  adminResetSecurity,
  adminDeleteUser,
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
import { toast } from "sonner";
import { Loader2, KeyRound, UserCog, Power, ShieldOff, Trash2, RefreshCcw, Search } from "lucide-react";

type Actor = "admin" | "manager";

export function UserManagementPanel({ actor }: { actor: Actor }) {
  const load = useServerFn(listManagedUsers);
  const resetPw = useServerFn(adminResetUserPassword);
  const chgUsername = useServerFn(adminChangeUsername);
  const setActive = useServerFn(adminSetUserActive);
  const resetSec = useServerFn(adminResetSecurity);
  const del = useServerFn(adminDeleteUser);

  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [pwTarget, setPwTarget] = useState<ManagedUser | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [unameTarget, setUnameTarget] = useState<ManagedUser | null>(null);
  const [unameValue, setUnameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const roles = actor === "admin"
    ? ["all", "admin", "portal_manager", "sales_rep", "school", "teacher", "student"]
    : ["all", "sales_rep", "school", "teacher", "student"];

  async function refresh() {
    setLoading(true);
    try { setRows(await load({ data: { roleFilter, search } }) as ManagedUser[]); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [roleFilter]);

  async function onSetActive(u: ManagedUser, active: boolean) {
    if (!confirm(`${active ? "Activate" : "Deactivate"} ${u.username}?`)) return;
    try { await setActive({ data: { userId: u.userId, active } }); toast.success("Updated."); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function onResetSec(u: ManagedUser) {
    if (!confirm(`Reset security setup for ${u.username}? They'll be asked again on next login.`)) return;
    try { await resetSec({ data: { userId: u.userId } }); toast.success("Security reset."); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function onDelete(u: ManagedUser) {
    if (!confirm(`Permanently delete ${u.username}? This cannot be undone.`)) return;
    try { await del({ data: { userId: u.userId } }); toast.success("Deleted."); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function submitPw() {
    if (!pwTarget) return;
    setBusy(true);
    try { await resetPw({ data: { userId: pwTarget.userId, newPassword: pwValue } }); toast.success("Password updated."); setPwTarget(null); setPwValue(""); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function submitUname() {
    if (!unameTarget) return;
    setBusy(true);
    try { await chgUsername({ data: { userId: unameTarget.userId, newUsername: unameValue } }); toast.success("Username updated."); setUnameTarget(null); setUnameValue(""); refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input placeholder="Username or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button onClick={refresh}><Search className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
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
                  <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
                  <TableHead>Setup</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Badge className={u.isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}>
                          {u.isActive ? "active" : "deactivated"}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.mustSetupSecurity ? <Badge variant="outline">pending</Badge> : <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300">complete</Badge>}</TableCell>
                      <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setPwTarget(u); setPwValue(""); }} title="Reset password"><KeyRound className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => { setUnameTarget(u); setUnameValue(u.username); }} title="Change username"><UserCog className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => onSetActive(u, !u.isActive)} title={u.isActive ? "Deactivate" : "Activate"}><Power className="h-3.5 w-3.5" /></Button>
                          {actor === "admin" && (
                            <Button size="sm" variant="outline" onClick={() => onResetSec(u)} title="Reset security setup"><RefreshCcw className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button size="sm" variant="outline" className="text-rose-600" onClick={() => onDelete(u)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No users match.</TableCell></TableRow>
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
          <DialogFooter><Button onClick={submitPw} disabled={busy || pwValue.length < 6}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}</Button></DialogFooter>
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
          <DialogFooter><Button onClick={submitUname} disabled={busy || unameValue.length < 3}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update username"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {actor === "admin" && (
        <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldOff className="h-3 w-3" /> Admins can never modify their own account.</div>
      )}
    </div>
  );
}