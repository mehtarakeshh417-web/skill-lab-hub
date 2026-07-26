import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchAuditTrail, fetchAuditFacets } from "@/lib/audit.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportXlsx, exportPdf, type ExportColumn } from "@/lib/export-report";
import { friendlyError } from "@/lib/messages";
import { toast } from "sonner";
import {
  ScrollText,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Eye,
} from "lucide-react";

type AuditItem = Awaited<ReturnType<typeof fetchAuditTrail>>["rows"][number];

type Facets = {
  modules: string[];
  entityTypes: string[];
  actorRoles: string[];
  targetRoles: string[];
  actionTypes: string[];
};

const EMPTY_FACETS: Facets = {
  modules: [],
  entityTypes: [],
  actorRoles: [],
  targetRoles: [],
  actionTypes: [],
};

const PAGE_SIZES = [25, 50, 100, 200];

const prettify = (v: string) => v.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function statusTone(status: string | null) {
  if (status === "failure")
    return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
}

function typeTone(type: string) {
  if (/delete|reject|failed|block/i.test(type))
    return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300";
  if (/create|approval|unblock/i.test(type))
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  if (/password|security/i.test(type))
    return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  if (/login|logout/i.test(type))
    return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function jsonPreview(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type FilterState = {
  search: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  actorSearch: string;
  targetSearch: string;
  actorRole: string;
  targetRole: string;
  entityType: string;
  module: string;
  action: string;
  status: string;
  sort: "newest" | "oldest";
};

const INITIAL_FILTERS: FilterState = {
  search: "",
  dateFrom: "",
  dateTo: "",
  timeFrom: "",
  timeTo: "",
  actorSearch: "",
  targetSearch: "",
  actorRole: "all",
  targetRole: "all",
  entityType: "all",
  module: "all",
  action: "all",
  status: "all",
  sort: "newest",
};

const inputCls =
  "h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm shadow-inner-soft focus-visible:ring-2 focus-visible:ring-primary/50";

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/80 px-4 text-sm">
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {prettify(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AuditTrailWorkspace() {
  const runFetch = useServerFn(fetchAuditTrail);
  const runFacets = useServerFn(fetchAuditFacets);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [applied, setApplied] = useState<FilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [rows, setRows] = useState<AuditItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<AuditItem | null>(null);

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runFetch({
        data: {
          search: applied.search || null,
          dateFrom: applied.dateFrom || null,
          dateTo: applied.dateTo || null,
          timeFrom: applied.timeFrom || null,
          timeTo: applied.timeTo || null,
          actorSearch: applied.actorSearch || null,
          targetSearch: applied.targetSearch || null,
          actorRole: applied.actorRole,
          targetRole: applied.targetRole,
          entityType: applied.entityType,
          module: applied.module,
          action: applied.action,
          status: applied.status,
          sort: applied.sort,
          page,
          pageSize,
        },
      });
      setRows(res.rows);
      setCount(res.count);
    } catch (e) {
      setError(friendlyError(e));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [runFetch, applied, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    runFacets({})
      .then((f) => setFacets({ ...EMPTY_FACETS, ...f }))
      .catch(() => setFacets(EMPTY_FACETS));
  }, [runFacets]);

  const activeFilterCount = useMemo(
    () =>
      (Object.keys(INITIAL_FILTERS) as Array<keyof FilterState>).filter(
        (k) => k !== "sort" && applied[k] !== INITIAL_FILTERS[k],
      ).length,
    [applied],
  );

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const failures = rows.filter((r) => r.status === "failure").length;

  const columns: ExportColumn<AuditItem>[] = useMemo(
    () => [
      { header: "Audit ID", value: (r) => (r.auditRef ? `AUD-${String(r.auditRef).padStart(6, "0")}` : r.id) },
      { header: "Date", value: (r) => fmtDate(r.createdAt).date },
      { header: "Time", value: (r) => fmtDate(r.createdAt).time },
      { header: "Performed by", value: (r) => r.actorUsername ?? "System" },
      { header: "Performer role", value: (r) => prettify(r.actorRole ?? "system") },
      { header: "Affected entity", value: (r) => r.entityLabel ?? "—" },
      { header: "Affected role", value: (r) => (r.targetRole ? prettify(r.targetRole) : "—") },
      { header: "Entity type", value: (r) => (r.entityType ? prettify(r.entityType) : "—") },
      { header: "Module", value: (r) => r.module },
      { header: "Action", value: (r) => r.actionLabel },
      { header: "Action type", value: (r) => r.actionType },
      { header: "Previous value", value: (r) => jsonPreview(r.previousValue) },
      { header: "New value", value: (r) => jsonPreview(r.newValue) },
      { header: "Status", value: (r) => (r.status === "failure" ? "Failure" : "Success") },
      { header: "IP address", value: (r) => r.ipAddress ?? "—" },
      { header: "Device / browser", value: (r) => r.userAgent ?? "—" },
      { header: "Remarks", value: (r) => r.remarks ?? "—" },
    ],
    [],
  );

  async function exportAll(kind: "xlsx" | "pdf") {
    try {
      const res = await runFetch({
        data: {
          search: applied.search || null,
          dateFrom: applied.dateFrom || null,
          dateTo: applied.dateTo || null,
          timeFrom: applied.timeFrom || null,
          timeTo: applied.timeTo || null,
          actorSearch: applied.actorSearch || null,
          targetSearch: applied.targetSearch || null,
          actorRole: applied.actorRole,
          targetRole: applied.targetRole,
          entityType: applied.entityType,
          module: applied.module,
          action: applied.action,
          status: applied.status,
          sort: applied.sort,
          page: 1,
          pageSize: 200,
        },
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const summary: Array<[string, string | number]> = [
        ["Records exported", res.rows.length],
        ["Total matching records", res.count],
        ["Filters applied", activeFilterCount],
        ["Generated", new Date().toLocaleString()],
      ];
      if (!res.rows.length) {
        toast.info("Nothing to export", { description: "No activity matches the current filters." });
        return;
      }
      if (kind === "xlsx") {
        exportXlsx(res.rows, columns, `avartan-audit-trail-${stamp}`, summary);
        toast.success("Excel export ready");
      } else {
        const ok = exportPdf(res.rows, columns, `avartan-audit-trail-${stamp}`, {
          title: "Avartan Skill Lab — Audit Trail",
          subtitle: `Generated ${new Date().toLocaleString()} · ${res.rows.length} of ${res.count} records`,
          summary,
        });
        if (ok) toast.success("PDF view opened", { description: "Choose “Save as PDF” in the print dialog." });
        else toast.error("Please allow pop-ups to create the PDF.");
      }
    } catch (e) {
      toast.error("Export failed", { description: friendlyError(e) });
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Audit trail</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Every significant action across the portal — account changes, approvals, sign-ins and
                bulk operations — recorded permanently with who did it, when, and from where.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-5"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-5"
              onClick={() => void exportAll("xlsx")}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button type="button" className="h-12 rounded-xl px-5" onClick={() => void exportAll("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Records in view", value: rows.length, icon: ScrollText },
            { label: "Total matching records", value: count, icon: ShieldCheck },
            { label: "Failures in view", value: failures, icon: AlertTriangle },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4"
            >
              <s.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {s.label}
                </p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setApplied(filters);
                }
              }}
              placeholder="Search by person, entity, action, remark or IP address…"
              className={`${inputCls} pl-11`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.sort}
              onValueChange={(v) => {
                const next = { ...filters, sort: v as "newest" | "oldest" };
                setFilters(next);
                setApplied(next);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-12 w-[170px] rounded-xl border-border/70 bg-background/80 px-4 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-5"
              onClick={() => setShowFilters((s) => !s)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl px-6"
              onClick={() => {
                setPage(1);
                setApplied(filters);
              }}
            >
              Apply
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-5 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                From date
              </Label>
              <Input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                To date
              </Label>
              <Input type="date" value={filters.dateTo} onChange={(e) => set("dateTo", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                From time
              </Label>
              <Input type="time" value={filters.timeFrom} onChange={(e) => set("timeFrom", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                To time
              </Label>
              <Input type="time" value={filters.timeTo} onChange={(e) => set("timeTo", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Performed by
              </Label>
              <Input
                value={filters.actorSearch}
                onChange={(e) => set("actorSearch", e.target.value)}
                placeholder="Username"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Affected user / entity
              </Label>
              <Input
                value={filters.targetSearch}
                onChange={(e) => set("targetSearch", e.target.value)}
                placeholder="Name or label"
                className={inputCls}
              />
            </div>
            <FilterSelect label="Performer role" value={filters.actorRole} onChange={(v) => set("actorRole", v)} options={facets.actorRoles} allLabel="All roles" />
            <FilterSelect label="Affected role" value={filters.targetRole} onChange={(v) => set("targetRole", v)} options={facets.targetRoles} allLabel="All affected roles" />
            <FilterSelect label="Entity type" value={filters.entityType} onChange={(v) => set("entityType", v)} options={facets.entityTypes} allLabel="All entity types" />
            <FilterSelect label="Module" value={filters.module} onChange={(v) => set("module", v)} options={facets.modules} allLabel="All modules" />
            <FilterSelect label="Action type" value={filters.action} onChange={(v) => set("action", v)} options={facets.actionTypes} allLabel="All actions" />
            <FilterSelect label="Status" value={filters.status} onChange={(v) => set("status", v)} options={["success", "failure"]} allLabel="All statuses" />

            <div className="flex items-end gap-3 sm:col-span-2 xl:col-span-4">
              <Button
                type="button"
                className="h-12 rounded-xl px-8"
                onClick={() => {
                  setPage(1);
                  setApplied(filters);
                }}
              >
                Apply filters
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-12 rounded-xl px-6"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setApplied(INITIAL_FILTERS);
                  setPage(1);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Reset all
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-elegant backdrop-blur-xl">
        {error && (
          <div className="border-b border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm font-medium text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-background/60">
                {["Audit ID", "Date & time", "Performed by", "Action", "Affected entity", "Module", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    Loading activity…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="font-display text-lg font-semibold">No activity found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try widening the date range or clearing the filters.
                    </p>
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => {
                  const t = fmtDate(r.createdAt);
                  return (
                    <tr key={r.id} className="border-b border-border/40 transition-colors hover:bg-primary/5">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-muted-foreground">
                        {r.auditRef ? `AUD-${String(r.auditRef).padStart(6, "0")}` : r.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{t.date}</p>
                        <p className="text-xs text-muted-foreground">{t.time}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{r.actorUsername ?? "System"}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {prettify(r.actorRole ?? "system")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{r.actionLabel}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeTone(r.actionType)}`}
                        >
                          {r.actionType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{r.entityLabel ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.targetRole ? prettify(r.targetRole) : r.entityType ? prettify(r.entityType) : "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
                          {r.module}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(r.status)}`}
                        >
                          {r.status === "failure" ? "Failure" : "Success"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setDetail(r)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {count} record{count === 1 ? "" : "s"}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-border/70 bg-background/80 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {detail?.actionLabel ?? "Audit entry"}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeTone(detail.actionType)}`}>
                  {detail.actionType}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(detail.status)}`}>
                  {detail.status === "failure" ? "Failure" : "Success"}
                </span>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
                  {detail.module}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Audit ID", detail.auditRef ? `AUD-${String(detail.auditRef).padStart(6, "0")}` : detail.id],
                  ["Date", fmtDate(detail.createdAt).date],
                  ["Time", fmtDate(detail.createdAt).time],
                  ["Performed by", detail.actorUsername ?? "System"],
                  ["Performer role", prettify(detail.actorRole ?? "system")],
                  ["Affected entity", detail.entityLabel ?? "—"],
                  ["Affected role", detail.targetRole ? prettify(detail.targetRole) : "—"],
                  ["Entity type", detail.entityType ? prettify(detail.entityType) : "—"],
                  ["Entity reference", detail.entityId ?? "—"],
                  ["Action key", detail.action],
                  ["IP address", detail.ipAddress ?? "Not available"],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {k}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold">{v as string}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Browser / device
                </p>
                <p className="mt-1 break-words text-sm">{detail.userAgent ?? "Not available"}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Previous value
                  </p>
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs">
                    {jsonPreview(detail.previousValue)}
                  </pre>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    New value
                  </p>
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs">
                    {jsonPreview(detail.newValue)}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Remarks
                </p>
                <p className="mt-1 text-sm">{detail.remarks ?? "—"}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Audit records are permanent and cannot be edited or removed from the portal.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
