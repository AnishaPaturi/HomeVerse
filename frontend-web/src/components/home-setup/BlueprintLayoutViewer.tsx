"use client";

import React, { useState } from "react";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  X,
  Compass,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface BlueprintLayoutViewerProps {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  highlightedRoom?: string;
  roomsCount?: number;
}

export const BlueprintLayoutViewer: React.FC<BlueprintLayoutViewerProps> = ({
  imageUrl,
  title = "Blueprint & Layout Reference",
  subtitle = "Reference CAD floor plan while reviewing and modifying room names",
  highlightedRoom,
  roomsCount,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const effectiveImageUrl = imageUrl || "/templates/modern_north_layout-a.jpg";

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <>
      <div className="bg-white dark:bg-[#090e15] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-5 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900/90 border border-gray-200 dark:border-white/[0.08] p-1 rounded-xl">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-gray-600 dark:text-slate-300 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-gray-300 dark:bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              title="Expand fullscreen view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative w-full h-[460px] rounded-2xl overflow-hidden bg-slate-950 border border-gray-200 dark:border-white/[0.08] flex items-center justify-center p-2">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Image with zoom transformation */}
          <div
            className="w-full h-full flex items-center justify-center overflow-auto transition-transform duration-200"
            style={{
              cursor: zoom > 1 ? "grab" : "default",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effectiveImageUrl}
              alt="Floor Plan Blueprint Layout"
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          </div>

          {/* Bottom Floating Info Pill */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/[0.1] text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3 h-3" />
              <span>Ground Truth CAD Reference</span>
            </span>

            {highlightedRoom && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 text-[10px] font-mono text-indigo-300 shadow-lg truncate max-w-[180px]">
                Focus: {highlightedRoom}
              </span>
            )}
          </div>
        </div>

        {/* Helper Footer */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-500" />
            {roomsCount ? `${roomsCount} zones detected on plan` : "15 zones detected"}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">
            Click Expand for full-resolution view
          </span>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 max-w-7xl mx-auto w-full text-white">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold">High-Resolution CAD Blueprint Layout</h3>
                <p className="text-xs text-slate-400">Inspecting room partition walls, doors, and printed dimension strings</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-white/[0.1] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-slate-300 hover:text-white transition cursor-pointer"
                title="Close fullscreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-7xl mx-auto bg-slate-950 rounded-2xl border border-white/[0.1] overflow-auto flex items-center justify-center p-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effectiveImageUrl}
              alt="Floor Plan Fullscreen"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
