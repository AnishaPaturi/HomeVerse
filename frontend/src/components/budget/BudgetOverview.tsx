import React from "react";
import { Budget } from "@/types/budget";
import { formatCurrency, formatIndianBudget } from "@/lib/utils";
import { DollarSign, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

interface BudgetOverviewProps {
  budget: Budget;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budget }) => {
  const estimated = budget.estimated_amount || budget.spent_amount || 0;
  const percentageSpent = budget.total_budget > 0
    ? Math.min(100, Math.round((estimated / budget.total_budget) * 100))
    : 0;

  const flexibilityColor =
    budget.flexibility === "Strict"
      ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
      : budget.flexibility === "Flexible"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
      : "bg-amber-500/10 text-amber-500 border-amber-500/30";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-500" />
            House Budget Overview
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Established during house creation to guide AI architectural & furniture recommendations.
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${flexibilityColor}`}>
          {budget.flexibility || "Moderate"} Flexibility
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
          <span className="text-xs font-medium text-gray-500">Total House Budget</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatIndianBudget(budget.total_budget)}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">Full turnkey allocation</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
          <span className="text-xs font-medium text-gray-500">Estimated Commitment</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatIndianBudget(estimated)}
          </p>
          <span className="text-[10px] text-indigo-400/80 mt-1 block">From designs & materials</span>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-800">
          <span className="text-xs font-medium text-gray-500">Remaining Cushion</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatIndianBudget(budget.remaining_amount)}
          </p>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Available reserve</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
          <span>Overall Allocation Commitment</span>
          <span className="text-gray-900 dark:text-white font-bold">{percentageSpent}% Used</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentageSpent > 90 ? "bg-rose-500" : percentageSpent > 75 ? "bg-amber-500" : "bg-indigo-600"
            }`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
