import React from "react";
import { formatIndianBudget } from "@/lib/utils";

interface BudgetProgressProps {
  totalBudget: number;
  estimatedCost?: number;
  spentAmount?: number;
  remainingAmount?: number;
  currency?: string;
  flexibility?: string;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  totalBudget,
  estimatedCost,
  spentAmount,
  remainingAmount,
  currency = "INR",
  flexibility = "moderate",
}) => {
  const actualCost = estimatedCost ?? spentAmount ?? 0;
  const actualRemaining = remainingAmount ?? (totalBudget - actualCost);
  const percentage = totalBudget > 0 ? Math.min(100, Math.round((actualCost / totalBudget) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Budget Consumption</span>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden p-0.5 mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            percentage > 95
              ? "bg-rose-500"
              : percentage > 80
              ? "bg-amber-500"
              : "bg-gradient-to-r from-indigo-500 to-indigo-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Estimated: {formatIndianBudget(estimatedCost)}</span>
        <span>Remaining: {formatIndianBudget(remainingAmount)}</span>
      </div>
    </div>
  );
};
