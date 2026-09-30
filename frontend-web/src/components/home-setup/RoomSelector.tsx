"use client";

import React from "react";
import { Check, DoorClosed, BedDouble, UtensilsCrossed, Bath, Sparkles } from "lucide-react";

interface RoomOption {
  name: string;
  room_type: string;
  area_sqm?: number;
}

interface RoomSelectorProps {
  rooms: RoomOption[];
  selectedRoom: string;
  onSelect: (roomName: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ rooms, selectedRoom, onSelect }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Choose Room to Design First</h2>
        <p className="text-sm text-gray-500 mt-1">Select the starting anchor room for AI interior design generation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => {
          const active = selectedRoom === r.name;
          return (
            <button
              key={r.name}
              type="button"
              onClick={() => onSelect(r.name)}
              className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                active
                  ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                  {r.room_type === "Living Room" || r.name.includes("Living") ? (
                    <DoorClosed className="w-5 h-5 text-indigo-500" />
                  ) : r.room_type === "Kitchen" || r.name.includes("Kitchen") ? (
                    <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                  ) : r.room_type === "Bedroom" || r.name.includes("Bed") ? (
                    <BedDouble className="w-5 h-5 text-teal-500" />
                  ) : (
                    <Bath className="w-5 h-5 text-sky-500" />
                  )}
                </div>
                <div>
                  <span className={`text-sm font-bold block ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                    {r.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {r.area_sqm ? `${r.area_sqm} m²` : "Custom Area"}
                  </span>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 dark:border-zinc-700"
                }`}
              >
                {active && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
