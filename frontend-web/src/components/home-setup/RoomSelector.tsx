"use client";

import React from "react";
import {
  Check,
  DoorClosed,
  BedDouble,
  UtensilsCrossed,
  Bath,
  Sparkles,
  Home,
  Flame,
  Layers,
  Maximize2,
  CheckCircle2,
} from "lucide-react";

export interface RoomOption {
  name: string;
  room_type: string;
  area_sqm?: number;
  width_m?: number;
  length_m?: number;
  detected_imperial?: string;
  ground_truth_imperial?: string;
  confidence?: number;
}

interface RoomSelectorProps {
  rooms: RoomOption[];
  selectedRoom: string;
  onSelect: (roomName: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ rooms, selectedRoom, onSelect }) => {
  const getRoomIcon = (name: string, roomType: string) => {
    const lowerName = name.toLowerCase();
    const lowerType = roomType.toLowerCase();

    if (lowerName.includes("entire") || lowerName.includes("all")) {
      return <Home className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    }
    if (lowerType.includes("master") || lowerName.includes("master") || lowerType.includes("bed") || lowerName.includes("bed")) {
      return <BedDouble className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
    }
    if (lowerType.includes("kitchen") || lowerName.includes("kitchen")) {
      return <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
    if (lowerType.includes("dining") || lowerName.includes("dining")) {
      return <UtensilsCrossed className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
    if (lowerType.includes("bath") || lowerType.includes("toilet") || lowerName.includes("toilet") || lowerName.includes("bath")) {
      return <Bath className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    }
    if (lowerType.includes("puja") || lowerName.includes("puja")) {
      return <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    }
    if (lowerType.includes("balcony") || lowerName.includes("balcony") || lowerName.includes("sitout")) {
      return <Maximize2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (lowerType.includes("utility") || lowerName.includes("utility")) {
      return <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    }
    return <DoorClosed className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
  };

  const entireHomeOption: RoomOption = {
    name: "Entire Home (All Rooms)",
    room_type: "entire_home",
    area_sqm: rooms.reduce((acc, r) => acc + (r.area_sqm || 0), 0),
  };

  const isEntireSelected = selectedRoom === entireHomeOption.name;

  return (
    <div className="bg-white dark:bg-[#090e15] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Interior Design & Style Focus
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Choose Room to Style
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Select a target room for custom interior styling, or generate a unified aesthetic for your entire home.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{rooms.length} Rooms Verified</span>
        </div>
      </div>

      {/* Primary Selection: Entire Home Option */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => onSelect(entireHomeOption.name)}
          className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            isEntireSelected
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10"
              : "border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] hover:border-emerald-300 dark:hover:border-emerald-500/30"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${isEntireSelected ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                  Entire Home (All Rooms)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Apply consistent Design DNA across all {rooms.length} zones ({entireHomeOption.area_sqm?.toFixed(1)} m² total area)
              </p>
            </div>
          </div>

          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              isEntireSelected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            }`}
          >
            {isEntireSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>
      </div>

      {/* Individual Room Grid */}
      <div className="text-xs font-mono uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold mb-3 px-1">
        Or Style an Individual Room
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => {
          const active = selectedRoom === r.name;
          return (
            <button
              key={r.name}
              type="button"
              onClick={() => onSelect(r.name)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                active
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10"
                  : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0c121d] hover:border-gray-300 dark:hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800/80 border border-gray-200/60 dark:border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {getRoomIcon(r.name, r.room_type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold truncate ${active ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                      {r.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {r.area_sqm && <span>{r.area_sqm} m²</span>}
                    {r.width_m && r.length_m && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[11px]">{r.width_m.toFixed(1)}m × {r.length_m.toFixed(1)}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                }`}
              >
                {active && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Confirmation Footnote */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#070b10] border border-gray-200 dark:border-white/[0.06] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-gray-600 dark:text-slate-300">
            Current Focus: <span className="font-bold text-gray-900 dark:text-white">{selectedRoom}</span>
            {selectedRoom === entireHomeOption.name
              ? " — full house styling will generate unified palettes & multi-room furniture sets."
              : " — next, choose the Design Style DNA (Japandi, Industrial, Minimalist, etc.) for this space."}
          </p>
        </div>
      </div>
    </div>
  );
};
