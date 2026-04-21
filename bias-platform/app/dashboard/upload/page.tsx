"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataProfileChart } from "@/components/DataProfileChart";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataProfile } from "@/lib/types";

type Step = "upload" | "configure" | "analyzing";

/** Upload page — handles CSV drag-and-drop, column configuration, and analysis trigger. */
export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string>("");
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [protectedCols, setProtectedCols] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      if (f.size > 50 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File exceeds 50 MB limit." });
        return;
      }
      setFile(f);
      setUploading(true);

      const form = new FormData();
      form.append("file", f);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      setUploading(false);

      if (!res.ok) {
        toast({ variant: "destructive", title: "Upload failed. Please try again." });
        return;
      }

      const data = await res.json();
      setUploadedPath(data.filePath);
      setProfile(data.profile);
      setStep("configure");
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: uploading,
  });

  function toggleProtected(col: string) {
    setProtectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }

  async function runAnalysis() {
    if (!targetColumn) {
      toast({ variant: "destructive", title: "Please select a target column." });
      return;
    }
    if (protectedCols.length === 0) {
      toast({ variant: "destructive", title: "Select at least one protected attribute." });
      return;
    }

    setStep("analyzing");

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath: uploadedPath,
        targetColumn,
        protectedColumns: protectedCols,
        profile,
        fileName: file!.name,
      }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Analysis failed. Please try again." });
      setStep("configure");
      return;
    }

    const { auditId } = await res.json();
    router.push(`/dashboard/audit/${auditId}`);
  }

  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-xl font-semibold">Running bias analysis…</p>
          <p className="text-muted-foreground mt-1">
            This may take 5–15 seconds depending on dataset size.
          </p>
        </div>
      </div>
    );
  }

  if (step === "configure" && profile) {
    const columnNames = profile.columns.map((c) => c.name);

    return (
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configure Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Identify the outcome column and protected demographic attributes.
          </p>
        </div>

        <div className="rounded-xl border p-5 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{file?.name}</span>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {profile.rowCount.toLocaleString()} rows · {profile.columnCount} columns
          </p>
        </div>

        <div className="space-y-2">
          <Label>Target column (outcome / label)</Label>
          <Select onValueChange={setTargetColumn} value={targetColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select target column…" />
            </SelectTrigger>
            <SelectContent>
              {columnNames.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The column your model predicts (e.g. hired, approved, granted).
          </p>
        </div>

        <div className="space-y-3">
          <Label>Protected attributes</Label>
          <p className="text-xs text-muted-foreground">
            Columns representing demographic groups (e.g. gender, race, age_group).
          </p>
          <div className="flex flex-wrap gap-2">
            {columnNames
              .filter((c) => c !== targetColumn)
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleProtected(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    protectedCols.includes(c)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {c}
                  {protectedCols.includes(c) && (
                    <X className="inline ml-1 h-3 w-3" />
                  )}
                </button>
              ))}
          </div>
          {protectedCols.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {protectedCols.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DataProfileChart profile={profile} />

        <Button onClick={runAnalysis} size="lg" className="w-full">
          Run Bias Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Dataset</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file to begin auditing it for bias. Max 50 MB.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="font-medium">Uploading and profiling…</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-medium">
              {isDragActive ? "Drop the CSV here" : "Drag & drop a CSV file"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </>
        )}
      </div>
    </div>
  );
}
