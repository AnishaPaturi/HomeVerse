"""
Unit Tests for Core Models and Optimization Logic
"""
import pytest
from app.ai.design_optimizer import DesignOptimizer

def test_design_optimizer_within_budget():
    optimizer = DesignOptimizer()
    items = [
        {"name": "Sofa", "cost": 30000},
        {"name": "Table", "cost": 10000}
    ]
    result = optimizer.optimize_selection_for_budget(items, 50000)
    assert len(result) == 2
    assert sum(item["cost"] for item in result) == 40000

def test_design_optimizer_exceeds_budget():
    optimizer = DesignOptimizer()
    items = [
        {"name": "Luxury Bed", "cost": 80000},
        {"name": "Wardrobe", "cost": 60000}
    ]
    result = optimizer.optimize_selection_for_budget(items, 70000)
    assert len(result) == 2
    assert sum(item["cost"] for item in result) <= 70000.01
