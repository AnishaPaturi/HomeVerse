import { CheaperAlternative, BudgetImpactSimulationResponse } from "./budget";

export interface AIChangeSuggestion {
  element: string;
  action: "replace" | "resize" | "remove" | "recolor" | string;
  from_value: string;
  to_value: string;
  cost_difference: number;
  reason: string;
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  content: string;
  timestamp: string;
  budgetImpact?: number;
  budgetMessage?: string;
  suggestions?: AIChangeSuggestion[];
  alternatives?: any[];
}

export interface GenerationStatus {
  step: number;
  progress: number;
  label: string;
  status: "idle" | "generating" | "completed" | "failed";
}

export interface WhatIfPresetOption {
  id: string;
  title: string;
  query: string;
  description: string;
  category: string;
  icon?: string;
}

export interface WhatIfCostSummary {
  original_total_cost: number;
  new_total_cost: number;
  net_cost_difference: number;
  project_budget?: number;
  remaining_budget_after?: number;
  savings_or_increase_text?: string;
}

export interface WhatIfModifiedItem {
  action: "modify" | "add" | "remove" | string;
  name: string;
  category?: string;
  new_material?: string;
  original_cost?: number;
  new_cost?: number;
  cost_delta: number;
  reason?: string;
}

export interface WhatIfScenarioResponse {
  scenario_id: string;
  design_id: string;
  query: string;
  scenario_title: string;
  summary: string;
  design_changes: string[];
  furniture_changes: string[];
  material_changes: string[];
  cost_summary: WhatIfCostSummary;
  modified_items: WhatIfModifiedItem[];
  prompt_preview?: string;
  can_apply?: boolean;
}
