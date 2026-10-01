"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scan,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Eye,
  Maximize2,
  X,
  Compass,
  Footprints,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";

interface PlatformDemoProps {
  isAuthenticated?: boolean;
}

type WalkthroughAngle = "overview" | "front" | "entry" | "window" | "panorama" | "top";

interface WalkthroughOption {
  id: WalkthroughAngle;
  label: string;
  badge: string;
  transform: string;
}

const WALKTHROUGH_OPTIONS: WalkthroughOption[] = [
  { id: "overview", label: "All Angles", badge: "10-VIEW COMPOSITE", transform: "scale(1) translate(0%, 0%)" },
  { id: "front", label: "Front View", badge: "MAIN PERSPECTIVE", transform: "scale(2.2) translate(36%, 34%)" },
  { id: "entry", label: "Door Entry", badge: "FOYER ENTRANCE", transform: "scale(2.2) translate(-12%, -1%)" },
  { id: "window", label: "Window View", badge: "DAYLIGHT & BALCONY", transform: "scale(2.2) translate(-36%, -1%)" },
  { id: "panorama", label: "360° Panorama", badge: "0° - 270° ROTATION", transform: "scale(1.9) translate(-14%, -32%)" },
  { id: "top", label: "Top-Down CAD", badge: "ISOMETRIC PLAN", transform: "scale(2.2) translate(34%, -29%)" },
];

