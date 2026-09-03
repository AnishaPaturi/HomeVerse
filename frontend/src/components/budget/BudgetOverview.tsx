import React from "react";
import { Budget } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetOverviewProps {
  budget: Budget;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budget }) => {
  const percentageSpent = budget.total_budget > 0
    ? Math.min(100, Math.round((budget.spent_amount / budget.total_budget) * 100))
    : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Overview</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-gray-500">Total Budget</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.total_budget)}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-gray-500">Spent / Allocated</span>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(budget.spent_amount)}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-gray-500">Remaining</span>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(budget.remaining_amount)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Utilization</span>
          <span>{percentageSpent}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all"
            style={{ width: `${percentageSpent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
