export interface DesignItem {
  id: string;
  design_id: string;
  name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  product_id?: string;
  created_at?: string;
}

export interface DesignVersion {
  id: string;
  design_id: string;
  version_number: number;
  prompt?: string;
  changes_summary?: string;
  estimated_cost: number;
  image_url?: string;
  created_at: string;
}

export interface Design {
  id: string;
  project_id?: string;
  room_id?: string;
  name?: string;
  description?: string;
  style: string;
  estimated_cost: number;
  image_url?: string;
  status: string;
  selected?: boolean;
  direction?: string;
  layout_variant?: string;
  items?: DesignItem[];
  versions?: DesignVersion[];
  created_at?: string;
}
