import { createReadStream } from "fs";
import { createInterface } from "readline";
import type { DataProfile, ColumnProfile, ColumnType } from "@/lib/types";

/** Infers column type from a sample of string values. */
function inferType(samples: string[]): ColumnType {
  const nonEmpty = samples.filter((s) => s !== "" && s !== "null" && s !== "NA");
  if (nonEmpty.length === 0) return "unknown";

  const numericCount = nonEmpty.filter((s) => !isNaN(Number(s))).length;
  if (numericCount / nonEmpty.length > 0.85) return "numeric";

  const dateRe = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
  const dateCount = nonEmpty.filter((s) => dateRe.test(s)).length;
  if (dateCount / nonEmpty.length > 0.7) return "date";

  return "categorical";
}

/** Reads a CSV file and returns a DataProfile with per-column statistics. */
export async function profileCsv(filePath: string): Promise<DataProfile> {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });

  let headers: string[] = [];
  const rows: string[][] = [];
  let firstLine = true;

  for await (const line of rl) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (firstLine) {
      headers = cells;
      firstLine = false;
    } else {
      if (cells.length === headers.length) rows.push(cells);
    }
    // Cap processing at 50k rows for performance
    if (rows.length >= 50_000) break;
  }

  const rowCount = rows.length;

  const columns: ColumnProfile[] = headers.map((name, idx) => {
    const values = rows.map((r) => r[idx] ?? "");
    const missing = values.filter((v) => v === "" || v === "null" || v === "NA" || v === "N/A");
    const missingCount = missing.length;
    const missingPct = rowCount > 0 ? missingCount / rowCount : 0;

    const nonEmpty = values.filter((v) => v !== "" && v !== "null" && v !== "NA" && v !== "N/A");
    const unique = new Set(nonEmpty);
    const uniqueCount = unique.size;

    const sample = nonEmpty.slice(0, 500);
    const type = inferType(sample);

    const col: ColumnProfile = { name, type, missingCount, missingPct, uniqueCount };

    if (type === "categorical") {
      const freq: Record<string, number> = {};
      for (const v of nonEmpty) freq[v] = (freq[v] ?? 0) + 1;
      const top20 = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
      col.valueCounts = Object.fromEntries(top20);
    }

    if (type === "numeric") {
      const nums = nonEmpty.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        col.min = Math.min(...nums);
        col.max = Math.max(...nums);
        col.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      }
    }

    return col;
  });

  return { rowCount, columnCount: headers.length, columns };
}
