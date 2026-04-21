"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportPdfButtonProps {
  auditId: string;
}

/** Button that triggers browser print-to-PDF of the audit report. */
export function ExportPdfButton({ auditId: _auditId }: ExportPdfButtonProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Download className="h-4 w-4 mr-1.5" />
      Export PDF
    </Button>
  );
}
