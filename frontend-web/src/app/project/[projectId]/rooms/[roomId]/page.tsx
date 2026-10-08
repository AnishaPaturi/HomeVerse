"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import RoomScene from "@/components/three-d/RoomScene";
import { roomApi } from "@/lib/rooms";
import { budgetApi } from "@/lib/budgets";
import { formatIndianBudget } from "@/lib/utils";
import { Room, BudgetAllocation } from "@/types";
import {
  ArrowLeft,
  Wand2,
  Box,
  Ruler,
  IndianRupee,
  Layers,
  Sparkles,
  ShoppingBag,
  Pencil,
  Check,
  X,
} from "lucide-react";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [allocation, setAllocation] = useState<BudgetAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const handleSaveRename = async () => {
    if (!editedName.trim() || !room) return;
    const newName = editedName.trim();
    try {
      await roomApi.updateRoom(roomId, { name: newName });
    } catch (err) {
      console.warn("Failed to persist room rename:", err);
    }
    setRoom((prev) => (prev ? { ...prev, name: newName } : null));
    setIsEditingName(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const roomData = await roomApi.getRoom(roomId);
        setRoom(roomData);

        const allocations = await budgetApi.getBudgetAllocations(projectId);
        const match = allocations.find((a) => a.room_id === roomId);
        if (match) setAllocation(match);
      } catch (err) {
        // Fallback default
        setRoom({
          id: roomId,
          floor_id: "f1",
          name: "Living Room",
          room_type: "living_room",
          width_meters: 5.5,
          length_meters: 6.5,
          area_sqm: 35.75,
          created_at: "",
          updated_at: "",
        });
        setAllocation({
          id: "a1",
          budget_id: "b1",
          room_id: roomId,
          category: "Furniture & Decor",
          allocated_amount: 350000,
          spent_amount: 185000,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, roomId]);

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

          <button
            onClick={() =>
              router.push(`/project/${projectId}/rooms/${roomId}/playground`)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-105"
          >
            <Wand2 className="w-4 h-4" />
            <span>Open 3D Design Playground</span>
          </button>
        </div>

        {/* Room Header */}
        <div className="p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Box className="w-3.5 h-3.5" />
              <span>SPATIAL CAD ROOM TWIN</span>
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="px-3 py-1.5 text-2xl font-bold bg-slate-900 border-2 border-emerald-500 rounded-xl text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  title="Save name"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  {room?.name || "Room Overview"}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(room?.name || "");
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-white/[0.05] transition-all cursor-pointer text-slate-400"
                  title="Rename room"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 font-light">
              Parametric 3D scene, dimensions, and allocated budget for this space.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Dimensions</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {room?.width_meters || 5.5}m × {room?.length_meters || 6.5}m
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Floor Area</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {room?.area_sqm || 35.75} m²
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-500 uppercase">Room Budget</div>
              <div className="text-sm font-bold text-teal-400 mt-0.5">
                {formatIndianBudget(allocation?.allocated_amount || 350000)}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Scene Viewport */}
        <div className="h-[520px] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl relative">
          <RoomScene
            dimensions={{
              width: room?.width_meters || 5.5,
              length: room?.length_meters || 6.5,
            }}
          />

          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() =>
                router.push(`/project/${projectId}/rooms/${roomId}/playground`)
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md hover:bg-emerald-500 text-slate-200 hover:text-slate-950 font-mono text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Full CAD Playground & Copilot →</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
