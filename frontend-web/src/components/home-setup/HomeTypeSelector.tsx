"use client";

import React from "react";
import { Building2, Home as HomeIcon, Check } from "lucide-react";

interface HomeTypeSelectorProps {
  selectedType: "independent" | "apartment";
  onSelect: (type: "independent" | "apartment") => void;
}

export const HomeTypeSelector: React.FC<HomeTypeSelectorProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          What type of property are you designing?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select whether this is an apartment unit or an independent multi-story house.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect("apartment")}
          className={`p-6 rounded-2xl border text-left transition-all relative ${
            selectedType === "apartment"
              ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
              : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Apartment / Flat</h3>
          <p className="text-xs text-gray-500 mt-1">Single-floor residential unit within a society or community block.</p>
          {selectedType === "apartment" && (
            <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect("independent")}
          className={`p-6 rounded-2xl border text-left transition-all relative ${
            selectedType === "independent"
              ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
              : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <HomeIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Independent House / Villa</h3>
          <p className="text-xs text-gray-500 mt-1">Multi-level house, bungalow, or villa with multiple floors and terrace.</p>
          {selectedType === "independent" && (
            <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
