"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Layers,
  Eye,
  Maximize2,
  Download,
  CheckCircle2,
  Sliders,
  Palette,
  Sun,
  ShieldCheck,
  ArrowRight,
  SplitSquareVertical,
} from "lucide-react";
import { StoredRoomPhoto } from "@/lib/projectStorage";
import { formatIndianBudget } from "@/lib/utils";

interface RoomRendersViewerProps {
  roomName: string;
  designStyle: string;
  roomWidth: number;
  roomDepth: number;
  roomBudget: number;
  intakePhotos: StoredRoomPhoto[];
  onApplyPaletteTo3D: (material: string) => void;
  onSwitchTo3D: () => void;
}

export default function RoomRendersViewer({
  roomName,
  designStyle,
  roomWidth,
  roomDepth,
  roomBudget,
  intakePhotos,
  onApplyPaletteTo3D,
  onSwitchTo3D,
}: RoomRendersViewerProps) {
  const [selectedPerspective, setSelectedPerspective] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<"render" | "split">("render");
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100 for before/after slider
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const renderUrl =
    selectedPerspective === 1
      ? "/rooms/master-bed-room-1.png"
      : "/rooms/master-bed-room-2.png";

  const beforePhotoUrl =
    intakePhotos.length > 0 ? intakePhotos[0].url : "/rooms/empty-room.png";

  const areaSqm = Number((roomWidth * roomDepth).toFixed(2));
  const areaSqft = Math.round(areaSqm * 10.7639);

  return (
    <div className="w-full h-full flex flex-col bg-[#070b10] select-none overflow-hidden relative">
      {/* Top Controls Bar */}
      <div className="h-12 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Perspective switcher */}
          <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedPerspective(1)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPerspective === 1
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Perspective 1 (Wide CAD)
            </button>
            <button
              onClick={() => setSelectedPerspective(2)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedPerspective === 2
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Perspective 2 (Warm Ambient)
            </button>
          </div>

          {/* View mode: Single vs Split */}
          <button
            onClick={() => setViewMode(viewMode === "render" ? "split" : "render")}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Before / After Split</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <a
            href={renderUrl}
            download={`${roomName.toLowerCase().replace(/\s+/g, "-")}-${designStyle.toLowerCase()}-perspective-${selectedPerspective}.png`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Download Full 4K Render"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Download 4K</span>
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Fullscreen inspection"
          >
            <Maximize2 className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={onSwitchTo3D}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Back to 3D Editor</span>
          </button>
        </div>
      </div>

      {/* Main Render Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {viewMode === "render" ? (
          /* Standard Full Render View */
          <div className="relative w-full h-full max-h-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black">
            <Image
              src={renderUrl}
              alt={`${roomName} - ${designStyle} Render Perspective ${selectedPerspective}`}
              fill
              className="object-contain"
              priority
              unoptimized
            />

            {/* Top Overlay Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{designStyle} DNA • 4K PBR SYNTHESIS</span>
              </div>
              <div className="hidden sm:flex px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-slate-300 font-mono text-xs shadow-lg">
                <span>{roomWidth}m × {roomDepth}m ({areaSqm} m² / {areaSqft} sq.ft)</span>
              </div>
            </div>

            {/* Bottom Specs Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-10 p-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-2xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Lighting</div>
                    <div className="text-white font-bold">2700K Warm Ambient</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Materials</div>
                    <div className="text-white font-bold">White Oak & Bouclé</div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Est. Room Budget</div>
                    <div className="text-teal-300 font-bold">{formatIndianBudget(roomBudget)}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyPaletteTo3D("wood_light");
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold transition-all cursor-pointer text-xs"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Applied to 3D Twin!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Apply Style Palette to 3D</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Before / After Split Slider */
          <div
            className="relative w-full h-full max-h-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black cursor-ew-resize"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
              setSplitPos(Math.round((x / rect.width) * 100));
            }}
          >
            {/* Background: After (AI Render) */}
            <div className="absolute inset-0">
              <Image
                src={renderUrl}
                alt="AI Generated Twin"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-4 right-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase">
                After: {designStyle} AI Twin
              </div>
            </div>

            {/* Foreground: Before (User Intake Photo), clipped by splitPos */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-emerald-400 shadow-2xl z-10"
              style={{ width: `${splitPos}%` }}
            >
              <div className="relative w-full h-full min-w-[800px]">
                <Image
                  src={beforePhotoUrl}
                  alt="Original Empty Room"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase">
                Before: Empty Room Intake
              </div>
            </div>

            {/* Slider Divider Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xl pointer-events-none z-20"
              style={{ left: `calc(${splitPos}% - 16px)` }}
            >
              ⇄
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="text-sm font-mono text-white font-bold">
              {roomName} • {designStyle} 4K Architectural Perspective {selectedPerspective}
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-mono text-xs cursor-pointer"
            >
              Close (ESC)
            </button>
          </div>
          <div className="flex-1 relative my-4">
            <Image
              src={renderUrl}
              alt="Fullscreen Render"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
