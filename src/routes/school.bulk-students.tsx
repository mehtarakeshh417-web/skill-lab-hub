import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Upload, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { bulkCreateStudents } from "@/lib/students.functions";
import { listMyClassSections, saveMyClassSections } from "@/lib/classes.functions";
import {
  STUDENT_TEMPLATE_COLUMNS,
  studentCreateSchema,
  type StudentCreateInput,
  type StudentTemplateKey,
} from "@/lib/students.schema";

/** Same normalisation the backend uses, so "3"/"Class 3" and "Lily"/"Section Lily" match. */
function normClass(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  const digits = raw.match(/\d+/);
  return digits ? digits[0] : raw.replace(/[^a-z0-9]/g, "");
}

function normSection(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^section\s+/, "")
    .replace(/[^a-z0-9]/g, "");
}

export const Route = createFileRoute("/school/bulk-students")({
  head: () => ({ meta: [{ title: "Bulk Upload Students · School" }] }),
  component: BulkStudentsPage,
});

type RowError = { row: number; field?: string; message: string };

function BulkStudentsPage() {
  return (
    <AppShell requireRole="school" title="Bulk Upload Students">
      <BulkStudentsWorkspace />
    </AppShell>
  );
}

function BulkStudentsWorkspace() {
  const queryClient = useQueryClient();
  const bulkCreate = useServerFn(bulkCreateStudents);
  const fetchSections = useServerFn(listMyClassSections);
  const persistSections = useServerFn(saveMyClassSections);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<StudentCreateInput[]>([]);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [issued, setIssued] = useState<
    Array<{ fullName: string; username: string; password: string; className: string; section: string }>
  >([]);

  const { data: sectionData } = useQuery({
    queryKey: ["school-class-sections"],
    queryFn: () => fetchSections(),
    retry: false,
  });
  const sections = useMemo(() => sectionData?.sections ?? [], [sectionData]);
  const sectionByKey = useMemo(() => {
    const map = new Map<string, { teacherName: string | null }>();
    sections.forEach((s) =>
      map.set(`${normClass(s.className)}::${normSection(s.sectionName)}`, {
        teacherName: s.teacherName,
      }),
    );
    return map;
  }, [sections]);

  const allocation = useMemo(
    () =>
      parsedRows.map((row, index) => {
        const key = `${normClass(row.className)}::${normSection(row.section)}`;
        const match = row.className && row.section ? sectionByKey.get(key) : undefined;
        return {
          index,
          fullName: row.fullName,
          className: row.className ?? "",
          section: row.section ?? "",
          registered: Boolean(match),
          teacherName: match?.teacherName ?? null,
          incomplete: !row.className || !row.section,
        };
      }),
    [parsedRows, sectionByKey],
  );

  const missingSections = useMemo(() => {
    const map = new Map<string, { className: string; sectionName: string }>();
    allocation.forEach((row) => {
      if (row.registered || row.incomplete) return;
      map.set(`${normClass(row.className)}::${normSection(row.section)}`, {
        className: row.className,
        sectionName: row.section,
      });
    });
    return Array.from(map.values());
  }, [allocation]);

  const registerSections = useMutation({
    mutationFn: () =>
      persistSections({
        data: {
          sections: [
            ...sections.map((s) => ({
              className: s.className,
              sectionName: s.sectionName,
              teacherUsername: s.teacherUsername,
            })),
            ...missingSections.map((s) => ({
              className: s.className,
              sectionName: s.sectionName,
              teacherUsername: null,
            })),
          ],
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["school-class-sections"] });
      toast.success("Sections registered", {
        description: "Assign a teacher to each new section from Classes & Sections.",
      });
    },
    onError: (err) => {
      toast.error("Could not register the sections", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const mutation = useMutation({
    mutationFn: bulkCreate,
    onSuccess: async (result) => {
      if (result.errors.length) {
        setRowErrors(result.errors);
        setSuccessCount(null);
        toast.error("Upload rejected", {
          description: `${result.errors.length} row(s) had problems. No students were created.`,
        });
        return;
      }
      setSuccessCount(result.createdCount);
      setIssued(
        result.created.map((s) => ({
          fullName: s.fullName,
          username: s.username,
          password: s.generatedPassword,
          className: s.className,
          section: s.section,
        })),
      );
      setRowErrors([]);
      setParsedRows([]);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["school-students"] });
      toast.success(`${result.createdCount} students have been created successfully.`);
    },
    onError: (err) => {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  function downloadTemplate() {
    const headers = STUDENT_TEMPLATE_COLUMNS.map((c) => c.header);
    const example = STUDENT_TEMPLATE_COLUMNS.map((c) => c.example);
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    (ws["!cols"] = STUDENT_TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(16, c.header.length + 2) })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students-template.xlsx");
  }

  function downloadCredentials() {
    const rows = [
      ["Full Name", "Class", "Section", "Username", "Password"],
      ...issued.map((s) => [s.fullName, s.className, s.section, s.username, s.password]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-logins.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFileSelected(file: File) {
    setFileName(file.name);
    setSuccessCount(null);
    setIssued([]);
    setRowErrors([]);
    setParsedRows([]);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
      if (!rows.length) {
        setRowErrors([{ row: 1, message: "The file does not contain any student rows." }]);
        return;
      }
      const errors: RowError[] = [];
      const parsed: StudentCreateInput[] = [];
      rows.forEach((r, idx) => {
        const raw: Record<string, string> = {};
        for (const col of STUDENT_TEMPLATE_COLUMNS) {
          const value = (r[col.header] ?? "").toString().trim();
          raw[col.key] = value;
        }
        if (!raw.status) raw.status = "active";
        const rowNumber = idx + 2;
        const result = studentCreateSchema.safeParse(raw);
        if (!result.success) {
          for (const issue of result.error.issues) {
            const field = issue.path[0]?.toString();
            const colHeader =
              STUDENT_TEMPLATE_COLUMNS.find((c) => c.key === (field as StudentTemplateKey))?.header ?? field ?? "field";
            errors.push({ row: rowNumber, field: colHeader, message: issue.message });
          }
          return;
        }
        parsed.push(result.data);
      });
      setParsedRows(parsed);
      setRowErrors(errors);
    } catch (e) {
      setRowErrors([
        { row: 1, message: e instanceof Error ? e.message : "Could not read the uploaded Excel file." },
      ]);
    }
  }

  const canSubmit = parsedRows.length > 0 && rowErrors.length === 0 && !mutation.isPending;

  const summary = useMemo(() => {
    if (!parsedRows.length && !rowErrors.length) return null;
    return {
      total: parsedRows.length + rowErrors.length,
      valid: parsedRows.length,
      invalid: rowErrors.length,
    };
  }, [parsedRows.length, rowErrors.length]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/school"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to School dashboard
      </Link>

      <div className="rounded-3xl border border-white/20 bg-card/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-4 border-b border-border/60 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold tracking-tight">Bulk upload students</h2>
            <p className="text-sm text-muted-foreground">
              Download the Excel template, fill in student details, and re-upload to create all
              accounts in one go. Each student can immediately sign in using the username and
              password from the file. The Class and Section columns decide which teacher sees each
              student — no manual allocation is needed.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Step 1 · Download template</div>
                <div className="text-xs text-muted-foreground">Excel file with the exact column layout.</div>
              </div>
            </div>
            <Button type="button" variant="hero" size="lg" className="mt-6 w-full" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Step 2 · Upload completed file</div>
                <div className="text-xs text-muted-foreground">.xlsx or .xls, first sheet is read.</div>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFileSelected(f);
              }}
            />
            <Button
              type="button"
              variant="soft"
              size="lg"
              className="mt-6 w-full"
              onClick={() => inputRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4" /> {fileName ? "Choose different file" : "Choose Excel file"}
            </Button>
            {fileName ? (
              <div className="mt-3 truncate text-xs text-muted-foreground">Selected: {fileName}</div>
            ) : null}
          </div>
        </div>

        {summary ? (
          <div className="mt-8 rounded-2xl border border-border/60 bg-background/40 p-5">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 font-medium">
                {summary.total} rows detected
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 font-medium text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> {summary.valid} valid
              </span>
              {summary.invalid ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 font-medium text-rose-500">
                  <AlertTriangle className="h-3.5 w-3.5" /> {summary.invalid} invalid
                </span>
              ) : null}
            </div>

            {rowErrors.length ? (
              <div className="mt-5 space-y-2">
                <div className="text-sm font-semibold text-rose-500">Fix these errors and upload again:</div>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                  <ul className="space-y-1.5 text-sm">
                    {rowErrors.map((err, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-0.5 font-mono text-xs text-rose-500">
                          Row {err.row}
                        </span>
                        {err.field ? (
                          <span className="shrink-0 font-medium text-foreground/80">{err.field}:</span>
                        ) : null}
                        <span className="text-foreground/80">{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {allocation.length ? (
          <div className="mt-8 rounded-2xl border border-border/60 bg-background/40 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Automatic allocation preview
                </div>
                <h3 className="mt-1 font-display text-lg font-bold">Teacher each student will land with</h3>
              </div>
              {missingSections.length ? (
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  disabled={registerSections.isPending}
                  onClick={() => registerSections.mutate()}
                >
                  {registerSections.isPending
                    ? "Registering…"
                    : `Register ${missingSections.length} missing section${missingSections.length === 1 ? "" : "s"}`}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {allocation.map((row) => (
                <div
                  key={row.index}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{row.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {row.incomplete ? "Class / Section missing" : `${row.className} · ${row.section}`}
                    </div>
                  </div>
                  {row.incomplete ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600">
                      Fill Class and Section
                    </span>
                  ) : !row.registered ? (
                    <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">
                      Section not registered
                    </span>
                  ) : row.teacherName ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {row.teacherName}
                    </span>
                  ) : (
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-600">
                      No teacher on this section yet
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {successCount != null ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 text-emerald-600">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div>
                  <div className="font-semibold">{successCount} students have been created successfully.</div>
                  <div className="text-sm opacity-80">
                    A username and password were generated for each student. They remain viewable from the
                    roster at any time.
                  </div>
                </div>
              </div>
              {issued.length ? (
                <Button type="button" variant="soft" size="sm" onClick={downloadCredentials}>
                  <Download className="h-4 w-4" /> Download credentials (CSV)
                </Button>
              ) : null}
            </div>

            {issued.length ? (
              <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-border/50 bg-card/70">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card/95 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issued.map((s) => (
                      <tr key={s.username} className="border-t border-border/40">
                        <td className="px-4 py-3 font-medium">{s.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.className || "—"}{s.section ? ` · ${s.section}` : ""}
                        </td>
                        <td className="px-4 py-3 font-mono">{s.username}</td>
                        <td className="px-4 py-3 font-mono">{s.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button type="button" variant="soft" asChild>
            <Link to="/school">Cancel</Link>
          </Button>
          <Button
            type="button"
            variant="hero"
            size="lg"
            disabled={!canSubmit}
            onClick={() => mutation.mutate({ data: { students: parsedRows } })}
          >
            {mutation.isPending
              ? "Uploading…"
              : parsedRows.length
              ? `Upload ${parsedRows.length} students`
              : "Upload Students"}
          </Button>
        </div>
      </div>
    </div>
  );
}