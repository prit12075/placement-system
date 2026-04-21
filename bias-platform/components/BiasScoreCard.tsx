import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskBadgeClass, riskColor } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import type { AttributeMetrics } from "@/lib/types";

interface BiasScoreCardProps {
  riskLevel: string;
  metrics: AttributeMetrics[];
}

const riskIcons = {
  Low: ShieldCheck,
  Medium: ShieldAlert,
  High: ShieldX,
};

/** Summary card showing overall bias risk level and flagged attribute count. */
export function BiasScoreCard({ riskLevel, metrics }: BiasScoreCardProps) {
  const flagged = metrics.filter((m) => m.flagged).length;
  const Icon = riskIcons[riskLevel as keyof typeof riskIcons] ?? ShieldAlert;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Overall Bias Risk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Icon className={`h-10 w-10 ${riskColor(riskLevel)}`} />
            <div>
              <span
                className={`text-4xl font-bold ${riskColor(riskLevel)}`}
              >
                {riskLevel}
              </span>
              <div
                className={`inline-flex ml-3 items-center rounded-full border px-3 py-0.5 text-sm font-semibold ${riskBadgeClass(riskLevel)}`}
              >
                {riskLevel} Risk
              </div>
            </div>
          </div>
          <div className="border-l pl-6">
            <p className="text-3xl font-bold">{flagged}/{metrics.length}</p>
            <p className="text-sm text-muted-foreground">attributes flagged</p>
          </div>
          <div className="border-l pl-6">
            <p className="text-3xl font-bold">{metrics.length}</p>
            <p className="text-sm text-muted-foreground">protected attributes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
