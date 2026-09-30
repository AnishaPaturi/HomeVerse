import { Design } from "./design";
import { Room } from "./room";
import { Floor } from "./floor";
import { Budget } from "./budget";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  title?: string;
  property_type: "apartment" | "independent" | "villa" | string;
  bhk?: number;
  area_sqft?: number;
  budget?: number;
  currency?: string;
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
  property_type: string;
  bhk?: number;
  area_sqft?: number;
  budget?: number;
  currency?: string;
  budget_flexibility?: string;
  num_floors?: number;
}
