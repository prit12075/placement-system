/** Column type inferred from the dataset. */
export type ColumnType = "numeric" | "categorical" | "date" | "unknown";

/** Per-column statistics from data profiling. */
export interface ColumnProfile {
  name: string;
  type: ColumnType;
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  /** Frequency map for categorical columns (top 20 values). */
  valueCounts?: Record<string, number>;
  /** Min/max for numeric columns. */
  min?: number;
  max?: number;
  mean?: number;
}

/** Full profile returned after CSV upload. */
export interface DataProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
}

/** Fairness metrics for a single protected attribute. */
export interface AttributeMetrics {
  attribute: string;
  demographicParityDiff: number;
  equalizedOddsDiff: number;
  disparateImpactRatio: number;
  chiSquarePValue: number;
  flagged: boolean;
}

/** Full analysis result returned by the Python microservice. */
export interface AnalysisResult {
  riskLevel: "Low" | "Medium" | "High";
  metrics: AttributeMetrics[];
  recommendations: string[];
}

/** Audit record as stored and returned from the API. */
export interface AuditRecord {
  id: string;
  fileName: string;
  targetColumn: string;
  protectedCols: string[];
  profileJson: DataProfile;
  resultsJson: AnalysisResult;
  riskLevel: string;
  createdAt: string;
}
