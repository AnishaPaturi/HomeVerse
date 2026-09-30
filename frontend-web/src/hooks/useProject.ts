"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types";
import { fetchApi } from "@/lib/api";

export function useProject(projectId?: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    fetchApi<Project>(`/api/projects/${projectId}`)
      .then((data) => {
        setProject(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  return { project, loading, error };
}
