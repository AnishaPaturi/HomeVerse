"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface FloorPlanViewerProps {
  imageUrl: string;
  detectedRooms?: any[];
  scale?: number;
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  imageUrl,
  detectedRooms = [],
  scale = 1.0,
}) => {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Floor Plan Visualizer</h3>
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-300"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-2 text-gray-700 dark:text-gray-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-300"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full h-96 bg-gray-50 dark:bg-zinc-950 rounded-2xl overflow-auto flex items-center justify-center border border-gray-100 dark:border-zinc-800/80 p-4">
        <div
          className="transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Floor Plan" className="max-w-full max-h-[22rem] object-contain rounded-lg shadow-md" />
        </div>
      </div>
    </div>
  );
};
