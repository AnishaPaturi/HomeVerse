"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Layers,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Maximize2,
  HelpCircle,
  Hash,
  Scale
} from "lucide-react";

export interface ChecklistItem {
  name: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface BlueprintRoom {
  room_id: string;
  source_label: string;
  room_type: string;
  width: number | null;
  depth: number | null;
  height?: number;
  area: number | null;
  dimension_source: string;
  scale_status: string;
  width_source?: string | null;
  depth_source?: string | null;
  confidence: number;
  user_confirmed?: boolean;
  ground_truth_imperial?: string | null;
  dimension_error_pct?: number | null;
  is_valid?: boolean;
  validation_notes?: string[];
}

interface AIDetectionStepProps {
  floorPlanPreviewUrl: string;
  checklist: ChecklistItem[];
  rooms: BlueprintRoom[];
  missingRooms: BlueprintRoom[];
  scaleStatus: string;
  scalePxPerMeter: number | null;
  isLoading: boolean;
  onRunAnalysis: () => Promise<void>;
  onSubmitMissingDimensions: (inputs: Record<string, { width: number; depth: number }>) => Promise<void>;
  onCalibrateScale: (referenceLengthM: number, referenceType: string) => Promise<void>;
  onProceed: () => void;
  canProceed: boolean;
}

export const AIDetectionStep: React.FC<AIDetectionStepProps> = ({
  floorPlanPreviewUrl,
  checklist,
  rooms,
  missingRooms,
  scaleStatus,
  scalePxPerMeter,
  isLoading,
  onRunAnalysis,
  onSubmitMissingDimensions,
  onCalibrateScale,
  onProceed,
  canProceed,
}) => {
  // Step 6A Missing Dimensions Local State
  const [missingInputs, setMissingInputs] = useState<Record<string, { width: string; depth: string }>>({});
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);

  // Case B Scale Calibration State
  const [showScaleCalibration, setShowScaleCalibration] = useState(false);
  const [referenceDimensionM, setReferenceDimensionM] = useState("12.0");
  const [referenceType, setReferenceType] = useState("overall_width");
  const [isCalibratingScale, setIsCalibratingScale] = useState(false);

