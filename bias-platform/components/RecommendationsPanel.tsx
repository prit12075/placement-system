import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import { riskColor } from "@/lib/utils";

interface RecommendationsPanelProps {
  recommendations: string[];
  riskLevel: string;
}

/** Panel listing actionable bias mitigation recommendations. */
export function RecommendationsPanel({ recommendations, riskLevel }: RecommendationsPanelProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recommended Fixes</h2>
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex items-center gap-3 text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>No immediate interventions required. Continue monitoring for drift.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <Lightbulb className={`h-5 w-5 shrink-0 mt-0.5 ${riskColor(riskLevel)}`} />
                <p className="text-sm leading-relaxed">{rec}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
