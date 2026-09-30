"use client";

import React from "react";
import { Floor } from "@/types";
import { Layers } from "lucide-react";

interface FloorNavigationProps {
  floors: Floor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
}

export const FloorNavigation: React.FC<FloorNavigationProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
}) => {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 font-mono text-xs select-none">
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 font-bold text-[11px] border-r border-white/10">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span>FLOOR</span>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {floors.map((floor) => {
          const isActive = floor.id === activeFloorId;
          return (
            <button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              <span>{floor.name || `Floor ${floor.level}`}</span>
              {floor.room_count ? (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {floor.room_count}R
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloorNavigation;
