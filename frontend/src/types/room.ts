export interface Room {
  id: string;
  project_id?: string;
  floor_id?: string;
  name: string;
  room_type: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  width_meters?: number;
  length_meters?: number;
  height_meters?: number;
  area_sqm?: number;
  status?: "planning" | "in_progress" | "completed" | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoomInput {
  project_id?: string;
  floor_id?: string;
  name: string;
  room_type: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  width_meters?: number;
  length_meters?: number;
  height_meters?: number;
  area_sqm?: number;
  status?: string;
}
