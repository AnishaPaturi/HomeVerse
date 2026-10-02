"use client";

import React from "react";
import Link from "next/link";
import { formatIndianBudget } from "@/lib/utils";
import { ArrowRight, IndianRupee, Layers, Sparkles } from "lucide-react";

interface BudgetSummaryProps {
  projectName?: string;
  projectId?: string;
  totalRooms?: number;
  completionPercentage?: number;
  totalBudget?: number;
  estimatedCost?: number;
  spentAmount?: number;
  remainingAmount?: number;
  currency?: string;
  flexibility?: string;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  projectName = "Active Project",
  projectId = "",
  totalRooms = 0,
  completionPercentage,
  totalBudget = 0,
  estimatedCost,
  spentAmount,
  remainingAmount,
  currency = "INR",
  flexibility = "moderate",
}) => {
  const actualEstimate = estimatedCost ?? spentAmount ?? 0;
  const remAmount = remainingAmount ?? Math.max(0, totalBudget - actualEstimate);
  const percentage =
    completionPercentage !== undefined
      ? completionPercentage
      : totalBudget > 0
      ? Math.min(100, Math.round((actualEstimate / totalBudget) * 100))
      : 0;

  return (
    <div className="glass-morphism-card rounded-3xl p-6 sm:p-7 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
            Budget Envelope
          </span>
          <h3 className="text-xl font-bold text-white font-editorial">{projectName}</h3>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
          Live Twin
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-5">
        <span>{totalRooms} Configured Rooms</span>
        <span>{percentage}% Allocated</span>
      </div>

      <div className="border-t border-b border-white/[0.08] py-4 mb-5">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
          Total Indian Budget Allocation
        </span>
        <div className="text-3xl font-extrabold text-white font-mono mt-1 tracking-tight">
          {totalBudget > 0 ? formatIndianBudget(totalBudget) : "₹0 (Pending Setup)"}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px]">Estimated / Spent:</span>
            <span className="text-white font-bold">{formatIndianBudget(actualEstimate)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20">
            <span className="text-slate-400 block text-[10px]">Remaining Contingency:</span>
            <span className="text-emerald-400 font-bold">{formatIndianBudget(remAmount)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-2">
          <span>Allocation Committed</span>
          <span className="text-emerald-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/[0.08]">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-[#a3e635] h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {projectId ? (
        <Link
          href={`/project/${projectId}`}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <span>Continue Designing</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </Link>
      ) : (
        <Link
          href="/home/new"
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-105 active:scale-[0.99] text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <span>Configure Budget</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </Link>
      )}
    </div>
  );
};
