"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Box,
  Layers,
  ArrowRight,
  Ruler,
  IndianRupee,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { formatIndianBudget } from "@/lib/utils";

export interface PostGenerationRoomChoiceProps {
  projectId: string;
  roomId: string;
  roomName: string;
  roomType?: string;
  designStyle: string;
  roomWidth: number;
  roomDepth: number;
  roomBudget: number;
  totalBudget: number;
  floorCount: number;
  totalRooms: number;
  roomPhotos?: Array<{ id: string; url: string }>;
  onView2D?: () => void;
  onView3D: () => void;
  onGoToProject: () => void;
}

export const PostGenerationRoomChoice: React.FC<PostGenerationRoomChoiceProps> = ({
  projectId,
  roomId,
  roomName,
  roomType = "bedroom",
  designStyle,
  roomWidth,
  roomDepth,
  roomBudget,
  totalBudget,
  floorCount,
  totalRooms,
  onView2D,
  onView3D,
  onGoToProject,
}) => {
  const router = useRouter();

  const handleSafeView2D = () => {
    if (onView2D) {
      onView2D();
    } else {
      const pId = projectId || (typeof window !== "undefined" ? localStorage.getItem("latest_project_id") : null) || "latest";
      const rId = roomId || "r-1-1";
      router.push(`/project/${pId}/rooms/${rId}/playground?tab=2d`);
    }
  };

  const handleSafeView3D = () => {
    if (onView3D) {
      onView3D();
    } else {
      const pId = projectId || (typeof window !== "undefined" ? localStorage.getItem("latest_project_id") : null) || "latest";
      const rId = roomId || "r-1-1";
      router.push(`/project/${pId}/rooms/${rId}/playground?tab=3d`);
    }
  };

  const handleSafeGoToProject = () => {
    if (onGoToProject) {
      onGoToProject();
    } else {
      const pId = projectId || (typeof window !== "undefined" ? localStorage.getItem("latest_project_id") : null) || "latest";
      router.push(`/project/${pId}`);
    }
  };

  const areaSqm = Number((roomWidth * roomDepth).toFixed(2));
  const areaSqft = Math.round(areaSqm * 10.7639);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Top Completion Celebration Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c131d] via-[#090e15] to-[#070b10] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PIPELINE STEPS COMPLETED
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
                {roomName}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                {designStyle} DNA
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your Room is Fully Designed!
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 font-light max-w-2xl leading-relaxed">
              Spatial CAD geometry, PBR architectural surfaces, calibrated clearances, and
              furnishing layouts have been synthesized. Choose either option below to open your
              room in the interactive workspace.
            </p>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {roomWidth}m × {roomDepth}m ({areaSqm} m² / {areaSqft} sqft)
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-teal-400" />
                <span>Room Budget: {formatIndianBudget(roomBudget)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>Architecture & Clearance Calibrated</span>
              </div>
            </div>
          </div>

          {/* Quick Dashboard Action */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
            <button
              onClick={handleSafeGoToProject}
              className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Skip to Project Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-500">
              {totalRooms} Rooms across {floorCount} Floor(s)
            </span>
          </div>
        </div>
      </div>

      {/* The 2 Core Options: Side-by-Side Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION 1: 2D Fully Designed Room */}
        <div
          onClick={handleSafeView2D}
          className="p-6 sm:p-7 rounded-3xl border border-white/[0.08] bg-[#090e15] hover:border-emerald-500/50 hover:bg-[#0c141e] shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between space-y-6 relative group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border border-slate-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-400 transition-all shadow-md group-hover:shadow-emerald-500/25">
                <Layers className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                CAD Blueprint & Plan
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                <span>Look at 2D Fully Designed Room</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">
                Inspect the calibrated architectural top-down CAD blueprint, dimensioned
                walls, spatial clearance paths, and optimal furniture placement layout.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-2 pt-1 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Exact CAD dimensions ({roomWidth}m × {roomDepth}m)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ergonomic furniture footprints & walk paths</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Top-down blueprint & photorealistic concept renders</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Launch 2D Plan View</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSafeView2D();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 group-hover:scale-105"
            >
              <span>Open 2D Workspace →</span>
            </button>
          </div>
        </div>

        {/* OPTION 2: 3D View of Room */}
        <div
          onClick={handleSafeView3D}
          className="p-6 sm:p-7 rounded-3xl border border-white/[0.08] bg-[#090e15] hover:border-cyan-400/50 hover:bg-[#0a131f] shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer flex flex-col justify-between space-y-6 relative group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border border-slate-800 text-cyan-400 group-hover:bg-gradient-to-tr group-hover:from-cyan-500 group-hover:to-teal-400 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all shadow-md group-hover:shadow-cyan-500/25">
                <Box className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Interactive 3D Digital Twin
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                <span>Look at 3D View of Room</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">
                Step into the real-time interactive 3D digital twin with {designStyle} PBR
                textures, architectural lighting, shadows, and 360° orbit spatial controls.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-2 pt-1 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Interactive 3D Three.js CAD Viewport</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>PBR Materials & {designStyle} lighting scheme</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>360° orbital rotation, zoom & camera clearance</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Launch 3D CAD Twin</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSafeView3D();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/25 group-hover:scale-105"
            >
              <span>Launch 3D Playground →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Footer Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{roomName}:</span>
          <span>Allocated budget of {formatIndianBudget(roomBudget)}</span>
          <span className="text-slate-600">·</span>
          <span>{totalRooms} room scenes generated across {floorCount} floor(s)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSafeView2D}
            className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open 2D Plan</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={handleSafeView3D}
            className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Launch 3D Playground</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={handleSafeGoToProject}
            className="text-slate-400 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Project Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostGenerationRoomChoice;
