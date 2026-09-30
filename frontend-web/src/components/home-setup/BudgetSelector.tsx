"use client";

import React, { useState } from "react";
import { DollarSign, ShieldAlert, Sparkles, Check, Sliders, IndianRupee } from "lucide-react";
import { formatCurrency, formatIndianBudget } from "@/lib/utils";

interface BudgetSelectorProps {
  initialBudget?: number;
  initialFlexibility?: "Strict" | "Moderate" | "Flexible";
  onChange: (budget: number, flexibility: "Strict" | "Moderate" | "Flexible") => void;
}

const BUDGET_PRESETS = [
  { label: "₹5 – ₹10 Lakhs", min: 500000, max: 1000000, defaultVal: 800000 },
  { label: "₹10 – ₹20 Lakhs", min: 1000000, max: 2000000, defaultVal: 1500000 },
  { label: "₹20 – ₹35 Lakhs", min: 2000000, max: 3500000, defaultVal: 2500000 },
  { label: "₹35 – ₹50 Lakhs", min: 3500000, max: 5000000, defaultVal: 4000000 },
  { label: "₹50 Lakhs – ₹1 Crore", min: 5000000, max: 10000000, defaultVal: 7500000 },
  { label: "₹1 Crore+", min: 10000000, max: 30000000, defaultVal: 12500000 },
];

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({
  initialBudget = 2500000,
  initialFlexibility = "Moderate",
  onChange,
}) => {
  const [budget, setBudget] = useState<number>(initialBudget);
  const [selectedPreset, setSelectedPreset] = useState<string>("₹20 – ₹35 Lakhs");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(initialBudget.toString());
  const [flexibility, setFlexibility] = useState<"Strict" | "Moderate" | "Flexible">(initialFlexibility);

  const handlePresetSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setIsCustom(false);
    setBudget(preset.defaultVal);
    setCustomInput(preset.defaultVal.toString());
    onChange(preset.defaultVal, flexibility);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBudget(val);
    setCustomInput(val.toString());
    onChange(val, flexibility);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomInput(raw);
    const num = Number(raw) || 0;
    setBudget(num);
    setIsCustom(true);
    onChange(num, flexibility);
  };

  const handleFlexibilityChange = (flex: "Strict" | "Moderate" | "Flexible") => {
    setFlexibility(flex);
    onChange(budget, flex);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-semibold mb-2">
          <IndianRupee className="w-3.5 h-3.5" />
          Financial Foundation
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          What&apos;s your budget for this home?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This established budget actively calibrates AI recommendations, furniture scale, material tiering, and shopping items.
        </p>
      </div>

      {/* Preset Pills Grid */}
      <div className="mb-8">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-3">
          Choose your approximate budget tier
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BUDGET_PRESETS.map((preset) => {
            const active = selectedPreset === preset.label && !isCustom;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  active
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                    : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-transparent"
                }`}
              >
                <div>
                  <span className={`text-sm font-bold block ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                    {preset.label}
                  </span>
                  <span className="text-xs text-gray-400">Typical 2-3 BHK Interior</span>
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

          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              isCustom
                ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-transparent"
            }`}
          >
            <div>
              <span className={`text-sm font-bold block ${isCustom ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                Custom Budget
              </span>
              <span className="text-xs text-gray-400">Input exact figure</span>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                isCustom ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 dark:border-zinc-700"
              }`}
            >
              {isCustom && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* Slider + Custom Input Box */}
      <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs text-gray-500 font-medium">Selected Budget Amount</span>
            <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-1">
              {formatIndianBudget(budget)}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5">
            <span className="text-gray-400 font-bold">₹</span>
            <input
              type="text"
              value={customInput}
              onChange={handleCustomInputChange}
              className="bg-transparent font-bold text-gray-900 dark:text-white text-base focus:outline-none w-32"
              placeholder="e.g. 2500000"
            />
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={500000}
          max={10000000}
          step={50000}
          value={Math.min(10000000, Math.max(500000, budget))}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />

        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 font-medium">
          <span>₹5 Lakhs</span>
          <span>₹25 Lakhs</span>
          <span>₹50 Lakhs</span>
          <span>₹1 Crore</span>
        </div>
      </div>

      {/* Budget Flexibility */}
      <div>
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
          Budget Flexibility
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Tells the AI whether it can suggest upgrades or value alternatives that slightly exceed target ceilings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: "Strict",
                title: "Strict",
                desc: "Never exceed budget (0% tolerance). Hard cost cap on all rooms.",
              },
              {
                id: "Moderate",
                title: "Moderate",
                desc: "Can exceed up to 5% if high-durability aesthetic benefits warrant it.",
              },
              {
                id: "Flexible",
                title: "Flexible",
                desc: "Prioritize luxury & materials with up to 15% budget tolerance.",
              },
            ] as const
          ).map((item) => {
            const active = flexibility === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleFlexibilityChange(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  active
                    ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-600/30"
                    : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                    {item.title}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 dark:border-zinc-700"
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
