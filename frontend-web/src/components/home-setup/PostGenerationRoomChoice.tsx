"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Sparkles,
  Layers,
  Box,
  ArrowRight,
  Maximize2,
  Compass,
  Ruler,
  Palette,
  IndianRupee,
  Eye,
  Camera,
  RotateCw,
  Sun,
  LayoutGrid,
} from "lucide-react";
import BlueprintEditor2D from "@/components/playground/BlueprintEditor2D";
import RoomScene from "@/components/three-d/RoomScene";
import { FurnitureObjectProps } from "@/components/three-d/FurnitureObject";
import { getDefaultFurnitureForRoom, RoomObject } from "@/lib/defaultRoomDesigns";
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
  onView2D: () => void;
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
  roomPhotos = [],
  onView2D,
  onView3D,
  onGoToProject,
}) => {
  // Primary active viewing mode: "2d" (2D fully designed look) or "3d" (3D view)
  const [activeMode, setActiveMode] = useState<"2d" | "3d">("3d");

  // Sub-view in 2D mode: "blueprint" (CAD 2D plan) or "render" (photorealistic 2D interior perspective)
  const [twoDSubView, setTwoDSubView] = useState<"blueprint" | "render">("blueprint");
  const [selectedPerspective, setSelectedPerspective] = useState<1 | 2>(1);

  // 3D Lighting preset
  const [lightingPreset, setLightingPreset] = useState<"warm" | "neutral" | "luxury">("warm");

  // Generate authentic room furniture layout based on dimensions & style
  const defaultObjects: RoomObject[] = useMemo(() => {
    return getDefaultFurnitureForRoom(roomName, roomType, roomWidth, roomDepth, designStyle);
  }, [roomName, roomType, roomWidth, roomDepth, designStyle]);

  // Convert for 3D RoomScene
  const furniture3D: FurnitureObjectProps[] = useMemo(() => {
    return defaultObjects.map((obj) => ({
      id: obj.id,
      name: obj.object_type.replace("_", " ").toUpperCase(),
      type: obj.object_type,
      position: [obj.position_x, 0, obj.position_z],
      rotation: [0, obj.rotation, 0],
      scale: [obj.scale, obj.scale, obj.scale],
      color: obj.material.startsWith("#") ? obj.material : "#334155",
    }));
  }, [defaultObjects]);

  const areaSqm = Number((roomWidth * roomDepth).toFixed(2));
  const areaSqft = Math.round(areaSqm * 10.7639);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Top Completion Celebration Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c131d] via-[#090e15] to-[#070b10] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

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
              furnishing layouts have been synthesized. Choose either option below to inspect
              the <strong className="text-white font-medium">2D fully designed look</strong> or{" "}
              <strong className="text-white font-medium">3D view</strong> of your room.
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
                <span>{defaultObjects.length} Furniture Placements</span>
              </div>
            </div>
          </div>

          {/* Quick Dashboard Action */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
            <button
              onClick={onGoToProject}
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

      {/* The 2 Core Required Options: Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION 1: 2D Fully Designed Look */}
        <div
          onClick={() => setActiveMode("2d")}
          className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-5 relative group ${
            activeMode === "2d"
              ? "bg-[#0a111a] border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30"
              : "bg-[#090e15] border-white/[0.08] hover:border-slate-700 hover:bg-[#0c121b]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeMode === "2d"
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                    : "bg-slate-950 border border-slate-800 text-emerald-400"
                }`}
              >
                <Layers className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  activeMode === "2d"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                Option 1 · CAD Blueprint
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                <span>Look at 2D Fully Designed Room</span>
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">
                Inspect the calibrated architectural top-down CAD blueprint, dimensioned
                walls, spatial clearance paths, and optimal furniture placement layout.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-1.5 pt-1 text-xs font-mono text-slate-300">
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
                <span>Top-down blueprint & photorealistic 2D renders</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMode("2d");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeMode === "2d"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
              }`}
            >
              {activeMode === "2d" ? "✓ Viewing 2D Below" : "Inspect 2D Look"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView2D();
              }}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5"
            >
              <span>Open 2D Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OPTION 2: 3D View of the Fully Designed Room */}
        <div
          onClick={() => setActiveMode("3d")}
          className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-5 relative group ${
            activeMode === "3d"
              ? "bg-[#0a111a] border-cyan-400 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-400/30"
              : "bg-[#090e15] border-white/[0.08] hover:border-slate-700 hover:bg-[#0c121b]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  activeMode === "3d"
                    ? "bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25"
                    : "bg-slate-950 border border-slate-800 text-cyan-400"
                }`}
              >
                <Box className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  activeMode === "3d"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                Option 2 · 3D Digital Twin
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                <span>Look at 3D View of Room</span>
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">
                Step into the real-time interactive 3D digital twin with {designStyle} PBR
                textures, architectural lighting, shadows, and 360° orbit spatial controls.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-1.5 pt-1 text-xs font-mono text-slate-300">
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

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMode("3d");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeMode === "3d"
                  ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800"
              }`}
            >
              {activeMode === "3d" ? "✓ Viewing 3D Below" : "Inspect 3D View"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView3D();
              }}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5"
            >
              <span>Launch 3D Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Interactive In-Place Viewport Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#090e15] border border-white/[0.08] shadow-2xl space-y-6">
        {/* Viewport Top Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {/* Direct Dual Mode Switcher */}
            <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveMode("2d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeMode === "2d"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Fully Designed Look</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("3d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeMode === "3d"
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Room View</span>
              </button>
            </div>

            {/* Sub-toggle for 2D mode */}
            {activeMode === "2d" && (
              <div className="hidden md:flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setTwoDSubView("blueprint")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    twoDSubView === "blueprint"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  CAD Blueprint Plan
                </button>
                <button
                  type="button"
                  onClick={() => setTwoDSubView("render")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    twoDSubView === "render"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Photorealistic Render
                </button>
              </div>
            )}

            {/* Sub-toggle for 3D Lighting preset */}
            {activeMode === "3d" && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Lighting:</span>
                {(["warm", "neutral", "luxury"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLightingPreset(preset)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      lightingPreset === preset
                        ? "bg-amber-500/20 text-amber-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Launch Dedicated Full Workspace Button */}
          <div>
            {activeMode === "2d" ? (
              <button
                type="button"
                onClick={onView2D}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-105"
              >
                <Layers className="w-4 h-4" />
                <span>Launch Full 2D Workspace →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onView3D}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/25 hover:scale-105"
              >
                <Box className="w-4 h-4" />
                <span>Launch Full 3D CAD Playground →</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewport Display Area */}
        <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-[#070b10] relative">
          {activeMode === "2d" ? (
            twoDSubView === "blueprint" ? (
              <div className="w-full h-full relative">
                <BlueprintEditor2D
                  objects={defaultObjects}
                  roomWidth={roomWidth}
                  roomDepth={roomDepth}
                />
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>
                    2D CAD Plan View · {roomWidth}m × {roomDepth}m ({areaSqm} m²)
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative bg-slate-950">
                <img
                  src={
                    selectedPerspective === 1
                      ? "/rooms/master-bed-room-1.png"
                      : "/rooms/master-bed-room-2.png"
                  }
                  alt={`${roomName} 2D Designed Render`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      2D Photorealistic Perspective ({designStyle} DNA)
                    </span>
                  </div>

                  <div className="flex p-0.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setSelectedPerspective(1)}
                      className={`px-2.5 py-1 rounded-lg ${
                        selectedPerspective === 1
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Daylight Concept
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPerspective(2)}
                      className={`px-2.5 py-1 rounded-lg ${
                        selectedPerspective === 2
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Ambient Concept
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full relative">
              <RoomScene
                dimensions={{ width: roomWidth, length: roomDepth, height: 3.0 }}
                furniture={furniture3D}
                wallColor="#f8fafc"
                floorColor={designStyle.toLowerCase() === "minimalist" ? "#e2e8f0" : "#d4b896"}
                lightingPreset={lightingPreset}
              />

              {/* 3D Viewport Controls Overlay */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono text-cyan-400 flex items-center gap-2">
                <Box className="w-3.5 h-3.5" />
                <span>
                  3D Parametric CAD Twin · {roomWidth}m × {roomDepth}m ({furniture3D.length} Items)
                </span>
              </div>

              <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
                <span>Click & drag to rotate · Scroll to zoom · Right-click to pan</span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Footer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{roomName}:</span>
            <span>Allocated budget of {formatIndianBudget(roomBudget)}</span>
            <span className="text-slate-600">·</span>
            <span>{totalRooms} room scenes generated</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onView2D}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full 2D Plan</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={onView3D}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Full 3D Playground</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={onGoToProject}
              className="text-slate-400 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Project Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostGenerationRoomChoice;
