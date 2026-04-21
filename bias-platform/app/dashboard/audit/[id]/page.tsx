import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BiasScoreCard } from "@/components/BiasScoreCard";
import { MetricsTable } from "@/components/MetricsTable";
import { RecommendationsPanel } from "@/components/RecommendationsPanel";
import { DataProfileChart } from "@/components/DataProfileChart";
import { DeleteAuditButton } from "@/components/DeleteAuditButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { AuditRecord } from "@/lib/types";

/** Audit detail page — renders the full bias analysis results for one audit. */
export default async function AuditDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const audit = await prisma.audit.findUnique({ where: { id: params.id } });
  if (!audit || audit.userId !== userId) notFound();

  const record = audit as unknown as AuditRecord & { createdAt: Date };

  return (
    <div className="space-y-8 max-w-5xl" id="audit-report">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to audits
          </Link>
          <h1 className="text-3xl font-bold tracking-tight truncate max-w-xl">
            {record.fileName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audited on{" "}
            {new Date(record.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">Target: {record.targetColumn}</Badge>
            {record.protectedCols.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <ExportPdfButton auditId={audit.id} />
          <DeleteAuditButton auditId={audit.id} />
        </div>
      </div>

      <BiasScoreCard riskLevel={record.riskLevel} metrics={record.resultsJson.metrics} />

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">Fairness Metrics by Attribute</h2>
        <MetricsTable metrics={record.resultsJson.metrics} />
      </div>

      <Separator />

      <RecommendationsPanel
        recommendations={record.resultsJson.recommendations}
        riskLevel={record.riskLevel}
      />

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">Data Profile</h2>
        <DataProfileChart profile={record.profileJson} />
      </div>
    </div>
  );
}
