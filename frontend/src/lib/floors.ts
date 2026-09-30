import { fetchApi } from "./api";
import { Floor, CreateFloorInput } from "@/types/floor";

export async function getFloors(projectId: string): Promise<Floor[]> {
  return await fetchApi<Floor[]>(`/api/projects/${projectId}/floors`);
}

export async function createFloor(projectId: string, data: Partial<CreateFloorInput>): Promise<Floor> {
  return await fetchApi<Floor>(`/api/projects/${projectId}/floors`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getFloor(floorId: string): Promise<Floor> {
  return await fetchApi<Floor>(`/api/floors/${floorId}`);
}
