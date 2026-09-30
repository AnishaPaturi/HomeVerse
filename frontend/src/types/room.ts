export interface Room {
  id: string;
  project_id: string;
  floor_id?: string;
  name: string;
  room_type: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  status: "planning" | "in_progress" | "completed" | string;
  created_at?: string;
}

export interface CreateRoomInput {
  project_id: string;
  floor_id?: string;
  name: string;
  room_type: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  status?: string;
}
