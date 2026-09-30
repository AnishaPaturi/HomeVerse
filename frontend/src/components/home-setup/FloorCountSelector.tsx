"use client";

import React from "react";
import { Layers, Check } from "lucide-react";

interface FloorCountSelectorProps {
  propertyType: "independent" | "apartment";
  floorCount: number;
  onChange: (count: number) => void;
}

export const FloorCountSelector: React.FC<FloorCountSelectorProps> = ({
  propertyType,
  floorCount,
  onChange,
}) => {
  if (propertyType === "apartment") {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Number of Floors</h2>
        <p className="text-sm text-gray-500 mb-4">Apartment configurations are modeled across a single cohesive floor plan.</p>
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span className="text-base font-bold text-gray-900 dark:text-white">Single Level (1 Floor)</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-600 text-white rounded-full">Standard</span>
        </div>
      </div>
    );
  }

  const floorOptions = [
    { count: 1, label: "1 Floor (G)", desc: "Ground floor only" },
    { count: 2, label: "2 Floors (G + 1)", desc: "Ground + First Floor" },
    { count: 3, label: "3 Floors (G + 2)", desc: "Ground + 2 Floors" },
    { count: 4, label: "4+ Floors (G + 3+)", desc: "Multi-level Villa / Mansion" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">How many floors are in this house?</h2>
      <p className="text-sm text-gray-500 mb-6">This configures floor-level navigation, budget splits, and 3D multi-level vertical stacking.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {floorOptions.map((opt) => {
          const active = floorCount === opt.count;
          return (
            <button
              key={opt.count}
              type="button"
              onClick={() => onChange(opt.count)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                active
                  ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                  : "border-gray-200 dark:border-zinc-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-base font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                  {opt.label}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 dark:border-zinc-700"
                  }`}
                >
                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-gray-400">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
