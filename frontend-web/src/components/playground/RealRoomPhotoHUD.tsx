"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  Sliders,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { StoredRoomPhoto } from "@/lib/projectStorage";

interface RealRoomPhotoHUDProps {
  photos: StoredRoomPhoto[];
  activePhotoIndex: number;
  onSelectPhotoIndex: (index: number) => void;
  showPhotoOnWall: boolean;
  onTogglePhotoOnWall: (show: boolean) => void;
  showPhotoOnFloor: boolean;
  onTogglePhotoOnFloor: (show: boolean) => void;
  photoOpacity: number;
  onChangePhotoOpacity: (opacity: number) => void;
  compareMode: "hidden" | "pip" | "split";
  onSetCompareMode: (mode: "hidden" | "pip" | "split") => void;
  onOpenDrawer: () => void;
  roomName: string;
}

export const RealRoomPhotoHUD: React.FC<RealRoomPhotoHUDProps> = ({
  photos,
  activePhotoIndex,
  onSelectPhotoIndex,
  showPhotoOnWall,
  onTogglePhotoOnWall,
  showPhotoOnFloor,
  onTogglePhotoOnFloor,
  photoOpacity,
  onChangePhotoOpacity,
  compareMode,
  onSetCompareMode,
  onOpenDrawer,
  roomName,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[activePhotoIndex] || photos[0];
  const totalPhotos = photos.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPhotoIndex(activePhotoIndex > 0 ? activePhotoIndex - 1 : totalPhotos - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPhotoIndex(activePhotoIndex < totalPhotos - 1 ? activePhotoIndex + 1 : 0);
  };

  // If hidden via mode, render a small floating restore trigger
  if (compareMode === "hidden") {
    return (
      <button
        onClick={() => onSetCompareMode("pip")}
        className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 backdrop-blur-md shadow-xl text-xs font-mono transition-all group cursor-pointer"
        title="Show Step 10 Real Room Photo Reference"
      >
        <Camera className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="font-bold">Step 10 Photos ({totalPhotos})</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>
    );
  }

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-[#090e15]/95 border border-emerald-500/40 backdrop-blur-md shadow-2xl font-mono text-xs text-white">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold transition-all cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Room Reference ({activePhotoIndex + 1}/{totalPhotos})</span>
          <Maximize2 className="w-3 h-3 text-slate-400 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 z-20 w-72 sm:w-80 rounded-2xl bg-[#090e15]/95 border border-emerald-500/30 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col transition-all duration-300 select-none">
      {/* Top Header */}
      <div className="p-3 bg-slate-950/80 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white text-[11px] tracking-wide uppercase">
            Step 10 Real Room Twin
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            {activePhotoIndex + 1}/{totalPhotos}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings / Overlay Controls Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              showSettings ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
            }`}
            title="Adjust photo projection & opacity"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Side-by-Side Split View Button */}
          <button
            onClick={() => onSetCompareMode(compareMode === "split" ? "pip" : "split")}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              compareMode === "split"
                ? "bg-amber-500/20 text-amber-300 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title={compareMode === "split" ? "Exit Side-by-Side Split" : "Side-by-Side Split Screen"}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close HUD */}
          <button
            onClick={() => onSetCompareMode("hidden")}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Hide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Thumbnail & Viewport Angle */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.url}
          alt={currentPhoto.label || "Step 10 Room Photo"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

        {/* Carousel Navigation Buttons */}
        {totalPhotos > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-sm border border-white/20 shadow-md cursor-pointer transition-transform hover:scale-110"
              title="Previous Angle"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-sm border border-white/20 shadow-md cursor-pointer transition-transform hover:scale-110"
              title="Next Angle"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Metadata Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="truncate pr-2">
            <span className="text-white font-bold text-xs truncate block drop-shadow-sm">
              {currentPhoto.label || `${roomName} Angle ${activePhotoIndex + 1}`}
            </span>
            <span className="text-[10px] text-emerald-400 capitalize block drop-shadow-sm">
              {currentPhoto.source || "intake capture"} • Step 10
            </span>
          </div>

          <button
            onClick={onOpenDrawer}
            className="p-1 rounded-lg bg-black/60 hover:bg-emerald-500 hover:text-slate-950 text-white/80 border border-white/20 text-[10px] transition-colors cursor-pointer shrink-0"
            title="Open Full Photos Drawer"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Projection & In-Scene Projection Settings Drawer */}
      {showSettings && (
        <div className="p-3 bg-slate-950/95 border-t border-white/[0.08] space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Project onto CAD Twin
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {Math.round(photoOpacity * 100)}% Opacity
            </span>
          </div>

          {/* Wall & Floor Projection Toggles */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => onTogglePhotoOnWall(!showPhotoOnWall)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
                showPhotoOnWall
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>3D Wall Backdrop</span>
            </button>

            <button
              onClick={() => onTogglePhotoOnFloor(!showPhotoOnFloor)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
                showPhotoOnFloor
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Floor Trace</span>
            </button>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={photoOpacity}
              onChange={(e) => onChangePhotoOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="p-2.5 bg-slate-950/80 border-t border-white/[0.08] flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-slate-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Reflected on 2D / 3D Scene</span>
        </div>

        <button
          onClick={() => onSetCompareMode(compareMode === "split" ? "pip" : "split")}
          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 underline transition-colors cursor-pointer"
        >
          {compareMode === "split" ? "Exit Split Screen" : "Side-by-Side Compare"}
        </button>
      </div>
    </div>
  );
};
