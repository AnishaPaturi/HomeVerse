export interface SceneObject {
  id: string;
  scene_id: string;
  object_type: string;
  name?: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation: number;
  scale: number;
  material?: string;
  color?: string;
  unit_price: number;
  product_id?: string;
  created_at?: string;
}

export interface Scene {
  id: string;
  project_id: string;
  room_id?: string;
  name: string;
  scene_type: "room" | "floor" | "house" | "walkthrough" | string;
  camera_settings?: string;
  lighting_settings?: string;
  scene_objects?: SceneObject[];
}
