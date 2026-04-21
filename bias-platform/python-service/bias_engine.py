"""
Core bias analysis engine.

Computes four fairness metrics for each protected attribute:
  - Demographic parity difference
  - Equalized odds difference
  - Disparate impact ratio
  - Chi-square statistical significance test
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency


# --------------------------------------------------------------------------- #
# Thresholds                                                                    #
# --------------------------------------------------------------------------- #
DISPARATE_IMPACT_THRESHOLD = 0.8   # 80% rule (EEOC guideline)
DEMOGRAPHIC_PARITY_THRESHOLD = 0.1 # 10 pp difference
EQUALIZED_ODDS_THRESHOLD = 0.1
CHI_SQUARE_ALPHA = 0.05


@dataclass
class AttributeResult:
    attribute: str
    demographic_parity_diff: float
    equalized_odds_diff: float
    disparate_impact_ratio: float
    chi_square_p_value: float
    flagged: bool


@dataclass
class AnalysisResult:
    risk_level: str
    metrics: list[AttributeResult] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


def _positive_rate(series: pd.Series) -> float:
    """Return fraction of positive (1) outcomes in a boolean/binary series."""
    if len(series) == 0:
        return 0.0
    return float(series.mean())


def _equalized_odds_diff(
    df: pd.DataFrame,
    target: str,
    attr: str,
    group_a: Any,
    group_b: Any,
) -> float:
    """
    Equalized odds difference = max(|TPR_A - TPR_B|, |FPR_A - FPR_B|).
    Falls back to demographic parity diff when true labels are unavailable
    as a binary prediction.
    """
    def tpr(sub: pd.DataFrame) -> float:
        positives = sub[sub[target] == 1]
        return _positive_rate(positives[target]) if len(positives) > 0 else 0.0

    def fpr(sub: pd.DataFrame) -> float:
        negatives = sub[sub[target] == 0]
        return _positive_rate(negatives[target]) if len(negatives) > 0 else 0.0

    sub_a = df[df[attr] == group_a]
    sub_b = df[df[attr] == group_b]

    tpr_diff = abs(tpr(sub_a) - tpr(sub_b))
    fpr_diff = abs(fpr(sub_a) - fpr(sub_b))
    return max(tpr_diff, fpr_diff)


def _analyze_attribute(
    df: pd.DataFrame,
    target: str,
    attr: str,
) -> AttributeResult:
    """Compute all fairness metrics for one protected attribute."""
    groups = df[attr].dropna().unique()

    # Positive rates per group
    rates: dict[Any, float] = {}
    for g in groups:
        subset = df[df[attr] == g][target]
        rates[g] = _positive_rate(subset)

    if len(rates) < 2:
        # Can't compare with only one group
        return AttributeResult(
            attribute=attr,
            demographic_parity_diff=0.0,
            equalized_odds_diff=0.0,
            disparate_impact_ratio=1.0,
            chi_square_p_value=1.0,
            flagged=False,
        )

    max_rate = max(rates.values())
    min_rate = min(rates.values())

    best_group = max(rates, key=lambda g: rates[g])
    worst_group = min(rates, key=lambda g: rates[g])

    # Demographic parity difference
    dem_parity_diff = max_rate - min_rate

    # Disparate impact ratio (avoid division by zero)
    disparate_impact = (min_rate / max_rate) if max_rate > 0 else 1.0

    # Equalized odds difference
    eq_odds_diff = _equalized_odds_diff(df, target, attr, best_group, worst_group)

    # Chi-square test on contingency table
    contingency = pd.crosstab(df[attr], df[target])
    try:
        _, p_value, _, _ = chi2_contingency(contingency)
    except Exception:
        p_value = 1.0

    flagged = (
        disparate_impact < DISPARATE_IMPACT_THRESHOLD
        or dem_parity_diff > DEMOGRAPHIC_PARITY_THRESHOLD
        or eq_odds_diff > EQUALIZED_ODDS_THRESHOLD
        or p_value < CHI_SQUARE_ALPHA
    )

    return AttributeResult(
        attribute=attr,
        demographic_parity_diff=round(dem_parity_diff, 6),
        equalized_odds_diff=round(eq_odds_diff, 6),
        disparate_impact_ratio=round(disparate_impact, 6),
        chi_square_p_value=round(float(p_value), 6),
        flagged=flagged,
    )


def _build_recommendations(results: list[AttributeResult]) -> list[str]:
    """Return actionable fix suggestions based on which metrics are failing."""
    recs: list[str] = []
    flagged = [r for r in results if r.flagged]

    if not flagged:
        return recs

    low_di = [r for r in flagged if r.disparate_impact_ratio < DISPARATE_IMPACT_THRESHOLD]
    high_dp = [r for r in flagged if r.demographic_parity_diff > DEMOGRAPHIC_PARITY_THRESHOLD]
    high_eo = [r for r in flagged if r.equalized_odds_diff > EQUALIZED_ODDS_THRESHOLD]
    sig_chi = [r for r in flagged if r.chi_square_p_value < CHI_SQUARE_ALPHA]

    if low_di:
        attrs = ", ".join(r.attribute for r in low_di)
        recs.append(
            f"Disparate impact below 0.8 for [{attrs}]. Consider re-sampling the training "
            "data (oversampling minority groups or undersampling majority groups) to bring "
            "outcome rates closer to parity."
        )
        recs.append(
            f"Apply re-weighting: assign higher sample weights to underrepresented groups "
            f"in [{attrs}] during model training to reduce outcome disparity."
        )

    if high_dp:
        attrs = ", ".join(r.attribute for r in high_dp)
        recs.append(
            f"Demographic parity gap exceeds 10 pp for [{attrs}]. Review whether the "
            "features correlated with these attributes are necessary predictors, and consider "
            "removing or transforming proxy variables."
        )

    if high_eo:
        attrs = ", ".join(r.attribute for r in high_eo)
        recs.append(
            f"Equalized odds violation for [{attrs}]. Apply post-processing threshold "
            "calibration: set group-specific decision thresholds to equalise true-positive "
            "and false-positive rates across groups."
        )

    if sig_chi:
        attrs = ", ".join(r.attribute for r in sig_chi)
        recs.append(
            f"Statistically significant outcome disparity detected for [{attrs}] "
            f"(χ² p < 0.05). Conduct a deeper causal audit to identify whether the "
            "disparity stems from historical bias in the training labels."
        )

    recs.append(
        "Document all fairness interventions and re-run this audit after each model "
        "retrain to track improvement over time."
    )

    return recs


def _compute_risk_level(results: list[AttributeResult]) -> str:
    """Aggregate individual metric failures into a single risk level."""
    flagged = [r for r in results if r.flagged]
    if not flagged:
        return "Low"

    # High if any attribute has disparate impact < 0.7 or > 2 attributes flagged
    severe_di = any(r.disparate_impact_ratio < 0.7 for r in flagged)
    if severe_di or len(flagged) >= 2:
        return "High"

    return "Medium"


def run_analysis(
    file_path: str,
    target_column: str,
    protected_columns: list[str],
) -> AnalysisResult:
    """
    Load a CSV, binarise the target column, and compute fairness metrics for
    every protected attribute.  Returns an AnalysisResult ready to serialise.
    """
    df = pd.read_csv(file_path)

    # Validate columns exist
    missing = [c for c in [target_column] + protected_columns if c not in df.columns]
    if missing:
        raise ValueError(f"Columns not found in dataset: {missing}")

    # Binarise target: keep as-is if already 0/1, otherwise encode top category as 1
    target_series = df[target_column]
    unique_vals = target_series.dropna().unique()

    if set(unique_vals).issubset({0, 1, True, False, "0", "1"}):
        df[target_column] = target_series.astype(int)
    else:
        # Most-frequent value = positive outcome (label encoding)
        top_val = target_series.value_counts().idxmax()
        df[target_column] = (target_series == top_val).astype(int)

    # Drop rows where target is null
    df = df.dropna(subset=[target_column])

    # Analyse each protected attribute
    metrics: list[AttributeResult] = []
    for attr in protected_columns:
        if attr not in df.columns:
            continue
        result = _analyze_attribute(df, target_column, attr)
        metrics.append(result)

    risk_level = _compute_risk_level(metrics)
    recommendations = _build_recommendations(metrics)

    return AnalysisResult(
        risk_level=risk_level,
        metrics=metrics,
        recommendations=recommendations,
    )
