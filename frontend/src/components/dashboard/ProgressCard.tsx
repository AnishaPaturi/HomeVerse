"use client";

import React from "react";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

interface ProgressCardProps {
  completedRooms: number;
  totalRooms: number;
  activeDesignStyle?: string;
  overallProgress?: number;
  designProgress?: number;
  procurementProgress?: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completedRooms = 2,
  totalRooms = 4,
  activeDesignStyle = "Modern",
  overallProgress,
  designProgress,
  procurementProgress,
}) => {
  const percentage = overallProgress ?? (totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Design Progress</span>
        <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
          Style: {activeDesignStyle}
        </span>
      </div>

      <div className="text-3xl font-black text-gray-900 dark:text-white mb-2">
        {completedRooms} / {totalRooms} Rooms Complete
      </div>
      <p className="text-xs text-gray-500 mb-4">
        AI is progressively estimating room budgets and catalog sourcing across your floor plan.
      </p>

      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          className="bg-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
