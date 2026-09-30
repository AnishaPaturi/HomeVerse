import { fetchApi } from "./api";

export async function uploadFloorplan(projectId: string, file: File, floorId?: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (floorId) formData.append("floor_id", floorId);

  const res = await fetch(`http://localhost:8080/api/projects/${projectId}/floorplans/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Floor plan upload failed");
  return await res.json();
}

export async function analyzeFloorplan(floorplanId: string): Promise<any> {
  return await fetchApi<any>(`/api/floorplans/${floorplanId}/analyze`, {
    method: "POST",
  });
}

export async function confirmFloorplan(floorplanId: string, confirmedRooms: any[]): Promise<any> {
  return await fetchApi<any>(`/api/floorplans/${floorplanId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ floorplan_id: floorplanId, confirmed_rooms: confirmedRooms }),
  });
}
