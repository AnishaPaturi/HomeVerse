"use client";

import React, { useState } from "react";
import { Check, Edit3, Pencil, X, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

export interface DetectedRoom {
  name: string;
  room_type: string;
  width_m: number;
  length_m: number;
  area_sqm: number;
  confidence: number;
  source_label?: string;
  custom_name?: string;
  detected_imperial?: string;
  ground_truth_imperial?: string;
  dimension_error_pct?: number;
  is_dimensionally_accurate?: boolean;
  dimension_source?: string;
  scale_status?: string;
}

interface DimensionConfirmationProps {
  rooms: DetectedRoom[];
  onConfirm: () => void;
  onCorrect: () => void;
  onRenameRoom?: (index: number, newName: string) => void;
  gatekeeperError?: string | null;
  isConfirming?: boolean;
}

export const DimensionConfirmation: React.FC<DimensionConfirmationProps> = ({
  rooms,
  onConfirm,
  onCorrect,
  onRenameRoom,
  gatekeeperError,
  isConfirming = false,
}) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartRename = (idx: number, currentName: string) => {
    setEditingIdx(idx);
    setEditValue(currentName);
  };

  const handleSaveRename = (idx: number) => {
    if (editValue.trim() && onRenameRoom) {
      onRenameRoom(idx, editValue.trim());
    }
    setEditingIdx(null);
  };

  const handleCancelRename = () => {
    setEditingIdx(null);
    setEditValue("");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            ViT Dimension Intelligence & Geometric Normalization
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Detected Rooms & Verified Dimensions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Metrics normalized from floor-plan image. Click the pencil icon next to any room to rename it.
          </p>
        </div>

        <button
          type="button"
          onClick={onCorrect}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Adjust Measurements
        </button>
      </div>

      {gatekeeperError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{gatekeeperError}</span>
        </div>
      )}

      {/* Structured Room List adhering to Detected Room -> Detected Dimensions -> Ground Truth -> Error % -> Confidence */}
      <div className="space-y-3 mb-6">
        {rooms.map((r, idx) => {
          const confScore = r.confidence <= 1.0 ? Math.round(r.confidence * 100) : Math.round(r.confidence);
          const hasGroundTruth = Boolean(r.ground_truth_imperial);
          const errorPct = r.dimension_error_pct !== undefined ? r.dimension_error_pct : 0.0;
          const isAccurate = errorPct <= 5.0;

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/60 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* 1. Detected Room & Source Label & Rename Action */}
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingIdx === idx ? (
                    <div className="flex items-center gap-1.5 my-0.5">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(idx);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        autoFocus
                        placeholder="Enter room name..."
                        className="px-2.5 py-1 text-sm font-bold bg-white dark:bg-zinc-800 border-2 border-indigo-500 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(idx)}
                        className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer shadow-sm"
                        title="Save room name"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1.5 rounded-lg bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        {r.name || r.source_label}
                      </span>
                      {onRenameRoom && (
                        <button
                          type="button"
                          onClick={() => handleStartRename(idx, r.name || r.source_label || "")}
                          className="opacity-60 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Rename room"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {r.room_type}
                  </span>
                  {r.source_label && r.source_label.toLowerCase() !== (r.name || "").toLowerCase() && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-500">
                      CAD: {r.source_label}
                    </span>
                  )}
                  {r.dimension_source && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      src: {r.dimension_source}
                    </span>
                  )}
                </div>

                {/* 2. Detected Dimensions (Metric & Imperial) */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    Detected: {r.width_m}m × {r.length_m}m
                  </span>
                  <span>•</span>
                  <span>
                    {(r.width_m * 3.28084).toFixed(1)}ft × {(r.length_m * 3.28084).toFixed(1)}ft
                  </span>
                  <span>•</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {r.area_sqm} m² ({(r.area_sqm * 10.7639).toFixed(0)} sq ft)
                  </span>
                </div>
              </div>

              {/* 3. Ground Truth Dimensions & 4. Dimension Error % */}
              <div className="flex flex-wrap items-center gap-3 md:justify-end text-xs">
                {hasGroundTruth && (
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-mono text-zinc-400 block">
                      Blueprint Printed:
                    </span>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">
                      {r.ground_truth_imperial}
                    </span>
                  </div>
                )}

                {hasGroundTruth ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{errorPct}% error</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs">
                    <span>ViT Inferred</span>
                  </div>
                )}

                {/* 5. Detection Confidence */}
                <div className="text-right min-w-[90px]">
                  <span className="text-[11px] text-zinc-400 block font-mono">Confidence</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {confScore}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={isConfirming}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        <span>{isConfirming ? "Gatekeeper Verifying Scene..." : "Confirm Measurements & Choose Room"}</span>
      </button>
    </div>
  );
};
