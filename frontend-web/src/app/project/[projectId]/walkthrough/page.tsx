"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import WalkthroughViewer from "@/components/walkthrough/WalkthroughViewer";
import { projectApi } from "@/lib/projects";
import { floorApi } from "@/lib/floors";
import { roomApi } from "@/lib/rooms";
import { Floor, Room, Project } from "@/types";
import {
  getStoredProject,
  getStoredProjectFloors,
  getStoredProjectRooms,
} from "@/lib/projectStorage";
import { ArrowLeft, Compass, Eye, Layers } from "lucide-react";

export default function ProjectWalkthroughPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredProject(projectId);
      if (stored) return stored as unknown as Project;
    }
    return null;
  });
  const [floors, setFloors] = useState<Floor[]>(() => {
    if (typeof window !== "undefined") {
      const storedFl = getStoredProjectFloors(projectId);
      if (storedFl.length > 0) return storedFl;
    }
    return [];
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (typeof window !== "undefined") {
      const storedRm = getStoredProjectRooms(projectId);
      if (storedRm.length > 0) return storedRm;
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const projData = await projectApi.getProject(projectId);
        if (projData) setProject(projData);
        else {
          const stored = getStoredProject(projectId);
          if (stored) setProject(stored as unknown as Project);
        }

        const floorsData = await floorApi.getFloorsByProject(projectId);
        if (floorsData && floorsData.length > 0) {
          setFloors(floorsData);
          const allRooms: Room[] = [];
          for (const fl of floorsData) {
            const flRooms = await roomApi.getRoomsByFloor(fl.id);
            allRooms.push(...flRooms);
          }
          if (allRooms.length > 0) setRooms(allRooms);
          else {
            const storedRm = getStoredProjectRooms(projectId);
            if (storedRm.length > 0) setRooms(storedRm);
          }
        } else {
          const storedFl = getStoredProjectFloors(projectId);
          if (storedFl.length > 0) setFloors(storedFl);
          const storedRm = getStoredProjectRooms(projectId);
          if (storedRm.length > 0) setRooms(storedRm);
        }
      } catch (err) {
        console.warn("Using stored walkthrough data fallback", err);
        const stored = getStoredProject(projectId);
        if (stored) setProject(stored as unknown as Project);
        const storedFl = getStoredProjectFloors(projectId);
        if (storedFl.length > 0) setFloors(storedFl);
        const storedRm = getStoredProjectRooms(projectId);
        if (storedRm.length > 0) setRooms(storedRm);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-6 flex-1 flex flex-col space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Floor Spatial Navigation Active</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Compass className="w-3.5 h-3.5" />
              <span>FIRST-PERSON DIGITAL TWIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Whole House 3D Walkthrough
            </h1>
            <p className="text-xs text-slate-400 font-light">
              Walk room-by-room across all levels of {project?.name || "your home"}.
            </p>
          </div>
        </div>

        {/* Walkthrough Viewer Container */}
        <div className="flex-1 w-full min-h-[650px]">
          <WalkthroughViewer
            floors={floors}
            rooms={rooms}
            projectName={project?.name}
          />
        </div>
      </main>
    </div>
  );
}
