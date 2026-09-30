export interface Floor {
  id: string;
  project_id: string;
  floor_number: number;
  name: string;
  level_type: string;
  area_sqft?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFloorInput {
  project_id: string;
  floor_number: number;
  name: string;
  level_type?: string;
  area_sqft?: number;
}
