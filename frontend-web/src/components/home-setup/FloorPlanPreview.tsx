"use client";

import React from "react";
import { Eye, CheckCircle2 } from "lucide-react";

interface FloorPlanPreviewProps {
  imageUrl: string;
}

export const FloorPlanPreview: React.FC<FloorPlanPreviewProps> = ({ imageUrl }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-500" />
          Floor Plan Blueprint Preview
        </h3>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> High-Resolution Ingested
        </span>
      </div>

      <div className="w-full h-80 rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Floor Plan Blueprint" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};
