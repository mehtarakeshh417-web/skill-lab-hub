import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/security.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Trail — Admin" }] }),
  component: () => (
    <AppShell requireRole="admin" title="Audit Trail">
      <AuditPage />
    </AppShell>
  ),
});

type Row = {
  id: string; created_at: string;
  actor_username: string | null; actor_role: string | null;
  action: string; entity_type: string | null; entity_id: string | null; entity_label: string | null;
  previous_value: unknown; new_value: unknown;
  ip_address: string | null; status: string; remarks: string | null;
};

const ACTIONS = ["all", "admin.user.activate", "admin.user.deactivate", "admin.user.delete", "admin.password.reset", "admin.username.change", "admin.security.reset", "password.change", "password.reset.pin", "password.reset.question", "security.setup.complete", "school.approve", "school.reject"];
const ENTITIES = ["all", "user", "school", "teacher", "student", "sales_rep"];
const ROLES = ["all", "admin", "portal_manager"];

function AuditPage() {
  const load = useServerFn(listAuditLogs);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  async function refresh() {
    setLoading(true);
    try {
      const r = await load({ data: {
        from: from ? new Date(from).toISOString() : null,
        to: to ? new Date(to).toISOString() : null,
        action, entityType, role, search, sort, page, pageSize,
      }}) as { rows: Row[]; count: number };
      setRows(r.rows); setCount(r.count);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, sort]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div><label className="text-xs text-muted-foreground">From</label><Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">To</label><Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Action</label>
            <Select value={action} onValueChange={setAction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-xs text-muted-foreground">Entity</label>
            <Select value={entityType} onValueChange={setEntityType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENTITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-xs text-muted-foreground">Actor role</label>
            <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
          </div>
          <div><label className="text-xs text-muted-foreground">Sort</label>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent></Select>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-xs text-muted-foreground">Search</label>
            <div className="flex gap-2">
              <Input placeholder="Username, remarks, entity…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={() => { setPage(1); refresh(); }}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Recent activity — {count} record{count === 1 ? "" : "s"}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-sm">Page {page} / {totalPages}</div>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Role</TableHead>
                  <TableHead>Action</TableHead><TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{r.actor_username ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{r.actor_role ?? "—"}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{r.action}</TableCell>
                      <TableCell className="text-xs">{r.entity_type ?? "—"}{r.entity_label ? ` · ${r.entity_label}` : ""}</TableCell>
                      <TableCell className="text-xs">{r.ip_address ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={r.status === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.remarks ?? ""}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No audit records match your filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}