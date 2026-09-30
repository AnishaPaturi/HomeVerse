"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const WebsiteAppDemo: React.FC = () => {
  const [activeCompareStyle, setActiveCompareStyle] = useState<string>("Japandi");
  const [sliderPos, setSliderPos] = useState<number>(50);

  const styleComparisonData: Record<string, { img: string; title: string; cost: string; highlight: string }> = {
    Modern: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_modern_living_room_walnut_wood_charcoal_sofa_sleek_minimalist_4k?width=800&height=550&nologo=true&seed=111",
      title: "Structured Minimal Modern",
      cost: "₹8,80,000",
      highlight: "Clean lines · Smoked glass · Dark walnut paneling",
    },
    Japandi: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_japandi_living_room_light_oak_linen_low_furniture_wabi_sabi_4k?width=800&height=550&nologo=true&seed=222",
      title: "Organic Warm Japandi",
      cost: "₹8,42,000",
      highlight: "Bleached oak · Wabi-sabi linen · Paper lantern lights",
    },
    Scandinavian: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_scandinavian_living_room_bright_airy_white_birch_cozy_hygge_4k?width=800&height=550&nologo=true&seed=333",
      title: "Hygge Scandinavian",
      cost: "₹7,95,000",
      highlight: "Birchwood · Plush wool rug · Max natural light",
    },
    "Modern Luxury": {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_modern_luxury_living_room_calacatta_marble_gold_brass_velvet_4k?width=800&height=550&nologo=true&seed=444",
      title: "Bespoke Modern Luxury",
      cost: "₹14,20,000",
      highlight: "Italian marble · Brushed brass · Custom moldings",
    },
    Industrial: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_industrial_loft_living_room_exposed_brick_black_steel_leather_4k?width=800&height=550&nologo=true&seed=555",
      title: "Raw Urban Industrial",
      cost: "₹9,10,000",
      highlight: "Exposed brick · Saddle leather · Black steel grid",
    },
    Contemporary: {
      img: "https://image.pollinations.ai/prompt/wide_angle_architectural_photo_of_contemporary_living_room_curved_furniture_statement_lighting_4k?width=800&height=550&nologo=true&seed=666",
      title: "Curvaceous Contemporary",
      cost: "₹10,50,000",
      highlight: "Organic curves · Travertine stone · Ambient glow",
    },
  };

  const currentCompare = styleComparisonData[activeCompareStyle] || styleComparisonData["Japandi"];

  return (
    <section id="compare-styles" className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#070b10]">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>LOCKED-COORDINATE MULTI-STYLE RENDERING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            One Room Layout. Six Distinct Worlds.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            HomeVerse locks the physical 3D furniture coordinates and dimensions, then applies six separate material, lighting, and textural style profiles in parallel.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {["Japandi", "Modern", "Scandinavian", "Modern Luxury", "Industrial", "Contemporary"].map((style) => (
              <button
                key={style}
                onClick={() => setActiveCompareStyle(style)}
                className={`text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-full transition-all cursor-pointer ${
                  activeCompareStyle === style
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Before vs After Comparison Card */}
        <div className="max-w-5xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#090e15] border border-white/[0.1] shadow-2xl space-y-6">
          <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden select-none border border-slate-800">
            {/* After: Redesigned Room */}
            <img
              src={currentCompare.img}
              alt="HomeVerse AI Redesign"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before: Original Room */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-emerald-400 shadow-2xl"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200"
                alt="Original Raw Room Photo"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", minWidth: "100%", height: "100%" }}
              />
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[11px] font-mono uppercase text-slate-200">
                ORIGINAL ROOM PHOTO
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/40 text-[11px] font-mono uppercase text-emerald-300">
              HOMEVERSE {activeCompareStyle.toUpperCase()} · {currentCompare.cost}
            </div>

            {/* Slider Drag Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 cursor-ew-resize flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xl border-2 border-white">
                ⟷
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Room Analyzed ✓</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Furniture Optimized ✓</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>PBR Lighting Rig ✓</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Budget Validated ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebsiteAppDemo;
