"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SlidersHorizontal, ShieldCheck, Bell, Ruler, Check } from "lucide-react";

export default function SettingsDashboardPage() {
  const [unit, setUnit] = useState<"imperial" | "metric">("metric");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 relative overflow-hidden flex flex-col justify-between">
      {/* Background Architectural Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-105 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920')`,
          }}
        />
        <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090e] via-[#06090e]/75 to-[#06090e]/90" />
      </div>

      <div className="relative z-30">
        <Navbar />
      </div>

      <main className="max-w-4xl mx-auto w-full px-6 lg:px-12 py-10 space-y-8 relative z-10">
        <div className="pb-4 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>PLATFORM CONFIGURATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-editorial">
            Account & Studio Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-light mt-1">
            Configure default measurement units, Indian budget allocations, and BIM rules.
          </p>
        </div>

        <div className="glass-morphism-card rounded-3xl p-7 border border-white/12 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white font-editorial flex items-center gap-2">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span>Architectural Measurement Units</span>
            </label>
            <p className="text-xs text-slate-400 font-light">
              Choose the primary unit of measurement for 3D floor plan coordinates and dimensions.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnit("metric")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  unit === "metric"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                Meters / Centimeters (Metric)
              </button>
              <button
                type="button"
                onClick={() => setUnit("imperial")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  unit === "imperial"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                Feet / Inches (Imperial)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            <label className="text-sm font-bold text-white font-editorial">
              Default Budget Currency
            </label>
            <p className="text-xs text-slate-400 font-light">
              Format for material cost estimation, Indian procurement envelopes, and contractor labor rates.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                ₹ Indian Rupee (INR - Lakhs & Crores)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                $ US Dollar (USD)
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">
              Settings synchronized across your spatial studio profile.
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06] relative z-10 mt-12">
        © {new Date().getFullYear()} HomeVerse AI. Spatial Architecture & Indian Budget Operating System.
      </footer>
    </div>
  );
}
