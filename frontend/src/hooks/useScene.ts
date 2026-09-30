"use client";

import { useState, useEffect, useCallback } from "react";
import { Scene, SceneObject } from "@/types/scene";
import { getRoomScene, addSceneObject, updateSceneObject, deleteSceneObject } from "@/lib/scenes";

export function useScene(roomId?: string, projectId?: string) {
  const [scene, setScene] = useState<Scene | null>(null);
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadScene = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const s = await getRoomScene(roomId, projectId);
      setScene(s);
      setObjects(s.scene_objects || []);
    } catch (err) {
      console.warn("Using local fallback 3D scene:", err);
      const fallbackObjects: SceneObject[] = [
        { id: "obj-sofa", scene_id: "s-demo", object_type: "sofa", name: "Modular 3-Seater", position_x: 0, position_y: 0, position_z: 1.2, rotation: 0, scale: 1, unit_price: 50000 },
        { id: "obj-table", scene_id: "s-demo", object_type: "coffee_table", name: "Oak Coffee Table", position_x: 0, position_y: 0, position_z: 0.2, rotation: 0, scale: 1, unit_price: 15000 },
        { id: "obj-lamp", scene_id: "s-demo", object_type: "lamp", name: "Floor Arc Lamp", position_x: 1.5, position_y: 0, position_z: 1.2, rotation: 0, scale: 1, unit_price: 8000 }
      ];
      setScene({
        id: "s-demo",
        project_id: projectId || "p-demo",
        room_id: roomId,
        name: "3D Playground Scene",
        scene_type: "room",
        scene_objects: fallbackObjects,
      });
      setObjects(fallbackObjects);
    } finally {
      setLoading(false);
    }
  }, [roomId, projectId]);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  const addObject = async (data: Partial<SceneObject>) => {
    if (!scene) return;
    try {
      const created = await addSceneObject(scene.id, data);
      setObjects((prev) => [...prev, created]);
      return created;
    } catch {
      const localObj: SceneObject = {
        id: `obj-${Date.now()}`,
        scene_id: scene.id,
        object_type: data.object_type || "box",
        name: data.name || data.object_type,
        position_x: data.position_x || 0,
        position_y: data.position_y || 0,
        position_z: data.position_z || 0,
        rotation: 0,
        scale: 1,
        unit_price: data.unit_price || 10000,
      };
      setObjects((prev) => [...prev, localObj]);
      return localObj;
    }
  };

  const updateObject = async (objectId: string, data: Partial<SceneObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === objectId ? { ...o, ...data } : o)));
    try {
      await updateSceneObject(objectId, data);
    } catch (err) {
      console.warn("Optimistic local object update saved.");
    }
  };

  const removeObject = async (objectId: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== objectId));
    try {
      await deleteSceneObject(objectId);
    } catch (err) {
      console.warn("Optimistic object deletion applied.");
    }
  };

  return {
    scene,
    objects,
    selectedObjectId,
    setSelectedObjectId,
    loading,
    addObject,
    updateObject,
    removeObject,
    refreshScene: loadScene,
  };
}
