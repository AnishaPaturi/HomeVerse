"use client";

import React from "react";
import { Sparkles, Maximize2 } from "lucide-react";

interface DimensionOverlayProps {
  rooms: Array<{ name: string; width_m: number; length_m: number; coordinates?: any }>;
}

export const DimensionOverlay: React.FC<DimensionOverlayProps> = ({ rooms }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Maximize2 className="w-5 h-5 text-indigo-500" />
        <h4 className="text-base font-bold text-gray-900 dark:text-white">Spatial Dimension Markers</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rooms.map((r, i) => (
          <div key={i} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{r.name}</span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
              {r.length_m}m × {r.width_m}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
