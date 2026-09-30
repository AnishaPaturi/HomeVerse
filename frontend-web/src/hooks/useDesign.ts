"use client";

import { useState, useEffect, useCallback } from "react";
import { Design } from "@/types/design";
import { getRoomDesigns, getProjectDesigns, createDesign } from "@/lib/designs";

export function useDesign(roomId?: string, projectId?: string) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [activeDesign, setActiveDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDesigns = useCallback(async () => {
    if (!roomId && !projectId) return;
    setLoading(true);
    try {
      if (roomId) {
        const d = await getRoomDesigns(roomId);
        setDesigns(d);
        if (d.length > 0) setActiveDesign(d[0]);
      } else if (projectId) {
        const d = await getProjectDesigns(projectId);
        setDesigns(d);
        if (d.length > 0) setActiveDesign(d[0]);
      }
    } catch (err) {
      console.warn("Could not load designs from API, using default presets:", err);
      const defaults: Design[] = [
        {
          id: "d-modern",
          project_id: projectId || "p-demo",
          room_id: roomId,
          name: "Modern Living Elegance",
          style: "Modern",
          estimated_cost: 420000,
          status: "completed",
          image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
        },
        {
          id: "d-japandi",
          project_id: projectId || "p-demo",
          room_id: roomId,
          name: "Serene Japandi Concept",
          style: "Japandi",
          estimated_cost: 395000,
          status: "completed",
          image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800",
        },
      ];
      setDesigns(defaults);
      setActiveDesign(defaults[0]);
    } finally {
      setLoading(false);
    }
  }, [roomId, projectId]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  return {
    designs,
    activeDesign,
    setActiveDesign,
    loading,
    refreshDesigns: loadDesigns,
  };
}
