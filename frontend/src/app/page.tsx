"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import PlatformDemo from "@/components/landing/PlatformDemo";
import DesignFeatures from "@/components/landing/DesignFeatures";
import WebsiteAppDemo from "@/components/landing/WebsiteAppDemo";
import ThreeDShowcase from "@/components/landing/ThreeDShowcase";
import FinalCTA from "@/components/landing/FinalCTA";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [heroStyle, setHeroStyle] = useState<string>("Japandi");
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      try {
        setUser(JSON.parse(userSession));
      } catch (_) {}
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.refresh();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-slate-800/20 rounded-full blur-[180px]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#070b10]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070b10] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                HV
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                HOMEVERSE{" "}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                  SPATIAL OS
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-wider text-slate-300">
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              HOW IT WORKS
            </button>
            <button
              onClick={() => scrollToSection("ai-engine")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              AI SCANNER
            </button>
            <button
              onClick={() => scrollToSection("design-dna")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              DESIGN DNA
            </button>
            <button
              onClick={() => scrollToSection("compare-styles")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              6-STYLE STUDIO
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    {user.name ? user.name[0].toUpperCase() : "A"}
                  </div>
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="text-xs font-mono text-slate-300 hover:text-white px-3 py-2 transition-colors cursor-pointer hidden sm:block"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => router.push(user ? "/home/new" : "/login")}
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Designing</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Modular Landing Sections */}
      <Hero
        heroStyle={heroStyle}
        onStyleChange={(st) => setHeroStyle(st)}
        onOpenDemoModal={() => setDemoModalOpen(true)}
        isAuthenticated={!!user}
      />

      <HowItWorks />

      <PlatformDemo isAuthenticated={!!user} />

      <DesignFeatures isAuthenticated={!!user} />

      <WebsiteAppDemo />

      <ThreeDShowcase isAuthenticated={!!user} />

      <FinalCTA isAuthenticated={!!user} />

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} HomeVerse AI. Spatial CAD & Generative Architecture OS.</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>₹ Indian Budget Integration</span>
            <span>·</span>
            <span>Three.js WebGL</span>
            <span>·</span>
            <span>Gemini Vision</span>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-[#090e15] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-emerald-400">
                HOMEVERSE INTERACTIVE WALKTHROUGH DEMO
              </span>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="text-slate-400 hover:text-white px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200"
                alt="Demo preview"
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-emerald-500 text-slate-950 font-bold shadow-xl">
                  ▶
                </div>
                <span className="font-mono text-xs text-white">
                  Real-time Spatial CAD & AI Budgeting Demo
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setDemoModalOpen(false);
                  router.push("/home/new");
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase"
              >
                Try It Yourself Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
