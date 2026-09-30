"use client";

import React from "react";
import { Room } from "@/types";
import { Compass, Eye } from "lucide-react";

interface RoomNavigationProps {
  rooms: Room[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
}

export const RoomNavigation: React.FC<RoomNavigationProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
}) => {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 font-mono text-xs select-none">
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 font-bold text-[11px] border-r border-white/10">
        <Compass className="w-3.5 h-3.5 text-teal-400" />
        <span>ROOM</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`px-3 py-1.5 rounded-xl font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              <Eye className={`w-3 h-3 ${isActive ? "text-slate-950" : "text-teal-400"}`} />
              <span>{room.name}</span>
              {room.area_sqm ? (
                <span className={`text-[9px] ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                  ({room.area_sqm}m²)
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoomNavigation;
