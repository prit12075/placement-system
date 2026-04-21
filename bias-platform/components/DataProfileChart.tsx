"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataProfile, ColumnProfile } from "@/lib/types";

interface DataProfileChartProps {
  profile: DataProfile;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: "#3b82f6",
  categorical: "#8b5cf6",
  date: "#10b981",
  unknown: "#6b7280",
};

/** Renders bar charts for the dataset profile — missing-value rates and value distributions. */
export function DataProfileChart({ profile }: DataProfileChartProps) {
  const missingData = profile.columns.map((c) => ({
    name: c.name,
    missing: parseFloat((c.missingPct * 100).toFixed(1)),
    type: c.type,
  }));

  const catColumns = profile.columns.filter(
    (c) => c.type === "categorical" && c.valueCounts && Object.keys(c.valueCounts).length > 0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Missing Values per Column (%)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {profile.rowCount.toLocaleString()} rows · {profile.columnCount} columns
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={missingData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Missing"]} />
              <Bar dataKey="missing" radius={[3, 3, 0, 0]}>
                {missingData.map((d, i) => (
                  <Cell key={i} fill={TYPE_COLORS[d.type] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
                {type}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {catColumns.slice(0, 4).map((col) => (
        <CategoricalChart key={col.name} column={col} />
      ))}
    </div>
  );
}

/** Bar chart for value distribution of a single categorical column. */
function CategoricalChart({ column }: { column: ColumnProfile }) {
  const data = Object.entries(column.valueCounts ?? {})
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Distribution:{" "}
          <span className="font-mono text-sm text-muted-foreground">{column.name}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {column.uniqueCount} unique values
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
