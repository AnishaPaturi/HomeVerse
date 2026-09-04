/**
 * Core Type Definitions for HomeVerse
 */

export interface Project {
  id: string;
  user_id: string;
  name: string;
  property_type: "apartment" | "villa" | "independent_house" | "commercial";
  bhk?: number;
  area_sqft?: number;
  budget?: number;
  currency?: string;
  created_at?: string;
}

export interface Room {
  id: string;
  project_id: string;
  name: string;
  room_type: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  status?: string;
}

export interface Design {
  id: string;
  room_id?: string;
  project_id?: string;
  name: string;
  style: string;
  estimated_cost?: number;
  image_url?: string;
  status?: string;
}

export interface Budget {
  id: string;
  project_id: string;
  total_budget: number;
  allocated_budget: number;
  spent_amount: number;
  remaining_amount: number;
}

export interface ShoppingItem {
  id: string;
  project_id: string;
  product_id?: string;
  name: string;
  quantity: number;
  estimated_cost: number;
  status: "pending" | "ordered" | "delivered";
}

export interface ExecutionTask {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  estimated_cost?: number;
  actual_cost?: number;
}

export interface WhatIfPresetOption {
  id: string;
  title: string;
  query: string;
  description: string;
  category: string;
  icon: string;
}

export interface ItemModification {
  action: "add" | "modify" | "remove" | "keep";
  name: string;
  category: string;
  original_material?: string;
  new_material?: string;
  original_cost: number;
  new_cost: number;
  cost_delta: number;
  reason: string;
}

export interface CostSimulationSummary {
  original_total_cost: number;
  new_total_cost: number;
  net_cost_difference: number;
  project_budget?: number;
  remaining_budget_after?: number;
  savings_or_increase_text: string;
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
  cost_summary: CostSimulationSummary;
  modified_items: ItemModification[];
  prompt_preview: string;
  can_apply: boolean;
}

