"use client";

import React from "react";
import { Check, Edit3, Sparkles } from "lucide-react";

interface DetectedRoom {
  name: string;
  room_type: string;
  width_m: number;
  length_m: number;
  area_sqm: number;
  confidence: number;
}

interface DimensionConfirmationProps {
  rooms: DetectedRoom[];
  onConfirm: () => void;
  onCorrect: () => void;
}

export const DimensionConfirmation: React.FC<DimensionConfirmationProps> = ({
  rooms,
  onConfirm,
  onCorrect,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Computer Vision
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Detected Rooms & Dimensions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Our architectural vision model extracted these room dimensions from your blueprint.
          </p>
        </div>

        <button
          type="button"
          onClick={onCorrect}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Adjust Measurements
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800 mb-6">
        {rooms.map((r, idx) => (
          <div key={idx} className="py-3.5 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">{r.name}</span>
              <span className="text-xs text-gray-400">
                {r.length_m}m × {r.width_m}m • {(r.length_m * 3.28).toFixed(1)}ft × {(r.width_m * 3.28).toFixed(1)}ft
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">
                {r.area_sqm} m² ({(r.area_sqm * 10.764).toFixed(0)} sq ft)
              </span>
              <span className="text-[11px] text-emerald-500 font-semibold">
                {r.confidence > 1 ? Math.round(r.confidence) : Math.round(r.confidence * 100)}% detection accuracy
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all text-sm flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        Confirm Measurements & Continue
      </button>
    </div>
  );
};
