"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { RoomCard } from "@/components/rooms/RoomCard";
import { floorApi } from "@/lib/floors";
import { roomApi } from "@/lib/rooms";
import { Floor, Room } from "@/types";
import {
  getStoredProjectFloors,
  getStoredProjectRooms,
} from "@/lib/projectStorage";
import {
  Layers,
  ArrowLeft,
  Plus,
  Compass,
  Eye,
  IndianRupee,
  LayoutGrid,
} from "lucide-react";

export default function FloorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const floorId = params.floorId as string;

  const [floor, setFloor] = useState<Floor | null>(() => {
    if (typeof window !== "undefined") {
      const storedFl = getStoredProjectFloors(projectId);
      const match = storedFl.find((f) => f.id === floorId);
      if (match) return match;
      if (storedFl.length > 0) return storedFl[0];
    }
    return null;
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (typeof window !== "undefined") {
      const storedRm = getStoredProjectRooms(projectId, floorId);
      if (storedRm.length > 0) return storedRm;
      // If none explicitly matched floorId, return all if 1 floor
      const all = getStoredProjectRooms(projectId);
      if (all.length > 0) return all;
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFloorData() {
      try {
        const floorData = await floorApi.getFloor(floorId);
        if (floorData) setFloor(floorData);
        else {
          const storedFl = getStoredProjectFloors(projectId);
          const match = storedFl.find((f) => f.id === floorId) || storedFl[0];
          if (match) setFloor(match);
        }

        const roomsData = await roomApi.getRoomsByFloor(floorId);
        if (roomsData && roomsData.length > 0) {
          setRooms(roomsData);
        } else {
          const storedRm = getStoredProjectRooms(projectId, floorId);
          if (storedRm.length > 0) setRooms(storedRm);
          else {
            const all = getStoredProjectRooms(projectId);
            if (all.length > 0) setRooms(all);
          }
        }
      } catch (err) {
        console.warn("Using stored floor data fallback", err);
        const storedFl = getStoredProjectFloors(projectId);
        const match = storedFl.find((f) => f.id === floorId) || storedFl[0];
        if (match) setFloor(match);

        const storedRm = getStoredProjectRooms(projectId, floorId);
        if (storedRm.length > 0) setRooms(storedRm);
        else {
          const all = getStoredProjectRooms(projectId);
          if (all.length > 0) setRooms(all);
        }
      } finally {
        setLoading(false);
      }
    }
    loadFloorData();
  }, [floorId, projectId]);

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>

          <Link
            href={`/project/${projectId}/walkthrough`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:border-emerald-500 hover:text-white transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Walkthrough View</span>
          </Link>
        </div>

        {/* Floor Header Banner */}
        <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>LEVEL {floor?.level || 1} SPECIFICATION</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {floor?.name || `Floor ${floor?.level || 1}`}
            </h1>
            <p className="text-xs text-slate-400 font-light">
              Managing architectural boundaries and 3D room scenes for Level {floor?.level || 1}.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-28">
              <div className="text-[10px] text-slate-500 uppercase">Total Rooms</div>
              <div className="text-xl font-bold text-white mt-0.5">{rooms.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-28">
              <div className="text-[10px] text-slate-500 uppercase">Floor Area</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {rooms.reduce((acc, r) => acc + (r.area_sqm || 0), 0).toFixed(1)} m²
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-emerald-400" />
              <span>Rooms on this Level</span>
            </h2>

            <button
              onClick={() => router.push(`/project/${projectId}/rooms/new?floorId=${floorId}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={(selected) =>
                  router.push(`/project/${projectId}/rooms/${selected.id}/playground`)
                }
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
