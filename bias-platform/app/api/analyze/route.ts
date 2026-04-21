import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { DataProfile, AnalysisResult } from "@/lib/types";

const schema = z.object({
  filePath: z.string().min(1),
  targetColumn: z.string().min(1),
  protectedColumns: z.array(z.string()).min(1),
  profile: z.unknown(),
  fileName: z.string().min(1),
});

/** POST /api/analyze — calls the Python microservice, stores results, returns auditId. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { filePath, targetColumn, protectedColumns, profile, fileName } = parsed.data;

  const pythonUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

  let analysisResult: AnalysisResult;
  try {
    const res = await fetch(`${pythonUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_path: filePath,
        target_column: targetColumn,
        protected_columns: protectedColumns,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Python service error:", err);
      return NextResponse.json(
        { error: "Bias analysis failed." },
        { status: 502 }
      );
    }

    const raw = await res.json();
    // Map snake_case response to camelCase
    analysisResult = {
      riskLevel: raw.risk_level,
      metrics: raw.metrics.map(
        (m: {
          attribute: string;
          demographic_parity_diff: number;
          equalized_odds_diff: number;
          disparate_impact_ratio: number;
          chi_square_p_value: number;
          flagged: boolean;
        }) => ({
          attribute: m.attribute,
          demographicParityDiff: m.demographic_parity_diff,
          equalizedOddsDiff: m.equalized_odds_diff,
          disparateImpactRatio: m.disparate_impact_ratio,
          chiSquarePValue: m.chi_square_p_value,
          flagged: m.flagged,
        })
      ),
      recommendations: raw.recommendations,
    };
  } catch (err) {
    console.error("Python service unreachable:", err);
    return NextResponse.json(
      { error: "Analysis service unavailable." },
      { status: 503 }
    );
  }

  const userId = (session.user as { id: string }).id;

  const audit = await prisma.audit.create({
    data: {
      userId,
      fileName,
      targetColumn,
      protectedCols: protectedColumns,
      profileJson: profile as object,
      resultsJson: analysisResult as unknown as object,
      riskLevel: analysisResult.riskLevel,
    },
  });

  return NextResponse.json({ auditId: audit.id });
}
