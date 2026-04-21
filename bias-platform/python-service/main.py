"""
FastAPI microservice — bias analysis endpoint.

Start with:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from bias_engine import run_analysis, AttributeResult

app = FastAPI(title="Bias Analysis Service", version="1.0.0")

# Allow requests from the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Request / Response models                                                     #
# --------------------------------------------------------------------------- #

class AnalyzeRequest(BaseModel):
    file_path: str = Field(..., description="Absolute path to the uploaded CSV file")
    target_column: str = Field(..., description="Name of the outcome/label column")
    protected_columns: List[str] = Field(..., description="Columns representing demographic groups")


class MetricResponse(BaseModel):
    attribute: str
    demographic_parity_diff: float
    equalized_odds_diff: float
    disparate_impact_ratio: float
    chi_square_p_value: float
    flagged: bool


class AnalyzeResponse(BaseModel):
    risk_level: str
    metrics: List[MetricResponse]
    recommendations: List[str]


# --------------------------------------------------------------------------- #
# Endpoints                                                                     #
# --------------------------------------------------------------------------- #

@app.get("/health")
def health() -> dict:
    """Liveness check."""
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Run bias analysis on a CSV file.

    Returns fairness metrics per protected attribute and an overall risk level.
    """
    # Basic path traversal guard — only allow files inside the upload dir
    upload_dir = os.path.realpath(os.environ.get("UPLOAD_DIR", "./uploads"))
    real_path = os.path.realpath(req.file_path)
    if not real_path.startswith(upload_dir):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    if not os.path.isfile(real_path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        result = run_analysis(real_path, req.target_column, req.protected_columns)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    return AnalyzeResponse(
        risk_level=result.risk_level,
        metrics=[
            MetricResponse(
                attribute=m.attribute,
                demographic_parity_diff=m.demographic_parity_diff,
                equalized_odds_diff=m.equalized_odds_diff,
                disparate_impact_ratio=m.disparate_impact_ratio,
                chi_square_p_value=m.chi_square_p_value,
                flagged=m.flagged,
            )
            for m in result.metrics
        ],
        recommendations=result.recommendations,
    )
