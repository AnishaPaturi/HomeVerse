"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, IndianRupee } from "lucide-react";
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
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(initialBudget.toString());
  const [flexibility, setFlexibility] = useState<"Strict" | "Moderate" | "Flexible">(initialFlexibility);

  useEffect(() => {
    if (initialBudget) {
      setBudget(initialBudget);
      setCustomInput(initialBudget.toString());
    }
  }, [initialBudget]);

  const handleSetBudget = (val: number) => {
    const safeVal = Math.max(500000, val);
    setBudget(safeVal);
    setCustomInput(safeVal.toString());
    setIsCustom(false);
    onChange(safeVal, flexibility);
  };

  const handlePresetSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    handleSetBudget(preset.defaultVal);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBudget(val);
    setCustomInput(val.toString());
    setIsCustom(false);
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

  // Slider boundaries
  const sliderMin = 500000; // ₹5 Lakhs
  const sliderMax = Math.max(10000000, budget); // ₹1 Crore (or dynamic if custom > 1 Cr)

  // Accurately calibrated marks across the slider track
  const sliderMarks = [
    { label: "₹5 Lakhs", value: 500000 },
    { label: "₹25 Lakhs", value: 2500000 },
    { label: "₹50 Lakhs", value: 5000000 },
    { label: "₹75 Lakhs", value: 7500000 },
    { label: "₹1 Crore", value: 10000000 },
  ];

  // Calculate percentage of budget on slider for visual track fill
  const sliderPercent = Math.min(
    100,
    Math.max(0, ((Math.min(sliderMax, budget) - sliderMin) / (sliderMax - sliderMin)) * 100)
  );

  return (
    <div className="bg-[#090e15] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
      {/* Title & Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-mono font-semibold mb-2">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>FINANCIAL FOUNDATION</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          What&apos;s your budget for this home?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
          This established budget actively calibrates AI recommendations, furniture scale, material tiering, and shopping items.
        </p>
      </div>

      {/* Preset Pills Grid */}
      <div>
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-3">
          Choose your approximate budget tier
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BUDGET_PRESETS.map((preset) => {
            const active = !isCustom && budget >= preset.min && budget <= preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  active
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300"
                }`}
              >
                <div>
                  <span className={`text-sm font-bold font-mono block ${active ? "text-emerald-400" : "text-white"}`}>
                    {preset.label}
                  </span>
                  <span className="text-xs text-slate-400 font-light">Typical Indian Residence</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    active ? "border-emerald-500 bg-emerald-500 text-slate-950 font-bold" : "border-slate-700"
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
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              isCustom
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300"
            }`}
          >
            <div>
              <span className={`text-sm font-bold font-mono block ${isCustom ? "text-emerald-400" : "text-white"}`}>
                Custom Budget
              </span>
              <span className="text-xs text-slate-400 font-light">Input exact figure below</span>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                isCustom ? "border-emerald-500 bg-emerald-500 text-slate-950 font-bold" : "border-slate-700"
              }`}
            >
              {isCustom && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* Slider + Custom Input Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">
              Selected Budget Amount
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-mono tracking-tight flex items-baseline gap-2.5">
              <span className="text-emerald-400">{formatIndianBudget(budget)}</span>
              <span className="text-xs text-slate-400 font-normal">
                (₹{budget.toLocaleString("en-IN")})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 shadow-sm">
            <span className="text-emerald-400 font-bold font-mono text-base">₹</span>
            <input
              type="text"
              value={customInput}
              onChange={handleCustomInputChange}
              className="bg-transparent font-bold text-white text-base focus:outline-none w-36 font-mono"
              placeholder="e.g. 2500000"
              aria-label="Custom Budget Amount"
            />
          </div>
        </div>

        {/* Quick Pick Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-mono text-slate-400">Quick Select:</span>
          {[1000000, 1500000, 2500000, 3500000, 5000000, 7500000, 10000000].map((amt) => {
            const isSelected = budget === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleSetBudget(amt)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80"
                }`}
              >
                {formatIndianBudget(amt)}
              </button>
            );
          })}
        </div>

        {/* Range Slider Container with Calibrated Marks */}
        <div className="pt-3 pb-2">
          <div className="relative w-full">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={50000}
              value={Math.min(sliderMax, Math.max(sliderMin, budget))}
              onChange={handleSliderChange}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${sliderPercent}%, #1e293b ${sliderPercent}%, #1e293b 100%)`,
              }}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-emerald-400 transition-all"
              aria-label="Budget Slider"
            />
          </div>

          {/* Mathematically Calibrated Marks - Exact Alignment */}
          <div className="relative w-full h-8 mt-3 select-none">
            {sliderMarks.map((m, idx) => {
              const percent = Math.min(
                100,
                Math.max(0, ((m.value - sliderMin) / (sliderMax - sliderMin)) * 100)
              );
              const isCurrent = Math.abs(budget - m.value) < 100000;

              const transform =
                idx === 0
                  ? "translateX(0%)"
                  : idx === sliderMarks.length - 1
                  ? "translateX(-100%)"
                  : "translateX(-50%)";

              return (
                <div
                  key={m.value}
                  className="absolute top-0 flex flex-col items-center cursor-pointer group"
                  style={{ left: `${percent}%`, transform }}
                  onClick={() => handleSetBudget(m.value)}
                >
                  {/* Tick Pip */}
                  <div
                    className={`w-1 h-2 rounded-full mb-1 transition-colors ${
                      budget >= m.value ? "bg-emerald-400" : "bg-slate-700 group-hover:bg-slate-500"
                    }`}
                  />
                  {/* Clickable Label */}
                  <button
                    type="button"
                    className={`text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                      isCurrent
                        ? "text-emerald-400 font-bold underline"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Flexibility */}
      <div>
        <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Budget Flexibility
        </label>
        <p className="text-xs text-slate-400 font-light mb-4">
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold font-mono ${active ? "text-emerald-400" : "text-white"}`}>
                    {item.title}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      active ? "border-emerald-500 bg-emerald-500 text-slate-950 font-bold" : "border-slate-700"
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-light">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
