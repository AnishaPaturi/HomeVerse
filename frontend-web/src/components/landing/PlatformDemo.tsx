"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Scan, Sparkles, CheckCircle2, ArrowRight, Layers, Eye, ShieldCheck } from "lucide-react";

interface PlatformDemoProps {
  isAuthenticated?: boolean;
}

export const PlatformDemo: React.FC<PlatformDemoProps> = ({ isAuthenticated = false }) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);

  const pipelineSteps = [
    {
      step: 1,
      title: "Raw Blueprint or Sketch",
      tag: "INPUT INGESTION",
      desc: "Upload any blueprint PDF, developer brochure, or even a smartphone snapshot of a hand-drawn pencil sketch.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      detectionOverlay: null,
      callout: "Raw 2D architectural blueprint uploaded by homeowner",
    },
    {
      step: 2,
      title: "AI Computer Vision Detection",
      tag: "GEMINI MULTIMODAL OCR",
      desc: "Our vision AI scans the image, identifying load-bearing walls, partition walls, door swings, and window openings.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      detectionOverlay: {
        boxes: [
          { label: "Living Room (5.2m × 4.1m)", top: "25%", left: "15%", width: "42%", height: "45%", color: "border-emerald-400 bg-emerald-500/20" },
          { label: "Balcony Door (1.8m Clearance)", top: "18%", left: "62%", width: "22%", height: "18%", color: "border-teal-400 bg-teal-500/20" },
          { label: "Dining Area (3.6m × 3.2m)", top: "52%", left: "55%", width: "32%", height: "36%", color: "border-cyan-400 bg-cyan-500/20" },
        ],
        scannerActive: true,
      },
      callout: "Scanning walls, door clearances, and calculating square meters",
    },
    {
      step: 3,
      title: "Clean 2D Vector CAD Layout",
      tag: "GEOMETRIC RECONSTRUCTION",
      desc: "Hand-drawn wobbles and blurry lines are instantly straightened into millimeter-precise architectural vector lines.",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200",
      detectionOverlay: {
        boxes: [
          { label: "Wall Thickness: 230mm (Brick)", top: "30%", left: "20%", width: "40%", height: "35%", color: "border-emerald-400/80 bg-emerald-500/10" },
        ],
        scannerActive: false,
      },
      callout: "Standardized CAD geometry with metric dimension anchors",
    },
    {
      step: 4,
      title: "Interactive 3D Digital Twin",
      tag: "SPATIAL EXTRUSION",
      desc: "Walls rise into 3D space with accurate ceiling heights, daylight openings, and locked coordinate snap points for furniture.",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200",
      detectionOverlay: null,
      callout: "Ready for live 3D walkthrough, styling, and budget simulation",
    },
  ];

  const current = pipelineSteps[activeStep - 1];

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
            From Blueprint to 3D Twin in 4 Visual Steps
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
                onClick={() => setActiveStep(s.step)}
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
            {/* Display Visual Area */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/8] bg-slate-950 border border-white/10 flex items-center justify-center">
              <img
                src={current.image}
                alt={current.title}
                className="w-full h-full object-cover filter brightness-[0.85] contrast-105 transition-all duration-700"
              />

              {/* Laser Scan Animation Line on Step 2 */}
              {current.detectionOverlay?.scannerActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                </div>
              )}

              {/* Bounding Box Visual Overlays */}
              {current.detectionOverlay?.boxes.map((box, i) => (
                <div
                  key={i}
                  className={`absolute rounded-xl border-2 ${box.color} p-2 flex flex-col justify-between backdrop-blur-sm transition-all duration-500 animate-in fade-in`}
                  style={{
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                  }}
                >
                  <span className="inline-block bg-slate-950/90 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/40 w-fit shadow-md">
                    ✓ {box.label}
                  </span>
                  <div className="flex justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
              ))}

              {/* Bottom Caption Pill */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto glass-morphism px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-mono text-white border border-white/20 shadow-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{current.callout}</span>
              </div>
            </div>

            {/* Explanation Footer */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-white font-editorial">
                  Step {current.step}: {current.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
                  {current.desc}
                </p>
              </div>

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
    </section>
  );
};

export default PlatformDemo;
