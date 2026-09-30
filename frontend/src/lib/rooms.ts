import { fetchApi } from "./api";
import { Room, CreateRoomInput } from "@/types/room";

export async function getRooms(projectId: string, floorId?: string): Promise<Room[]> {
  const query = floorId ? `?floor_id=${floorId}` : "";
  return await fetchApi<Room[]>(`/api/projects/${projectId}/rooms${query}`);
}

export async function getRoom(roomId: string): Promise<Room> {
  return await fetchApi<Room>(`/api/rooms/${roomId}`);
}

export async function createRoom(data: CreateRoomInput): Promise<Room> {
  return await fetchApi<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRoom(roomId: string, data: Partial<Room>): Promise<Room> {
  return await fetchApi<Room>(`/api/rooms/${roomId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
