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