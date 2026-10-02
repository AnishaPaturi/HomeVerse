"use client";

import React from "react";
import { BedDouble, Bath, DoorClosed, Plus, Minus, Sparkles, Check, Home } from "lucide-react";

interface RoomCountSelectorProps {
  bhk: number;
  bedroomsCount: number;
  bathroomsCount: number;
  balconiesCount: number;
  onChange: (bhk: number, beds: number, baths: number, balconies: number) => void;
}

export const RoomCountSelector: React.FC<RoomCountSelectorProps> = ({
  bhk,
  bedroomsCount,
  bathroomsCount,
  balconiesCount,
  onChange,
}) => {
  const bhkPresets = [1, 2, 3, 4, 5];

  const handleBhkChange = (selectedBhk: number) => {
    const beds = selectedBhk;
    const baths = Math.max(1, selectedBhk - 1);
    const bals = Math.max(1, selectedBhk - 1);
    onChange(selectedBhk, beds, baths, bals);
  };

  const updateBedrooms = (count: number) => {
    const safeCount = Math.max(1, Math.min(12, count));
    onChange(safeCount, safeCount, bathroomsCount, balconiesCount);
  };

  const updateBathrooms = (count: number) => {
    const safeCount = Math.max(1, Math.min(10, count));
    onChange(bhk, bedroomsCount, safeCount, balconiesCount);
  };

  const updateBalconies = (count: number) => {
    const safeCount = Math.max(0, Math.min(8, count));
    onChange(bhk, bedroomsCount, bathroomsCount, safeCount);
  };

  const isStandardPreset = bhkPresets.includes(bedroomsCount) && bhk === bedroomsCount;

  return (
    <div className="bg-[#090e15] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-mono font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SPATIAL ROOM CONFIGURATION</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Configure Rooms, Bathrooms & Balconies
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
          Adjust the number of bedrooms, bathrooms, and balconies below using the steppers or type custom counts.
        </p>
      </div>

      {/* Quick BHK Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Quick BHK Presets
          </label>
          <span className="text-[11px] font-mono text-emerald-400">
            {isStandardPreset ? `${bhk} BHK Selected` : "Custom Layout"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {bhkPresets.map((val) => {
            const active = bedroomsCount === val && bhk === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleBhkChange(val)}
                className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer font-mono text-xs sm:text-sm ${
                  active
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {val} BHK
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Room Controls */}
      <div className="space-y-4">
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
          Individual Space Controls (Editable)
        </label>

        {/* 1. Bedrooms / Suites */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-mono">Bedrooms</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {bedroomsCount} Room{bedroomsCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-light block mt-0.5">
                Master suite, guest rooms, kids rooms, and sleeping zones
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => updateBedrooms(bedroomsCount - 1)}
              disabled={bedroomsCount <= 1}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Decrease bedrooms"
              aria-label="Decrease bedrooms"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={1}
              max={12}
              value={bedroomsCount}
              onChange={(e) => updateBedrooms(parseInt(e.target.value) || 1)}
              className="w-16 h-10 py-1 text-center font-mono font-bold text-lg text-emerald-400 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              aria-label="Bedrooms count"
            />

            <button
              type="button"
              onClick={() => updateBedrooms(bedroomsCount + 1)}
              disabled={bedroomsCount >= 12}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Increase bedrooms"
              aria-label="Increase bedrooms"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Bathrooms */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Bath className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-mono">Bathrooms</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {bathroomsCount} Bath{bathroomsCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-light block mt-0.5">
                Attached master ensuite, common washrooms, powder rooms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => updateBathrooms(bathroomsCount - 1)}
              disabled={bathroomsCount <= 1}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Decrease bathrooms"
              aria-label="Decrease bathrooms"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={1}
              max={10}
              value={bathroomsCount}
              onChange={(e) => updateBathrooms(parseInt(e.target.value) || 1)}
              className="w-16 h-10 py-1 text-center font-mono font-bold text-lg text-teal-400 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              aria-label="Bathrooms count"
            />

            <button
              type="button"
              onClick={() => updateBathrooms(bathroomsCount + 1)}
              disabled={bathroomsCount >= 10}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Increase bathrooms"
              aria-label="Increase bathrooms"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Balconies */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <DoorClosed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-mono">Balconies</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {balconiesCount} Balcon{balconiesCount !== 1 ? "ies" : "y"}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-light block mt-0.5">
                Living sit-outs, utility balconies, and view terraces
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => updateBalconies(balconiesCount - 1)}
              disabled={balconiesCount <= 0}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Decrease balconies"
              aria-label="Decrease balconies"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min={0}
              max={8}
              value={balconiesCount}
              onChange={(e) => updateBalconies(parseInt(e.target.value) || 0)}
              className="w-16 h-10 py-1 text-center font-mono font-bold text-lg text-amber-400 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              aria-label="Balconies count"
            />

            <button
              type="button"
              onClick={() => updateBalconies(balconiesCount + 1)}
              disabled={balconiesCount >= 8}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              title="Increase balconies"
              aria-label="Increase balconies"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Breakdown Card */}
      <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Total Configured: <strong className="text-white">{bedroomsCount} Bed</strong> +{" "}
            <strong className="text-white">{bathroomsCount} Bath</strong> +{" "}
            <strong className="text-white">{balconiesCount} Balcony</strong> + Living & Kitchen
          </span>
        </div>
        <div className="text-emerald-400 font-bold shrink-0">
          {2 + bedroomsCount + bathroomsCount + balconiesCount} Total Spatial Zones
        </div>
      </div>
    </div>
  );
};
