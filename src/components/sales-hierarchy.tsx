import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { listSalesReps } from "@/lib/sales-reps.functions";
import { useAuth } from "@/lib/auth";
import { ChevronDown, ChevronRight, ShieldCheck, User, School2 } from "lucide-react";
import type { SalesRepRecord } from "@/lib/sales-reps.server";

type Node = SalesRepRecord & { children: Node[] };

function buildTree(reps: SalesRepRecord[]): Node[] {
  const map = new Map<string, Node>();
  reps.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: Node[] = [];
  map.forEach((node) => {
    if (node.reportingManagerId && map.has(node.reportingManagerId)) {
      map.get(node.reportingManagerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function matches(node: Node, q: string): boolean {
  const s = q.toLowerCase();
  if (
    node.fullName.toLowerCase().includes(s) ||
    node.username.toLowerCase().includes(s) ||
    node.employeeId.toLowerCase().includes(s)
  ) return true;
  return node.children.some((c) => matches(c, s));
}

export function SalesHierarchy() {
  const { session } = useAuth();
  const fetchReps = useServerFn(listSalesReps);
  const { data, isLoading } = useQuery({
    queryKey: ["sales-reps", "list"],
    queryFn: () => fetchReps(),
    enabled: Boolean(session),
    retry: false,
  });
  const [q, setQ] = useState("");
  const tree = useMemo(() => buildTree(data?.reps ?? []), [data]);
  const filtered = q ? tree.filter((n) => matches(n, q)) : tree;

  return (
    <div className="rounded-3xl border border-white/20 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Sales hierarchy</h2>
          <p className="text-sm text-muted-foreground">
            {data?.counts.total ?? 0} representatives · {data?.counts.active ?? 0} active
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, username, or employee ID"
          className="md:w-80"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> Admin
          <span className="ml-auto text-xs text-muted-foreground">Root reporting authority</span>
        </div>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading hierarchy…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No sales representatives yet.</div>
        ) : (
          <ul className="mt-2 space-y-1">
            {filtered.map((n) => (
              <TreeItem key={n.id} node={n} depth={0} defaultOpen={Boolean(q)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TreeItem({ node, depth, defaultOpen }: { node: Node; depth: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen || depth < 1);
  const hasChildren = node.children.length > 0;
  return (
    <li className="relative">
      <div
        className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-accent/40"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="inline-block h-6 w-6" />
        )}
        <User className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate">
            <span className="font-semibold">{node.fullName}</span>
            <span className="ml-2 text-xs text-muted-foreground">@{node.username}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{node.designation}</span>
            {node.employeeId && <span>· {node.employeeId}</span>}
            <span>· Reports to {node.reportingManagerName}</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <School2 className="h-3.5 w-3.5" /> {node.schoolsCount}
        </span>
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            node.status === "active"
              ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
              : "border border-muted-foreground/25 bg-muted text-muted-foreground"
          }`}
        >
          {node.status}
        </span>
      </div>
      {hasChildren && open && (
        <ul className="space-y-1">
          {node.children.map((c) => (
            <TreeItem key={c.id} node={c} depth={depth + 1} defaultOpen={defaultOpen} />
          ))}
        </ul>
      )}
    </li>
  );
}