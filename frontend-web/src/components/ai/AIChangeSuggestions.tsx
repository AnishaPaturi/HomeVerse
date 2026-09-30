"use client";

import React, { useState } from "react";
import { formatIndianBudget } from "@/lib/utils";
import { AlertCircle, Check, ArrowRight, Sparkles, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { AIChangeSuggestion } from "@/types/ai";

interface CheaperAlternative {
  name: string;
  price: number;
  savings: number;
  retailer?: string;
}

interface AIChangeSuggestionsProps {
  suggestion?: AIChangeSuggestion;
  currentRoomCost?: number;
  newRoomCost?: number;
  deltaCost?: number;
  impactMessage?: string;
  alternatives?: CheaperAlternative[];
  onApply?: () => void;
  onSelectAlternative?: (alt: CheaperAlternative) => void;
}

export const AIChangeSuggestions: React.FC<AIChangeSuggestionsProps> = ({
  suggestion = {
    element: "Sofa",
    action: "resize",
    from_value: "3-Seater Standard",
    to_value: "5-Seater Modular L-Sectional",
    cost_difference: 35000,
    reason: "Expanded footprint requires higher-density foam and additional fabric yardage.",
  },
  currentRoomCost = 420000,
  newRoomCost = 455000,
  deltaCost = 35000,
  impactMessage = "This change is estimated to increase the room budget by ₹35,000.",
  alternatives = [
    { name: "Modular 4-Seater with Chaise", price: 435000, savings: 20000, retailer: "HomeVerse Curated" },
    { name: "Compact L-Sectional with Storage Ottoman", price: 428000, savings: 27000, retailer: "Urban Living Co." }
  ],
  onApply,
  onSelectAlternative,
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Budget Delta Analysis</h4>
          <span className="text-[11px] text-gray-400">Financial guardrail simulation</span>
        </div>
      </div>

      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4">
        {impactMessage}
      </p>

      {/* Cost Comparison Pill */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 mb-4">
        <div>
          <span className="text-[11px] text-gray-400 font-medium block">Current Room Budget:</span>
          <span className="text-base font-bold text-gray-700 dark:text-gray-300">
            {formatIndianBudget(currentRoomCost)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-indigo-500 font-medium block">New Room Budget:</span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
            {formatIndianBudget(newRoomCost)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Apply Modification (+{formatIndianBudget(deltaCost)})
        </button>

        <button
          type="button"
          onClick={() => setShowAlternatives((prev) => !prev)}
          className="w-full sm:w-auto py-3 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {showAlternatives ? "Hide Alternatives" : "Show Cheaper Alternatives"}
          {showAlternatives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Cheaper Alternatives Drawer */}
      {showAlternatives && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
            Value-Engineered Substitutions
          </span>
          {alternatives.map((alt, i) => (
            <div
              key={i}
              className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">{alt.name}</span>
                <span className="text-[10px] text-gray-400">{alt.retailer || "Curated Catalog"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    {formatIndianBudget(alt.price)}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    Save {formatIndianBudget(alt.savings)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
