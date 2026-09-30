export type BudgetFlexibility = "Strict" | "Moderate" | "Flexible" | "strict" | "moderate" | "flexible";

export type BudgetCategoryEnum =
  | "Furniture"
  | "Lighting"
  | "Flooring"
  | "Walls"
  | "Ceiling"
  | "Materials"
  | "Decor"
  | "Electrical"
  | "Other";

export interface BudgetAllocation {
  id: string;
  budget_id: string;
  floor_id?: string;
  room_id?: string;
  room_name?: string;
  category: BudgetCategoryEnum | string;
  allocated_amount: number;
  estimated_amount?: number;
  actual_amount?: number;
  spent_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  project_id: string;
  total_budget: number;
  currency?: string;
  flexibility?: BudgetFlexibility | string;
  spent_amount?: number;
  estimated_amount?: number;
  remaining_amount?: number;
  allocated_budget?: number;
  created_at?: string;
  updated_at?: string;
  allocations?: BudgetAllocation[];
}

export interface CreateBudgetInput {
  total_budget: number;
  currency?: string;
  flexibility?: BudgetFlexibility | string;
}

export interface CheaperAlternative {
  id?: string;
  name: string;
  category?: string;
  cost: number;
  savings: number;
  image_url?: string;
  description?: string;
}

export interface BudgetImpactSimulationResponse {
  cost_delta: number;
  new_total_estimate: number;
  budget_status: "within_budget" | "warning" | "exceeded";
  remaining_amount: number;
  message: string;
  alternative_items?: CheaperAlternative[];
}
