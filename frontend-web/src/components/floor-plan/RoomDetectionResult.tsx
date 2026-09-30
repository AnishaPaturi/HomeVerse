"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface RoomDetectionResultProps {
  detectedCount: number;
  totalAreaSqft: number;
  confidenceScore?: number;
}

export const RoomDetectionResult: React.FC<RoomDetectionResultProps> = ({
  detectedCount,
  totalAreaSqft,
  confidenceScore = 96,
}) => {
  return (
    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {detectedCount} Rooms Extracted Successfully
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total area calculated: {totalAreaSqft} sq ft • {confidenceScore}% confidence
          </p>
        </div>
      </div>
      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
        Verified
      </span>
    </div>
  );
};
