import { cn, fmtPct, fmtRatio } from "@/lib/utils";
import type { AttributeMetrics } from "@/lib/types";

interface MetricsTableProps {
  metrics: AttributeMetrics[];
}

function cellClass(value: number, threshold: number, invert = false): string {
  const bad = invert ? value > threshold : value < threshold;
  if (bad) return "bg-red-50 text-red-700 font-semibold";
  if (Math.abs(value - threshold) < 0.05) return "bg-amber-50 text-amber-700";
  return "bg-green-50 text-green-700";
}

/** Table showing per-attribute fairness metrics with red/amber/green cell coloring. */
export function MetricsTable({ metrics }: MetricsTableProps) {
  if (metrics.length === 0) {
    return <p className="text-muted-foreground text-sm">No metrics available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Attribute</th>
            <th className="px-4 py-3 text-center font-semibold">
              <span title="Difference in positive outcome rate between groups. Threshold: &lt;0.1">
                Dem. Parity Diff ↓
              </span>
            </th>
            <th className="px-4 py-3 text-center font-semibold">
              <span title="Difference in true/false positive rates. Threshold: &lt;0.1">
                Eq. Odds Diff ↓
              </span>
            </th>
            <th className="px-4 py-3 text-center font-semibold">
              <span title="Ratio of positive rates. Flagged if &lt;0.8 (80% rule)">
                Disparate Impact ↑
              </span>
            </th>
            <th className="px-4 py-3 text-center font-semibold">
              <span title="Chi-square test p-value. &lt;0.05 = statistically significant disparity">
                χ² p-value
              </span>
            </th>
            <th className="px-4 py-3 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.attribute} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-mono font-medium">{m.attribute}</td>
              <td className={cn("px-4 py-3 text-center", cellClass(m.demographicParityDiff, 0.1, true))}>
                {fmtPct(m.demographicParityDiff)}
              </td>
              <td className={cn("px-4 py-3 text-center", cellClass(m.equalizedOddsDiff, 0.1, true))}>
                {fmtPct(m.equalizedOddsDiff)}
              </td>
              <td className={cn("px-4 py-3 text-center", cellClass(m.disparateImpactRatio, 0.8))}>
                {fmtRatio(m.disparateImpactRatio)}
              </td>
              <td className={cn("px-4 py-3 text-center", cellClass(m.chiSquarePValue, 0.05))}>
                {m.chiSquarePValue.toFixed(4)}
              </td>
              <td className="px-4 py-3 text-center">
                {m.flagged ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                    Flagged
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 border border-green-200">
                    Pass
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
