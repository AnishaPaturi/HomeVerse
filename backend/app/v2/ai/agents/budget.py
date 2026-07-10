from typing import Dict, Any

class BudgetAgent:
    def __init__(self):
        pass

    async def execute_task(self, task_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determines budget tiers, cost limits, and search keywords for marketplace queries.
        """
        style = task_info.get("parameters", {}).get("style", "Modern")
        
        # Determine tiering rules
        if "luxury" in style.lower():
            tier = "premium"
            caps = {"sofa": 1800, "coffee_table": 500, "bed": 2500, "lamp": 250}
        else:
            tier = "standard"
            caps = {"sofa": 800, "coffee_table": 250, "bed": 1200, "lamp": 90}
            
        return {
            "budget_tier": tier,
            "max_price_caps": caps,
            "sourcing_filters": {
                "currency": "USD",
                "retailers": ["IKEA", "Wayfair", "Target Home"] if tier == "standard" else ["West Elm", "Pottery Barn", "Crate & Barrel"]
            }
        }

budget_agent = BudgetAgent()
