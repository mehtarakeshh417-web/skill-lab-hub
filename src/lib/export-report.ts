import * as XLSX from "xlsx";

export type ExportColumn<T> = { header: string; value: (row: T) => string | number };

function toMatrix<T>(rows: T[], columns: ExportColumn<T>[]) {
  return [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => c.value(r) ?? ""))];
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const matrix = toMatrix(rows, columns);
  const csv = matrix
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function exportXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  summary?: Array<[string, string | number]>,
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(toMatrix(rows, columns));
  ws["!cols"] = columns.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  if (summary && summary.length) {
    const sws = XLSX.utils.aoa_to_sheet([["Metric", "Value"], ...summary]);
    sws["!cols"] = [{ wch: 32 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, sws, "Summary");
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${filename}.xlsx`,
  );
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Opens a print-ready document so the browser's own "Save as PDF" produces the
 * export. Keeps the bundle free of a heavyweight PDF dependency.
 */
export function exportPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  options?: { title?: string; subtitle?: string; summary?: Array<[string, string | number]> },
) {
  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) return false;
  const head = columns.map((c) => `<th>${esc(c.header)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(c.value(r))}</td>`).join("")}</tr>`)
    .join("");
  const summary = (options?.summary ?? [])
    .map(([k, v]) => `<li><span>${esc(k)}</span><strong>${esc(v)}</strong></li>`)
    .join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(options?.title ?? filename)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f172a; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: -0.02em; }
  p.sub { margin: 0 0 18px; color: #64748b; font-size: 12px; }
  ul.summary { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; padding: 0; margin: 0 0 18px; }
  ul.summary li { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
  ul.summary span { color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9px; color: #475569; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; }
  tr:nth-child(even) td { background: #f8fafc; }
</style></head><body>
<h1>${esc(options?.title ?? filename)}</h1>
<p class="sub">${esc(options?.subtitle ?? `Generated ${new Date().toLocaleString()}`)}</p>
${summary ? `<ul class="summary">${summary}</ul>` : ""}
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
  return true;
}