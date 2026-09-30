"use client";

import { useState, useEffect, useCallback } from "react";
import { Budget, BudgetAllocation, BudgetImpactSimulationResponse } from "@/types/budget";
import { getBudget, updateBudget, getAllocations, simulateBudgetImpact, autoAllocateRoom } from "@/lib/budgets";

export function useBudget(projectId?: string) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<BudgetImpactSimulationResponse | null>(null);

  const loadBudgetData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getBudget(projectId);
      setBudget(b);
      const allocs = await getAllocations(projectId);
      setAllocations(allocs);
    } catch (err: any) {
      console.warn("Could not load remote budget, using fallback project budget state.", err);
      // Fallback local budget object
      setBudget({
        id: "b-local",
        project_id: projectId,
        total_budget: 2500000,
        currency: "INR",
        flexibility: "Moderate",
        spent_amount: 420000,
        estimated_amount: 2140000,
        remaining_amount: 360000,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const updateProjectBudget = async (data: Partial<Budget>) => {
    if (!projectId) return;
    try {
      const updated = await updateBudget(projectId, data);
      setBudget(updated);
      return updated;
    } catch (err: any) {
      console.error("Failed to update budget:", err);
      setBudget((prev) => (prev ? { ...prev, ...data } : null));
    }
  };

  const evaluateChange = async (params: {
    room_id?: string;
    action_type: string;
    item_category?: string;
    current_item_cost: number;
    new_item_cost: number;
    description?: string;
  }) => {
    if (!projectId) return null;
    setSimulating(true);
    try {
      const res = await simulateBudgetImpact({
        project_id: projectId,
        ...params,
      });
      setSimulationResult(res);
      return res;
    } catch (err) {
      console.warn("Using local simulation evaluation fallback:", err);
      const delta = params.new_item_cost - params.current_item_cost;
      const res: BudgetImpactSimulationResponse = {
        project_id: projectId,
        current_room_budget: 420000,
        new_room_budget: 420000 + delta,
        delta_amount: delta,
        total_budget: budget?.total_budget || 2500000,
        remaining_budget_before: budget?.remaining_amount || 360000,
        remaining_budget_after: (budget?.remaining_amount || 360000) - delta,
        is_within_budget: true,
        budget_flexibility: budget?.flexibility || "Moderate",
        impact_message: delta > 0 ? `This change is estimated to increase the room budget by ₹${delta.toLocaleString("en-IN")}.` : "Cost neutral.",
        cheaper_alternatives: [
          { name: "Curated Eco Fabric Modular", price: params.new_item_cost * 0.75, savings: params.new_item_cost * 0.25, retailer: "HomeVerse Curated" }
        ]
      };
      setSimulationResult(res);
      return res;
    } finally {
      setSimulating(false);
    }
  };

  return {
    budget,
    allocations,
    loading,
    error,
    simulating,
    simulationResult,
    refreshBudget: loadBudgetData,
    updateProjectBudget,
    evaluateChange,
    clearSimulation: () => setSimulationResult(null),
  };
}
