import { fetchApi } from "./api";
import { Budget, BudgetAllocation, BudgetImpactSimulationResponse } from "@/types/budget";

export async function getBudget(projectId: string): Promise<Budget> {
  return await fetchApi<Budget>(`/api/budget/projects/${projectId}/budget`);
}

export async function getProjectBudget(projectId: string): Promise<Budget> {
  return await fetchApi<Budget>(`/api/budget/projects/${projectId}/budget`);
}

export async function updateBudget(projectId: string, data: Partial<Budget>): Promise<Budget> {
  return await fetchApi<Budget>(`/api/budget/projects/${projectId}/budget`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getAllocations(
  projectId: string,
  floorId?: string,
  roomId?: string
): Promise<BudgetAllocation[]> {
  const query = new URLSearchParams();
  if (floorId) query.append("floor_id", floorId);
  if (roomId) query.append("room_id", roomId);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return await fetchApi<BudgetAllocation[]>(`/api/budget/projects/${projectId}/allocations${qStr}`);
}

export async function getBudgetAllocations(projectId: string): Promise<BudgetAllocation[]> {
  return await fetchApi<BudgetAllocation[]>(`/api/budget/projects/${projectId}/allocations`);
}

export async function createAllocation(
  projectId: string,
  data: Partial<BudgetAllocation>
): Promise<BudgetAllocation> {
  return await fetchApi<BudgetAllocation>(`/api/budget/projects/${projectId}/allocations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function autoAllocateRoom(
  projectId: string,
  roomId: string,
  roomBudget: number,
  floorId?: string
): Promise<BudgetAllocation[]> {
  const query = floorId ? `?floor_id=${floorId}&room_budget=${roomBudget}` : `?room_budget=${roomBudget}`;
  return await fetchApi<BudgetAllocation[]>(
    `/api/budget/projects/${projectId}/rooms/${roomId}/auto-allocate${query}`,
    { method: "POST" }
  );
}

export async function autoAllocateRoomBudgets(projectId: string): Promise<any> {
  return await fetchApi<any>(`/api/budget/projects/${projectId}/auto-allocate`, {
    method: "POST",
  });
}

export async function simulateBudgetImpact(data: {
  project_id: string;
  room_id?: string;
  action_type: string;
  item_category?: string;
  current_item_cost: number;
  new_item_cost: number;
  description?: string;
}): Promise<BudgetImpactSimulationResponse> {
  return await fetchApi<BudgetImpactSimulationResponse>("/api/budget/simulate-impact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function simulateImpact(
  projectId: string,
  itemType: string,
  grade: string
): Promise<any> {
  return await fetchApi<any>(`/api/budget/simulate-impact`, {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      action_type: "upgrade_item",
      item_category: itemType,
      current_item_cost: 45000,
      new_item_cost: grade === "luxury" ? 85000 : 32000,
    }),
  });
}

export const budgetApi = {
  getBudget,
  getProjectBudget,
  updateBudget,
  getAllocations,
  getBudgetAllocations,
  createAllocation,
  autoAllocateRoom,
  autoAllocateRoomBudgets,
  simulateBudgetImpact,
  simulateImpact,
};

export default budgetApi;
