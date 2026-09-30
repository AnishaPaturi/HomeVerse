export type BudgetFlexibility = "Strict" | "Moderate" | "Flexible";

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
  category: BudgetCategoryEnum | string;
  allocated_amount: number;
  estimated_amount: number;
  actual_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  project_id: string;
  total_budget: number;
  currency: string;
  flexibility: BudgetFlexibility | string;
  spent_amount: number;
  estimated_amount: number;
  remaining_amount: number;
  created_at?: string;
  updated_at?: string;
  allocations?: BudgetAllocation[];
}

export interface AlternativeItemOption {
  name: string;
  price: number;
  savings: number;
  image_url?: string;
  retailer?: string;
}

export interface BudgetImpactSimulationResponse {
  project_id: string;
  current_room_budget: number;
  new_room_budget: number;
  delta_amount: number;
  total_budget: number;
  remaining_budget_before: number;
  remaining_budget_after: number;
  is_within_budget: boolean;
  budget_flexibility: BudgetFlexibility | string;
  impact_message: string;
  cheaper_alternatives: AlternativeItemOption[];
}
