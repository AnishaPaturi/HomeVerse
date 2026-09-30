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
