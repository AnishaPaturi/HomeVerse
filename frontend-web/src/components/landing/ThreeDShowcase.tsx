"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Laptop, Zap, MousePointer, ShieldCheck, ArrowRight, Sparkles, Smartphone, Eye } from "lucide-react";

interface ThreeDShowcaseProps {
  isAuthenticated?: boolean;
}

export const ThreeDShowcase: React.FC<ThreeDShowcaseProps> = ({ isAuthenticated = false }) => {
  const router = useRouter();

  const userFriendlyPillars = [
    {
      icon: Laptop,
      badge: "ZERO INSTALLATION",
      title: "No 20GB Apps or Heavy Downloads",
      desc: "Forget complicated architectural CAD software like 3ds Max or AutoCAD that take hours to install. HomeVerse opens right inside your web browser — as fast and simple as watching a video on YouTube.",
      highlight: "Works seamlessly on Google Chrome, Safari, and Edge",
    },
    {
      icon: Zap,
      badge: "LIGHTWEIGHT & FAST",
      title: "Runs Smoothly on Any Laptop or Phone",
      desc: "You don't need a ₹2 Lakh gaming computer with a bulky graphics card. Our smart engine runs at a silky-smooth 60 frames per second on everyday MacBooks, office laptops, iPads, and smartphones.",
      highlight: "Instant 60FPS WebGL performance on everyday hardware",
    },
    {
      icon: MousePointer,
      badge: "INTUITIVE CONTROLS",
      title: "As Easy as Playing a Mobile Game",
      desc: "No technical 3D modeling skills required. Click and drag to orbit your room, pinch to zoom in on marble textures, or use your keyboard arrow keys to take a first-person walk through the front door.",
      highlight: "First-Person Walkthrough + Isometric 3D Orbit Modes",
    },
    {
      icon: Sparkles,
      badge: "LIVE BUDGET SYNC",
      title: "Instant Material & Price Swaps",
      desc: "Want to see what your living room looks like with Italian marble instead of wood? Click the floor, pick the material, and see the change in a fraction of a second — with the exact cost impact updated on your screen.",
      highlight: "Real-time budget delta calculations without page reloads",
    },
  ];

  return (
    <section id="browser-engine" className="py-24 px-6 lg:px-12 bg-[#06090e] border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>BUILT FOR EVERYDAY HOMEOWNERS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Architectural 3D CAD Made Effortless For Everyone
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            Professional 3D spatial design used to require expensive computers, complex software, and weeks of training. We rebuilt it from the ground up to run directly in your web browser.
          </p>
        </div>

        {/* 4 Friendly Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {userFriendlyPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="glass-morphism rounded-3xl p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold tracking-wider">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors font-editorial">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2 text-xs font-mono text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{p.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => router.push(isAuthenticated ? "/home/new" : "/signup")}
            className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all cursor-pointer shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95"
          >
            <span>Experience Browser 3D Studio Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ThreeDShowcase;
