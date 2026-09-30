import React from "react";
import { formatIndianBudget } from "@/lib/utils";
import { Layers } from "lucide-react";

interface CategoryAllocation {
  category: string;
  percentage: number;
  allocatedAmount: number;
}

interface BudgetBreakdownProps {
  categories?: CategoryAllocation[];
  totalBudget?: number;
}

const DEFAULT_CATEGORIES: CategoryAllocation[] = [
  { category: "Furniture & Seating", percentage: 35, allocatedAmount: 875000 },
  { category: "Civil & Flooring", percentage: 20, allocatedAmount: 500000 },
  { category: "Lighting & Electrical", percentage: 15, allocatedAmount: 375000 },
  { category: "Modular Millwork", percentage: 12, allocatedAmount: 300000 },
  { category: "Walls & Finishes", percentage: 10, allocatedAmount: 250000 },
  { category: "Decor & Soft Furnishings", percentage: 8, allocatedAmount: 200000 },
];

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  categories = DEFAULT_CATEGORIES,
  totalBudget = 2500000,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h4 className="text-base font-bold text-gray-900 dark:text-white">Trade Category Breakdown</h4>
      </div>

      <div className="space-y-4">
        {categories.map((cat, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{cat.category}</span>
              <span className="text-gray-500 font-medium">
                {formatIndianBudget(cat.allocatedAmount)} ({cat.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${cat.percentage * 2.5}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
