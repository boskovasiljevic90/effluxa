import * as XLSX from "xlsx";
import { parse as parseCsvSync } from "csv-parse/sync";

export type RowObject = Record<string, any>;

function normalizeFilename(name: string) {
  return (name || "").toLowerCase().trim();
}

/**
 * Parses CSV/TSV/XLSX into array of row objects (keys = header names).
 */
export async function parseTabular(buffer: Buffer, filename: string): Promise<RowObject[]> {
  const name = normalizeFilename(filename);

  // CSV / TSV
  if (name.endsWith(".csv") || name.endsWith(".tsv")) {
    const text = buffer.toString("utf8");
    const records: any[] = parseCsvSync(text, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      delimiter: name.endsWith(".tsv") ? "\t" : ",",
      relax_column_count: true,
      trim: true,
    });
    return (records || []).map((r) => (r && typeof r === "object" ? r : {}));
  }

  // XLSX / XLS
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];

  // defval keeps empty cells as null so we can detect missing values
  const rows = XLSX.utils.sheet_to_json<RowObject>(ws, { defval: null });
  return rows || [];
}
