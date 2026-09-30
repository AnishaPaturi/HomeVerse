"use client";

import React from "react";
import Link from "next/link";
import { formatIndianBudget } from "@/lib/utils";
import { ArrowRight, IndianRupee, Layers } from "lucide-react";

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
  projectName = "My Home",
  projectId = "p-demo",
  totalRooms = 4,
  completionPercentage = 62,
  totalBudget = 2500000,
  estimatedCost,
  spentAmount,
  remainingAmount = 360000,
  currency = "INR",
  flexibility = "moderate",
}) => {
  const actualEstimate = estimatedCost ?? spentAmount ?? 2140000;
  const percentage = totalBudget > 0 ? Math.min(100, Math.round((actualEstimate / totalBudget) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">{projectName}</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
          Live Project
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-6">
        <span>{totalRooms} Rooms</span>
        <span>{completionPercentage}% Complete</span>
      </div>

      <div className="border-t border-b border-gray-100 dark:border-zinc-800 py-4 mb-4">
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Budget</span>
        <div className="text-3xl font-black text-gray-900 dark:text-white mt-0.5">
          {formatIndianBudget(totalBudget)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
          <div>
            <span className="text-gray-400 block">Estimated:</span>
            <span className="text-gray-900 dark:text-white font-bold">{formatIndianBudget(estimatedCost)}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Remaining:</span>
            <span className="text-emerald-500 font-bold">{formatIndianBudget(remainingAmount)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          <span>Allocation Committed</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <Link
        href={`/project/${projectId}`}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/20 transition-all"
      >
        Continue Designing
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
