"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X, Sparkles, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Hero from "@/components/landing/Hero";
import PlatformDemo from "@/components/landing/PlatformDemo";
import DesignFeatures from "@/components/landing/DesignFeatures";
import LockedCoordinateViewer from "@/components/landing/LockedCoordinateViewer";
import ProductDemoVideo from "@/components/landing/ProductDemoVideo";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import FinalCTA from "@/components/landing/FinalCTA";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [heroStyle, setHeroStyle] = useState<string>("Industrial");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("empty");

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
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-slate-800/20 rounded-full blur-[180px]" />
      </div>

      {/* Spacious, Elegant Top Header / Navigation */}
      <header className="sticky top-0 z-50 bg-[#070b10]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-14 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => router.push("/")}
            className="cursor-pointer group flex items-center shrink-0"
          >
            <span className="font-mono text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              HOMEVERSE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                SPATIAL OS
              </span>
            </span>
          </div>

          {/* Spacious Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8 2xl:gap-10 text-xs font-mono tracking-widest text-slate-300">
            <button
              onClick={() => scrollToSection("ai-engine")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              AI SCANNER
            </button>
            <button
              onClick={() => scrollToSection("compare-styles")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              STYLES
            </button>
            <button
              onClick={() => scrollToSection("locked-coordinates")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              LOCKED COORDINATES
            </button>
            <button
              onClick={() => scrollToSection("demo-video")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              DEMO
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1 flex items-center gap-1.5 text-slate-300"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>CONTACT</span>
            </button>
          </nav>

          {/* User Auth Buttons / Primary CTA */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 rounded-full glass-morphism text-xs font-mono text-slate-200 hover:border-emerald-500 transition-all cursor-pointer"
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
            )}

            <button
              onClick={() => router.push(user ? "/home/new" : "/signup")}
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-5 sm:px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Designing</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl glass-morphism text-slate-300 hover:text-white cursor-pointer ml-1"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/[0.08] flex flex-col space-y-3 pb-2 animate-in fade-in">
            <button
              onClick={() => scrollToSection("ai-engine")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              AI VISION SCANNER
            </button>
            <button
              onClick={() => scrollToSection("compare-styles")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              ARCHITECTURAL STYLES
            </button>
            <button
              onClick={() => scrollToSection("locked-coordinates")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              LOCKED COORDINATES
            </button>
            <button
              onClick={() => scrollToSection("demo-video")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              PRODUCT DEMO
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>CONTACT & HUBS</span>
            </button>
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
              <span className="text-xs font-mono text-slate-400">Appearance Theme:</span>
              <ThemeToggle showLabel={true} />
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Interactive 3D Studio Playground */}
      <Hero
        heroStyle={heroStyle}
        onStyleChange={(st) => setHeroStyle(st)}
        onOpenDemoModal={() => setDemoModalOpen(true)}
        isAuthenticated={!!user}
      />

      {/* Spatial Computer Vision Pipeline with Real Images */}
      <PlatformDemo isAuthenticated={!!user} />

      {/* All 6 Design Styles Portrayed on the EXACT SAME ROOM */}
      <DesignFeatures
        isAuthenticated={!!user}
        selectedStyleId={selectedStyleId}
        onSelectStyle={(st) => setSelectedStyleId(st)}
      />

      {/* Locked Coordinate Rendering: Plain Bare Room vs Fully Furnished */}
      <LockedCoordinateViewer
        selectedStyleId={selectedStyleId}
        onStyleChange={(st) => setSelectedStyleId(st)}
      />

      {/* Product Demo (Video) with interactive chapters */}
      <ProductDemoVideo />

      {/* FAQ Section (Interactive Accordion) */}
      <FAQSection />

      {/* Contact Option (WhatsApp Concierge, Atelier Hubs & Form) */}
      <ContactSection />

      {/* 2nd CTA (Ending) */}
      <FinalCTA isAuthenticated={!!user} />

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-white/[0.06] bg-[#040608] text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                HV
              </div>
              <span className="font-bold text-white tracking-tight text-sm">
                HOMEVERSE SPATIAL OS
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
              <button onClick={() => scrollToSection("ai-engine")} className="hover:text-white cursor-pointer">
                AI Scanner
              </button>
              <button onClick={() => scrollToSection("compare-styles")} className="hover:text-white cursor-pointer">
                Architectural Styles
              </button>
              <button onClick={() => scrollToSection("locked-coordinates")} className="hover:text-white cursor-pointer">
                Locked Coordinates
              </button>
              <button onClick={() => scrollToSection("demo-video")} className="hover:text-white cursor-pointer">
                Product Demo
              </button>
              <button onClick={() => scrollToSection("faq")} className="hover:text-white cursor-pointer">
                FAQ
              </button>
              <button onClick={() => scrollToSection("contact")} className="hover:text-white cursor-pointer">
                Contact
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.04] text-[11px] text-slate-600">
            <div>
              © {new Date().getFullYear()} HomeVerse Inc. Mathematical budget governance & spatial architecture.
            </div>
            <div className="flex items-center gap-6">
              <span>Privacy Shield</span>
              <span>Terms of Service</span>
              <span>RERA Registered</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Interactive Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl glass-morphism border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                HOMEVERSE INTERACTIVE WALKTHROUGH DEMO
              </span>
              <button
                onClick={() => setDemoModalOpen(false)}
                className="w-8 h-8 rounded-full glass-morphism flex items-center justify-center text-slate-400 hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-white/10">
              <video
                src="/demo-video.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setDemoModalOpen(false);
                  router.push(user ? "/home/new" : "/signup");
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-emerald-500/30"
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
