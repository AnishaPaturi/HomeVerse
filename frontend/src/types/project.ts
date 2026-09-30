import { Design } from "./design";
import { Room } from "./room";
import { Floor } from "./floor";
import { Budget } from "./budget";

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  title?: string;
  property_type?: "apartment" | "independent" | "villa" | string;
  home_type?: string;
  bhk?: number;
  area_sqft?: number;
  budget?: number;
  total_budget?: number;
  currency?: string;
  budget_flexibility?: string;
  design_style?: string;
  floors_count?: number;
  total_rooms?: number;
  room_type?: string;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
  floors?: Floor[];
  rooms?: Room[];
  designs?: Design[];
  budgets?: Budget[];
}

export interface CreateProjectInput {
  name: string;
  property_type?: string;
  home_type?: string;
  bhk?: number;
  area_sqft?: number;
  budget?: number;
  total_budget?: number;
  currency?: string;
  budget_flexibility?: string;
  design_style?: string;
  num_floors?: number;
  floors_count?: number;
  total_rooms?: number;
  floors?: any[];
}

export interface ExecutionTask {
  id: string;
  project_id?: string;
  name: string;
  description?: string;
  status: string;
  estimated_cost?: number;
  actual_cost?: number;
  phase?: string;
  duration_days?: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  project_id?: string;
  category: string;
  description?: string;
  amount: number;
  date?: string;
  receipt_url?: string;
}
