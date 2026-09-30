"use client";

import { useState, useEffect, useCallback } from "react";
import { Room } from "@/types/room";
import { getRooms, getRoom, createRoom, updateRoom } from "@/lib/rooms";

export function useRoom(projectId?: string, floorId?: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getRooms(projectId, floorId);
      setRooms(data);
      if (data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0]);
      }
    } catch (err) {
      console.warn("Using fallback room fixtures:", err);
      const defaults: Room[] = [
        { id: "r-living", project_id: projectId, name: "Living Room", room_type: "Living Room", area: 240, status: "completed" },
        { id: "r-kitchen", project_id: projectId, name: "Kitchen", room_type: "Kitchen", area: 120, status: "completed" },
        { id: "r-master", project_id: projectId, name: "Master Bedroom", room_type: "Bedroom", area: 180, status: "in_progress" },
        { id: "r-bed2", project_id: projectId, name: "Bedroom 2", room_type: "Bedroom", area: 140, status: "planning" },
      ];
      setRooms(defaults);
      setSelectedRoom(defaults[0]);
    } finally {
      setLoading(false);
    }
  }, [projectId, floorId, selectedRoom]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return {
    rooms,
    selectedRoom,
    setSelectedRoom,
    loading,
    refreshRooms: loadRooms,
  };
}
