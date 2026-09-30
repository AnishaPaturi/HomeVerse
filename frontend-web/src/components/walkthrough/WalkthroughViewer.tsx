"use client";

import React, { useState } from "react";
import { Floor, Room } from "@/types";
import FloorNavigation from "./FloorNavigation";
import RoomNavigation from "./RoomNavigation";
import RoomScene from "@/components/three-d/RoomScene";
import HouseScene from "@/components/three-d/HouseScene";
import { Maximize2, Minimize2, Eye, Compass, Layers, ShieldCheck } from "lucide-react";

interface WalkthroughViewerProps {
  floors: Floor[];
  rooms: Room[];
  initialFloorId?: string;
  initialRoomId?: string;
  projectName?: string;
}

export const WalkthroughViewer: React.FC<WalkthroughViewerProps> = ({
  floors,
  rooms,
  initialFloorId,
  initialRoomId,
  projectName = "HomeVerse Residence",
}) => {
  const [activeFloorId, setActiveFloorId] = useState<string>(
    initialFloorId || (floors[0]?.id ?? "")
  );
  const currentFloorRooms = rooms.filter((r) => r.floor_id === activeFloorId);
  const [activeRoomId, setActiveRoomId] = useState<string>(
    initialRoomId || (currentFloorRooms[0]?.id ?? rooms[0]?.id ?? "")
  );
  const [viewMode, setViewMode] = useState<"room" | "house">("room");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  const handleFloorChange = (floorId: string) => {
    setActiveFloorId(floorId);
    const roomsOnFloor = rooms.filter((r) => r.floor_id === floorId);
    if (roomsOnFloor.length > 0) {
      setActiveRoomId(roomsOnFloor[0].id);
    }
  };

  return (
    <div
      className={`relative bg-[#070b10] border border-white/10 rounded-3xl overflow-hidden flex flex-col ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none border-none" : "w-full h-[650px]"
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Navigation Controls Group */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {floors.length > 0 && (
            <FloorNavigation
              floors={floors}
              activeFloorId={activeFloorId}
              onSelectFloor={handleFloorChange}
            />
          )}

          {viewMode === "room" && currentFloorRooms.length > 0 && (
            <RoomNavigation
              rooms={currentFloorRooms}
              activeRoomId={activeRoomId}
              onSelectRoom={(id) => setActiveRoomId(id)}
            />
          )}
        </div>

        {/* View Mode & Fullscreen Action Group */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex p-1 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode("room")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                viewMode === "room"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Room View
            </button>
            <button
              onClick={() => setViewMode("house")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                viewMode === "house"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Whole House
            </button>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === "room" ? (
          <RoomScene
            dimensions={{
              width: activeRoom?.width_meters || 5,
              length: activeRoom?.length_meters || 6,
            }}
            viewAngle="walkthrough"
          />
        ) : (
          <HouseScene
            floors={floors}
            rooms={rooms}
            selectedFloorId={activeFloorId}
            onSelectFloor={handleFloorChange}
            onSelectRoom={(id) => {
              setActiveRoomId(id);
              setViewMode("room");
            }}
          />
        )}
      </div>

      {/* Bottom Status Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {viewMode === "room"
              ? `Walking in: ${activeRoom?.name || "Room"} (${activeRoom?.width_meters || 5}m × ${activeRoom?.length_meters || 6}m)`
              : `Whole House Cutaway Overview · ${floors.length} Floors`}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-400">
          <span>Drag to orbit · Pinch to zoom · Shift+Drag to pan</span>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughViewer;
