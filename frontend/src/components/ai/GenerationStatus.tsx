"use client";

import React from "react";
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type StepState = "pending" | "processing" | "completed" | "error";

export interface GenerationStep {
  id: string;
  label: string;
  status: StepState;
  detail?: string;
}

interface GenerationStatusProps {
  steps: GenerationStep[];
  overallProgress: number; // 0 to 100
  title?: string;
  subtitle?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const GenerationStatus: React.FC<GenerationStatusProps> = ({
  steps,
  overallProgress,
  title = "AI Spatial Engine Generating Your Digital Twin",
  subtitle = "Synthesizing architectural boundaries, furniture models, PBR materials, and budget guardrails...",
  error,
  onRetry,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          <span>REAL-TIME GENERATIVE PIPELINE</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 font-light leading-relaxed max-w-md mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Progress</span>
          <span className="text-emerald-400 font-bold">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-lg shadow-emerald-500/50"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 border border-red-700 rounded-lg text-white font-bold cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-3 pt-2">
        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const isProcessing = step.status === "processing";
          const isError = step.status === "error";

          return (
            <div
              key={step.id || idx}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isProcessing
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : isDone
                  ? "bg-slate-900/60 border-slate-800/80"
                  : isError
                  ? "bg-red-950/20 border-red-800/40"
                  : "bg-slate-950/30 border-slate-900 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                  {isProcessing && (
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  )}
                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {isError && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  {step.status === "pending" && (
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-xs font-mono font-medium ${
                      isProcessing
                        ? "text-white font-bold"
                        : isDone
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.detail && (
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {isProcessing
                  ? "RUNNING..."
                  : isDone
                  ? "DONE"
                  : isError
                  ? "FAILED"
                  : "QUEUED"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationStatus;
