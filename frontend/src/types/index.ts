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
