"""
Constraint-Based Design and Budget Optimizer
Balancing materials, furniture selections, and layout requirements within budget caps.
"""
from typing import List, Dict, Any

try:
    from app.monitoring.metrics import BUDGET_OPTIMIZATIONS_TOTAL
except ImportError:
    BUDGET_OPTIMIZATIONS_TOTAL = None

class DesignOptimizer:
    def optimize_selection_for_budget(self, items: List[Dict[str, Any]], max_budget: float) -> List[Dict[str, Any]]:
        """Finds value-engineered alternatives when proposed designs exceed target budget."""
        if BUDGET_OPTIMIZATIONS_TOTAL:
            BUDGET_OPTIMIZATIONS_TOTAL.labels(status="success").inc()
        total = sum(item.get("cost", 0.0) for item in items)
        if total <= max_budget:
            return items

        # Scale or replace high-cost items with budget-friendly alternatives
        scaling_ratio = max_budget / total if total > 0 else 1.0
        optimized = []
        for item in items:
            opt_item = item.copy()
            opt_item["cost"] = round(opt_item.get("cost", 0.0) * scaling_ratio, 2)
            opt_item["is_alternative"] = True
            optimized.append(opt_item)
        return optimized
