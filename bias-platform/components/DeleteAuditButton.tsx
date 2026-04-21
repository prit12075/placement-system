"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

interface DeleteAuditButtonProps {
  auditId: string;
}

/** Button that deletes an audit after confirmation and redirects to dashboard. */
export function DeleteAuditButton({ auditId }: DeleteAuditButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/audits/${auditId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Audit deleted." });
      router.push("/dashboard");
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Failed to delete audit." });
      setLoading(false);
    }
  }

  return (
    <Button
      variant={confirming ? "destructive" : "outline"}
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4 mr-1.5" />
      {confirming ? "Confirm delete?" : "Delete"}
    </Button>
  );
}
