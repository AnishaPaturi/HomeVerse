"""
Evaluation Metrics for Floor Plan Dimension Predictions
Calculates MAE, RMSE, MAPE, and Geometric Scale Consistency.
"""

from typing import Dict, Any, List
import numpy as np
import torch


def calculate_metrics(
    predictions: np.ndarray,
    ground_truth: np.ndarray,
    area_tolerance_ratio: float = 0.20
) -> Dict[str, float]:
    """
    Args:
        predictions: (N, 4) [w, h, area, conf]
        ground_truth: (N, 4) [w, h, area, conf]
        area_tolerance_ratio: Max fractional discrepancy between width*height and area
    Returns:
        Dictionary of calculated evaluation metrics.
    """
    pred_w, pred_h, pred_a, pred_conf = predictions[:, 0], predictions[:, 1], predictions[:, 2], predictions[:, 3]
    gt_w, gt_h, gt_a, gt_conf = ground_truth[:, 0], ground_truth[:, 1], ground_truth[:, 2], ground_truth[:, 3]

    # Mean Absolute Errors
    mae_w = float(np.mean(np.abs(pred_w - gt_w)))
    mae_h = float(np.mean(np.abs(pred_h - gt_h)))
    mae_a = float(np.mean(np.abs(pred_a - gt_a)))

    # Root Mean Squared Errors
    rmse_w = float(np.sqrt(np.mean((pred_w - gt_w) ** 2)))
    rmse_h = float(np.sqrt(np.mean((pred_h - gt_h) ** 2)))
    rmse_a = float(np.sqrt(np.mean((pred_a - gt_a) ** 2)))

    # Mean Absolute Percentage Error (avoid division by zero)
    mape_w = float(np.mean(np.abs((pred_w - gt_w) / np.maximum(gt_w, 1e-4))) * 100.0)
    mape_h = float(np.mean(np.abs((pred_h - gt_h) / np.maximum(gt_h, 1e-4))) * 100.0)
    mape_a = float(np.mean(np.abs((pred_a - gt_a) / np.maximum(gt_a, 1e-4))) * 100.0)

    # Geometric scale consistency: does predicted area match predicted width * height?
    calc_area = pred_w * pred_h
    geom_diff = np.abs(pred_a - calc_area) / np.maximum(pred_a, 1e-4)
    geom_consistency_pct = float(np.mean(geom_diff <= area_tolerance_ratio) * 100.0)

    return {
        "mae_width_m": round(mae_w, 3),
        "mae_height_m": round(mae_h, 3),
        "mae_area_sqm": round(mae_a, 3),
        "rmse_width_m": round(rmse_w, 3),
        "rmse_height_m": round(rmse_h, 3),
        "rmse_area_sqm": round(rmse_a, 3),
        "mape_width_pct": round(mape_w, 2),
        "mape_height_pct": round(mape_h, 2),
        "mape_area_pct": round(mape_a, 2),
        "geometric_consistency_pct": round(geom_consistency_pct, 2)
    }
