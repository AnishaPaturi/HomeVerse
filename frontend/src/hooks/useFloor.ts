"use client";

import { useState, useEffect, useCallback } from "react";
import { Floor } from "@/types/floor";
import { getFloors, createFloor } from "@/lib/floors";

export function useFloor(projectId?: string) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFloors = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getFloors(projectId);
      setFloors(data);
      if (data.length > 0 && !selectedFloor) {
        setSelectedFloor(data[0]);
      }
    } catch (err) {
      console.warn("Failed loading floors from api, using default ground floor:", err);
      const defaultFloor: Floor = {
        id: "f-ground",
        project_id: projectId,
        floor_number: 1,
        name: "Ground Floor",
        level_type: "residential",
      };
      setFloors([defaultFloor]);
      setSelectedFloor(defaultFloor);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFloor]);

  useEffect(() => {
    loadFloors();
  }, [loadFloors]);

  const addFloor = async (name: string, floorNumber: number) => {
    if (!projectId) return;
    try {
      const newFloor = await createFloor(projectId, { name, floor_number: floorNumber });
      setFloors((prev) => [...prev, newFloor]);
      return newFloor;
    } catch (err) {
      console.error("Error creating floor:", err);
    }
  };

  return {
    floors,
    selectedFloor,
    setSelectedFloor,
    loading,
    refreshFloors: loadFloors,
    addFloor,
  };
}
