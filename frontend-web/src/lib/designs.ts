import { fetchApi } from "./api";
import { Design } from "@/types/design";

export async function getRoomDesigns(roomId: string): Promise<Design[]> {
  return await fetchApi<Design[]>(`/api/designs/rooms/${roomId}`);
}

export async function getProjectDesigns(projectId: string): Promise<Design[]> {
  return await fetchApi<Design[]>(`/api/designs/projects/${projectId}`);
}

export async function createDesign(data: Partial<Design>): Promise<Design> {
  return await fetchApi<Design>("/api/designs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
