"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { riskBadgeClass } from "@/lib/utils";
import { ChevronRight, FileText } from "lucide-react";
import type { AuditRecord } from "@/lib/types";

interface AuditListItemProps {
  audit: AuditRecord & { createdAt: Date | string };
}

/** Single row in the audit history list. */
export function AuditListItem({ audit }: AuditListItemProps) {
  return (
    <Link
      href={`/dashboard/audit/${audit.id}`}
      className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium truncate">{audit.fileName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(audit.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {" · "}target: <span className="font-mono">{audit.targetColumn}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <Badge className={riskBadgeClass(audit.riskLevel)}>{audit.riskLevel} Risk</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
