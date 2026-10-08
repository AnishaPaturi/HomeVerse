"use client";

import React, { useState } from "react";
import { X, Ruler, Check, Sparkles, RefreshCw } from "lucide-react";

interface DimensionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  initialWidth: number;
  initialLength: number;
  onSave: (width: number, length: number) => void;
}

export default function DimensionEditModal({
  isOpen,
  onClose,
  roomName,
  initialWidth,
  initialLength,
  onSave,
}: DimensionEditModalProps) {
  const [width, setWidth] = useState<number>(initialWidth);
  const [length, setLength] = useState<number>(initialLength);

  if (!isOpen) return null;

  const areaSqm = Number((width * length).toFixed(2));
  const areaSqft = Math.round(areaSqm * 10.7639);

  const presets = [
    { label: "Compact (3.5m × 4.0m)", w: 3.5, l: 4.0 },
    { label: "Standard (4.5m × 5.0m)", w: 4.5, l: 5.0 },
    { label: "Spacious (5.5m × 6.5m)", w: 5.5, l: 6.5 },
    { label: "Master Suite (6.0m × 7.0m)", w: 6.0, l: 7.0 },
  ];

  const handleApply = () => {
    onSave(width, length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#090e15] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#070b10]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Parametric CAD Dimensions
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {roomName} Room Boundary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dimension Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Width (Meters)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="20.0"
                  value={width}
                  onChange={(e) => setWidth(Math.max(2.0, parseFloat(e.target.value) || 2.0))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  m
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Length / Depth (Meters)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="20.0"
                  value={length}
                  onChange={(e) => setLength(Math.max(2.0, parseFloat(e.target.value) || 2.0))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  m
                </span>
              </div>
            </div>
          </div>

          {/* Computed Metrics */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Floor Area (Metric)</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {areaSqm} m²
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Floor Area (Imperial)</div>
              <div className="text-base font-bold text-teal-400 mt-0.5">
                {areaSqft} sq.ft
              </div>
            </div>
          </div>

          {/* Quick Architectural Presets */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Architectural Standard Sizes
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setWidth(preset.w);
                    setLength(preset.l);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-left text-xs font-mono border transition-all cursor-pointer ${
                    width === preset.w && length === preset.l
                      ? "bg-emerald-500/20 border-emerald-500 text-white font-bold"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#070b10] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply to 3D Twin & CAD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
