"use client";

import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

interface RoomProgressProps {
  completedCount: number;
  totalCount: number;
}

export const RoomProgress: React.FC<RoomProgressProps> = ({ completedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4">
      <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          House Design Completion
        </span>
        <span>
          {completedCount} of {totalCount} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