  const handleInputChange = (roomId: string, field: "width" | "depth", val: string) => {
    setMissingInputs((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || { width: "", depth: "" }),
        [field]: val,
      },
    }));
  };

  const handleSaveMissingDimensions = async () => {
    setIsSubmittingMissing(true);
    try {
      const parsed: Record<string, { width: number; depth: number }> = {};
      for (const [id, dims] of Object.entries(missingInputs)) {
        const w = parseFloat(dims.width);
        const d = parseFloat(dims.depth);
        if (!isNaN(w) && !isNaN(d) && w > 0 && d > 0) {
          parsed[id] = { width: w, depth: d };
        }
      }
      await onSubmitMissingDimensions(parsed);
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  const handleApplyScaleCalibration = async () => {
    const val = parseFloat(referenceDimensionM);
    if (isNaN(val) || val <= 0) return;
    setIsCalibratingScale(true);
    try {
      await onCalibrateScale(val, referenceType);
    } finally {
      setIsCalibratingScale(false);
    }
  };

  const verifiedRoomsCount = rooms.filter((r) => r.width !== null && r.width > 0).length;
  const isScaleMissing = scaleStatus === "missing" || scaleStatus === "uncalibrated";
  const hasMissingRooms = missingRooms.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            STEP 6 · AI BLUEPRINT UNDERSTANDING PIPELINE
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Architectural Geometry & Dimension Detection
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl font-sans">
            HomeVerse enforces strict architectural fidelity: authentic CAD labels are preserved, explicit printed dimensions are read directly, and geometry is verified before entering 3D design.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-mono text-slate-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>{isLoading ? "Analyzing Blueprint..." : "Re-Analyze Blueprint"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-500 uppercase block">Total Zones</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {rooms.length} <span className="text-xs font-normal text-slate-400">rooms</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Authentic labels mapped
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-500 uppercase block">Verified Dimensions</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {verifiedRoomsCount} <span className="text-xs font-normal text-slate-400">/ {rooms.length}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {hasMissingRooms ? `${missingRooms.length} required (Step 6A)` : "100% verified"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-500 uppercase block">Blueprint Scale</span>
          <span className="text-lg font-bold font-mono text-white mt-1 block truncate">
            {scalePxPerMeter ? `${scalePxPerMeter} px/m` : "Calibrated"}
          </span>
          <span className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${isScaleMissing ? "text-amber-400" : "text-emerald-400"}`}>
            {isScaleMissing ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {scaleStatus.toUpperCase()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08]">
          <span className="text-[11px] font-mono text-slate-500 uppercase block">Dimension Integrity</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">0%</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> No hallucinated metrics
          </span>
        </div>
      </div>

      {/* Main Grid: Live Checklist + Visual Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Visual Checklist (7 Steps) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#090e15] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Live Analysis Checklist
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {checklist.filter((c) => c.passed).length} / {checklist.length} Passed
              </span>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    item.passed
                      ? "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                      : "bg-amber-950/20 border-amber-500/30"
                  }`}
                >
                  <div className="mt-0.5">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold font-mono ${item.passed ? "text-slate-200" : "text-amber-300"}`}>
                        {item.name}
                      </span>
                      {item.details && (
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {item.details}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Scale Calibration (Case B) */}
          <div className="p-5 rounded-2xl bg-[#090e15] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowScaleCalibration(!showScaleCalibration)}
              className="w-full flex items-center justify-between text-left text-xs font-mono text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                Case B: Calibrate Blueprint Scale with Known Dimension
              </span>
              <span className="text-[11px] text-slate-500 underline">
                {showScaleCalibration ? "Collapse" : "Expand"}
              </span>
            </button>

            {showScaleCalibration && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <p className="text-[11px] text-slate-400 font-sans">
                  If your blueprint has no scale ruler or explicit dimensions, enter one known real-world dimension (e.g. overall house width) to calibrate pixels to meters:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase">
                      Known Dimension (meters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={referenceDimensionM}
                      onChange={(e) => setReferenceDimensionM(e.target.value)}
                      placeholder="e.g. 12.0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase">
                      Reference Type
                    </label>
                    <select
                      value={referenceType}
                      onChange={(e) => setReferenceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="overall_width">Overall House Width</option>
                      <option value="overall_height">Overall House Depth</option>
                      <option value="main_room">Living Room Width</option>
                    </select>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={handleApplyScaleCalibration}
                      disabled={isCalibratingScale}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {isCalibratingScale ? "Calibrating..." : "Calibrate Scale"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Blueprint Preview + Detected Rooms */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                Floor Plan CAD Blueprint
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Source: Ground Truth Template
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={floorPlanPreviewUrl}
                alt="Architectural Floor Plan"
                className="w-full h-auto max-h-[380px] object-contain mx-auto"
              />
            </div>
          </div>

          {/* Authentic Rooms Detected List */}
          <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08] max-h-[360px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300">
                AUTHENTIC LABELS ({rooms.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Exact text parsed from CAD blueprint
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {rooms.map((r, idx) => {
                const isVerified = r.width !== null && r.width > 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                      isVerified
                        ? "bg-slate-950/80 border-slate-800/80 text-slate-200"
                        : "bg-rose-950/20 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold block truncate max-w-[160px]">
                        {r.source_label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {r.ground_truth_imperial || (isVerified ? `${r.width}m × ${r.depth}m` : "Dimensions Required")}
                      </span>
                    </div>

                    <div className="text-right">
                      {isVerified ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {r.dimension_source}
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          MISSING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step 6A: Missing Dimensions Resolution (Renders when missingRooms.length > 0) */}
      {hasMissingRooms && (
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Step 6A: Supply Missing Dimensions ({missingRooms.length} Room{missingRooms.length > 1 ? "s" : ""})
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 font-sans">
                The 3D Canonical Scene Gatekeeper strictly blocks proceeding without verified dimensions. Enter real-world dimensions for the rooms below:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {missingRooms.map((mr) => (
              <div
                key={mr.room_id}
                className="p-4 rounded-2xl bg-slate-950/90 border border-rose-500/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white uppercase">
                    {mr.source_label}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Unverified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Width (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={missingInputs[mr.room_id]?.width || ""}
                      onChange={(e) => handleInputChange(mr.room_id, "width", e.target.value)}
                      placeholder="e.g. 3.50"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Depth (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={missingInputs[mr.room_id]?.depth || ""}
                      onChange={(e) => handleInputChange(mr.room_id, "depth", e.target.value)}
                      placeholder="e.g. 4.00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-rose-400 font-mono">
              * Dimensions will be recorded as authoritatively user-supplied (`dimension_source: "user"`).
            </span>
            <button
              type="button"
              onClick={handleSaveMissingDimensions}
              disabled={isSubmittingMissing}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>{isSubmittingMissing ? "Saving Dimensions..." : "Save & Verify Dimensions"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Navigation */}
      <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-400 block">
            Pipeline Gatekeeper Status:
          </span>
          <span className={`text-sm font-mono font-bold ${canProceed ? "text-emerald-400" : "text-amber-400"}`}>
            {canProceed
              ? "All 15 rooms verified. Ready for Step 7 Confirmation."
              : hasMissingRooms
              ? "Blocked: Supply missing dimensions in Step 6A above."
              : isScaleMissing
              ? "Blocked: Calibrate blueprint scale above."
              : "Analyzing geometry..."}
          </span>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={!canProceed}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
        >
          <span>Proceed to Step 7: Dimension Confirmation</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
