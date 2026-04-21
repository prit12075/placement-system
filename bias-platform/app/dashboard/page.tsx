import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AuditListItem } from "@/components/AuditListItem";
import { PlusCircle, ShieldAlert } from "lucide-react";
import type { AuditRecord } from "@/lib/types";

/** Dashboard home — lists all past audits for the logged-in user. */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  const audits = await prisma.audit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit History</h1>
          <p className="text-muted-foreground mt-1">
            Review past bias analyses or start a new one.
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center gap-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold text-lg">No audits yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Upload a CSV dataset to run your first bias analysis.
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button variant="outline">Upload a dataset</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => (
            <AuditListItem
              key={audit.id}
              audit={audit as unknown as AuditRecord & { createdAt: Date }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