export const PlatformDemo: React.FC<PlatformDemoProps> = ({ isAuthenticated = false }) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [isWalkthroughModalOpen, setIsWalkthroughModalOpen] = useState(false);
  const [activeAngle, setActiveAngle] = useState<WalkthroughAngle>("overview");
  const [isAutoTouring, setIsAutoTouring] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsWalkthroughModalOpen(false);
    };
    if (isWalkthroughModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWalkthroughModalOpen]);

  // Auto-tour timer when activeStep === 4 and isAutoTouring is enabled
  useEffect(() => {
    if (activeStep !== 4 || !isAutoTouring) return;
    const interval = setInterval(() => {
      setActiveAngle((prev) => {
        const currentIndex = WALKTHROUGH_OPTIONS.findIndex((o) => o.id === prev);
        const nextIndex = (currentIndex + 1) % WALKTHROUGH_OPTIONS.length;
        return WALKTHROUGH_OPTIONS[nextIndex].id;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [activeStep, isAutoTouring]);

  const pipelineSteps = [
    {
      step: 1,
      title: "Raw Blueprint or Sketch",
      tag: "INPUT INGESTION",
      desc: "Upload any blueprint PDF, developer brochure, or even a smartphone snapshot of a hand-drawn pencil sketch.",
      image: "/BluePrint-sample.png",
      callout: "Raw 2D architectural blueprint uploaded by homeowner",
    },
    {
      step: 2,
      title: "AI Computer Vision Detection",
      tag: "GEMINI MULTIMODAL OCR",
      desc: "Our vision AI scans the image, identifying load-bearing walls, partition walls, door swings, and window openings.",
      image: "/AI-computer-vision-detection.png",
      callout: "Scanning walls, door clearances, and calculating square meters",
    },
    {
      step: 3,
      title: "Clean 2D Vector CAD Layout",
      tag: "GEOMETRIC RECONSTRUCTION",
      desc: "Hand-drawn wobbles and blurry lines are instantly straightened into millimeter-precise architectural vector lines.",
      image: "/Clean-2D-Vector-CAD-Layout.png",
      callout: "Standardized CAD geometry with metric dimension anchors",
    },
    {
      step: 4,
      title: "Interactive 3D Walkthrough",
      tag: "360° SPATIAL TOUR",
      desc: "Step inside your floor plan with true-to-scale first-person walkthroughs, 360° panoramic rotation, door entry vistas, and multi-angle room inspections.",
      image: "/Interactive-3D-digital-twin.png",
      callout: "Interactive 360° multi-angle walkthrough & digital twin",
    },
  ];

  const current = pipelineSteps[activeStep - 1];
  const activeOption = WALKTHROUGH_OPTIONS.find((o) => o.id === activeAngle) || WALKTHROUGH_OPTIONS[0];

  const handleNextAngle = () => {
    const currentIndex = WALKTHROUGH_OPTIONS.findIndex((o) => o.id === activeAngle);
    const nextIndex = (currentIndex + 1) % WALKTHROUGH_OPTIONS.length;
    setActiveAngle(WALKTHROUGH_OPTIONS[nextIndex].id);
  };

  const handlePrevAngle = () => {
    const currentIndex = WALKTHROUGH_OPTIONS.findIndex((o) => o.id === activeAngle);
    const prevIndex = (currentIndex - 1 + WALKTHROUGH_OPTIONS.length) % WALKTHROUGH_OPTIONS.length;
    setActiveAngle(WALKTHROUGH_OPTIONS[prevIndex].id);
  };

  return (
    <section id="ai-engine" className="py-24 px-6 lg:px-12 border-t border-white/[0.08] bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Scan className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>HOW THE VISION AI WORKS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            From Blueprint to 3D Walkthrough in 4 Visual Steps
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            No complicated technical jargon. Watch how HomeVerse transforms any flat floor plan sketch into an editable, true-to-scale 3D room.
          </p>
        </div>

        {/* 4-Step Interactive Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {pipelineSteps.map((s) => {
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => {
                  setActiveStep(s.step);
                  if (s.step !== 4) setIsAutoTouring(false);
                }}
                className={`p-4 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-2 border ${
                  isActive
                    ? "glass-morphism-card border-emerald-500/60 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "glass-morphism border-white/10 hover:border-white/20 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isActive ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-slate-300"
                    }`}
                  >
                    0{s.step}
                  </span>
                  {isActive && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-300"}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400/90 mt-0.5">
                    {s.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Visual Comparison Frame */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-morphism rounded-3xl p-4 sm:p-6 border border-white/15 shadow-2xl relative overflow-hidden">
            {/* Step 4 Interactive Walkthrough Controls Bar */}
            {current.step === 4 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-mono mb-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Footprints className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-white font-bold text-[11px] sm:text-xs">
                    CAMERA WALKTHROUGH:
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                    {activeOption.badge}
                  </span>
                </div>

                {/* Perspective Angle Buttons */}
                <div className="flex flex-wrap items-center gap-1">
                  {WALKTHROUGH_OPTIONS.map((opt) => {
                    const isSelected = activeAngle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setIsAutoTouring(false);
                          setActiveAngle(opt.id);
                        }}
                        className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer text-[11px] font-mono ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation & Fullscreen Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => setIsAutoTouring(!isAutoTouring)}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                      isAutoTouring
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10"
                    }`}
                    title={isAutoTouring ? "Pause Tour" : "Auto-Play Walkthrough Tour"}
                  >
                    {isAutoTouring ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                    <span className="hidden sm:inline">{isAutoTouring ? "Pause" : "Auto-Tour"}</span>
                  </button>

                  <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
                    <button
                      onClick={handlePrevAngle}
                      className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Previous Angle"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleNextAngle}
                      className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      title="Next Angle"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsWalkthroughModalOpen(true)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
                    title="Fullscreen Walkthrough Inspection"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Display Visual Area */}
            <div
              className={`relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/8] bg-slate-950 border border-white/10 flex items-center justify-center ${
                current.step === 4 ? "cursor-pointer group" : ""
              }`}
              onClick={() => {
                if (current.step === 4) setIsWalkthroughModalOpen(true);
              }}
            >
              <div className="w-full h-full overflow-hidden flex items-center justify-center">
                <img
                  src={current.image}
                  alt={current.title}
                  style={
                    current.step === 4
                      ? {
                          transform: activeOption.transform,
                          transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                        }
                      : undefined
                  }
                  className={
                    current.step === 1 || current.step === 3
                      ? "w-full h-full object-contain bg-white p-2 transition-all duration-700"
                      : current.step === 2
                      ? "w-full h-full object-contain bg-[#030914] transition-all duration-700"
                      : "w-full h-full object-contain bg-[#080808]"
                  }
                />
              </div>

              {/* Step 4 Walkthrough Badge / Fullscreen Trigger */}
              {current.step === 4 && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsWalkthroughModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-white/20 hover:border-emerald-400/60 text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xl backdrop-blur-md"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Expand All 10 Angles</span>
                  </button>
                </div>
              )}
            </div>

            {/* Explanation Footer */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-base sm:text-lg font-bold text-white font-editorial">
                    Step {current.step}: {current.title}
                  </h4>
                  {current.callout && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {current.callout}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
                  {current.desc}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {current.step === 4 && (
                  <button
                    onClick={() => setIsWalkthroughModalOpen(true)}
                    className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 hover:border-emerald-400/50"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Inspect 360° Views</span>
                  </button>
                )}

                <button
                  onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 shrink-0 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Try It With Your Plan →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 360° Spatial Walkthrough Modal for Step 4 */}
      {isWalkthroughModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col p-4 sm:p-6 animate-in fade-in duration-300"
          onClick={() => setIsWalkthroughModalOpen(false)}
        >
          {/* Modal Header */}
          <div
            className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-base sm:text-lg font-editorial">
                    3D Spatial Walkthrough: Living Room
                  </h3>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                    10 PERSPECTIVES • 360° PANORAMA
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Dimensions: 4.00 m × 3.50 m (14.00 m²) • Ceiling: 2.80 m
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsWalkthroughModalOpen(false);
                  router.push(isAuthenticated ? "/home/new" : "/signup");
                }}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer"
              >
                <span>Generate For My Home →</span>
              </button>
              <button
                onClick={() => setIsWalkthroughModalOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: High-Res Image View */}
          <div
            className="flex-1 flex items-center justify-center overflow-auto py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-full max-h-[76vh] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#080808]">
              <img
                src="/Interactive-3D-digital-twin.png"
                alt="3D Spatial Walkthrough Multi-Angle Views"
                className="w-auto h-auto max-h-[76vh] max-w-full object-contain"
              />
            </div>
          </div>

          {/* Modal Footer: Angle Guide Pills */}
          <div
            className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-300 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-emerald-400 font-bold mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Walkthrough Perspectives:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Front View</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Left View</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Right View</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Back View</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Top Left / Right</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Door Entry</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Window View</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">Top-Down CAD</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              360° All Sides (0°-270°)
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlatformDemo;
