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

export interface AlternativeItemOption {
  name: string;
  price: number;
  savings: number;
  image_url?: string;
  retailer?: string;
}

export interface BudgetImpactSimulationResponse {
  project_id?: string;
  current_room_budget?: number;
  new_room_budget?: number;
  delta_amount?: number;
  total_budget?: number;
  remaining_budget_before?: number;
  remaining_budget_after?: number;
  is_within_budget?: boolean;
  budget_flexibility?: string;
  impact_message?: string;
  cheaper_alternatives?: AlternativeItemOption[];
  cost_delta?: number;
  new_total_estimate?: number;
  budget_status?: "within_budget" | "warning" | "exceeded" | string;
  remaining_amount?: number;
  message?: string;
  alternative_items?: CheaperAlternative[];
}

export interface ShoppingItem {
  id: string;
  project_id?: string;
  name: string;
  quantity: number;
  estimated_cost: number;
  status: string;
  category?: string;
  vendor?: string;
  product_id?: string;
  product_details?: {
    name?: string;
    category?: string;
    price?: number;
    image_url?: string;
    brand?: string;
  };
}
