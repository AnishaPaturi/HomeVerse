"use client";

import React from "react";
import { BedDouble, Bath, DoorClosed, Plus, Minus } from "lucide-react";

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
    onChange(selectedBhk, selectedBhk, Math.max(1, selectedBhk - 1), Math.max(1, selectedBhk - 1));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Room Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">Select the number of bedrooms, bathrooms, and living zones to layout.</p>
      </div>

      <div className="mb-8">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-3">
          Standard Configuration
        </label>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {bhkPresets.map((val) => {
            const active = bhk === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleBhkChange(val)}
                className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                  active
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-black ring-2 ring-indigo-600/30"
                    : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 font-bold hover:border-gray-300"
                }`}
              >
                {val} BHK
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">Bedrooms</span>
              <span className="text-[11px] text-gray-400">Total sleeping suites</span>
            </div>
          </div>
          <span className="text-lg font-black text-indigo-600">{bedroomsCount}</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bath className="w-5 h-5 text-teal-500" />
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">Bathrooms</span>
              <span className="text-[11px] text-gray-400">Attached & common</span>
            </div>
          </div>
          <span className="text-lg font-black text-teal-600">{bathroomsCount}</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DoorClosed className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white block">Balconies</span>
              <span className="text-[11px] text-gray-400">Outdoor sit-outs</span>
            </div>
          </div>
          <span className="text-lg font-black text-amber-600">{balconiesCount}</span>
        </div>
      </div>
    </div>
  );
};
