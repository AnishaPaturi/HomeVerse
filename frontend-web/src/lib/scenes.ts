import { fetchApi } from "./api";
import { Scene, SceneObject } from "@/types/scene";

export async function getRoomScene(roomId: string, projectId?: string): Promise<Scene> {
  const query = projectId ? `?project_id=${projectId}` : "";
  return await fetchApi<Scene>(`/api/rooms/${roomId}/scene${query}`);
}

export async function getHouseScene(projectId: string): Promise<any> {
  return await fetchApi<any>(`/api/projects/${projectId}/house-scene`);
}

export async function addSceneObject(sceneId: string, data: Partial<SceneObject>): Promise<SceneObject> {
  return await fetchApi<SceneObject>(`/api/scenes/${sceneId}/objects`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSceneObject(objectId: string, data: Partial<SceneObject>): Promise<SceneObject> {
  return await fetchApi<SceneObject>(`/api/scenes/objects/${objectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSceneObject(objectId: string): Promise<void> {
  await fetchApi(`/api/scenes/objects/${objectId}`, {
    method: "DELETE",
  });
}
