"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X, Phone, Sparkles } from "lucide-react";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import ProblemSolution from "@/components/landing/ProblemSolution";
import KeyBenefits from "@/components/landing/KeyBenefits";
import UniqueValue from "@/components/landing/UniqueValue";
import ProductDemoVideo from "@/components/landing/ProductDemoVideo";
import HowItWorks from "@/components/landing/HowItWorks";
import ThreeDShowcase from "@/components/landing/ThreeDShowcase";
import TrustBadges from "@/components/landing/TrustBadges";
import PricingSection from "@/components/landing/PricingSection";
import Testimonials from "@/components/landing/Testimonials";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import FinalCTA from "@/components/landing/FinalCTA";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [heroStyle, setHeroStyle] = useState<string>("Japandi");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Background Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] bg-slate-800/20 rounded-full blur-[180px]" />
      </div>

      {/* Top Header / Navigation (8. Mobile Responsiveness & 14. Brand Logo) */}
      <header className="sticky top-0 z-50 bg-[#070b10]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* 14. Brand Logo */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-400 to-amber-200 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070b10] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                HV
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                HOMEVERSE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                  SPATIAL OS
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-mono tracking-wider text-slate-300">
            <button
              onClick={() => scrollToSection("key-benefits")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              BENEFITS
            </button>
            <button
              onClick={() => scrollToSection("problem-solution")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              THE PARADOX
            </button>
            <button
              onClick={() => scrollToSection("demo-video")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              PRODUCT DEMO
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              PRICING
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              TESTIMONIALS
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 text-slate-300"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>CONTACT</span>
            </button>
          </nav>

          {/* User Auth Buttons / 1. Call to Action Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-morphism text-xs font-mono text-slate-200 hover:border-emerald-500 transition-all cursor-pointer"
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
              onClick={() => router.push(user ? "/home/new" : "/signup")}
              className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Designing</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Hamburger Toggle */}
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
              onClick={() => scrollToSection("key-benefits")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              KEY BENEFITS
            </button>
            <button
              onClick={() => scrollToSection("problem-solution")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              THE PROBLEM WE SOLVE
            </button>
            <button
              onClick={() => scrollToSection("demo-video")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              PRODUCT DEMO (VIDEO)
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              CLEAR PRICING
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              TESTIMONIALS
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              FAQ SECTION
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-left text-xs font-mono py-2 text-slate-300 hover:text-emerald-400 cursor-pointer"
            >
              CONTACT & CONSULTATION
            </button>
            {!user && (
              <button
                onClick={() => router.push("/login")}
                className="text-left text-xs font-mono py-2 text-emerald-400 font-bold cursor-pointer border-t border-white/[0.06] pt-2"
              >
                SIGN IN →
              </button>
            )}
          </div>
        )}
      </header>

      {/* 1. Hero Section with 1. CTA Button, 13. Unique Value, 14. Brand Logo */}
      <Hero
        heroStyle={heroStyle}
        onStyleChange={(st) => setHeroStyle(st)}
        onOpenDemoModal={() => setDemoModalOpen(true)}
        isAuthenticated={!!user}
      />

      {/* 3. Social Proof (Metrics & Architectural Media) */}
      <SocialProof />

      {/* 4. Problem You Solve (Renovation Paradox vs HomeVerse) */}
      <ProblemSolution />

      {/* 2. Key Benefits (6 Pillars of Spatial & Financial Governance) */}
      <KeyBenefits />

      {/* 13. Unique Value Proposition */}
      <UniqueValue />

      {/* 11. Product Demo (Video) with interactive chapters */}
      <ProductDemoVideo />

      {/* Structured 5-Step Workflow */}
      <HowItWorks />

      {/* Interactive 3D Spatial Walkthrough Showcase */}
      <ThreeDShowcase isAuthenticated={!!user} />

      {/* 9. Trust Badges (RERA, ISO 27001, 256-Bit SSL, WebGL) */}
      <TrustBadges />

      {/* 10. Clear Pricing (Transparent Indian Rupee Tiers) */}
      <PricingSection />

      {/* 5. Testimonials (Verified Indian Homeowners & Architects) */}
      <Testimonials />

      {/* 12. FAQ Section (Interactive Accordion) */}
      <FAQSection />

      {/* 15. Contact Option (WhatsApp Concierge, Atelier Hubs & Form) */}
      <ContactSection />

      {/* 6. 2nd CTA (Ending) */}
      <FinalCTA isAuthenticated={!!user} />

      {/* Footer with 7. Fast Loading Speed & 14. Brand Logo */}
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

            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
              <button onClick={() => scrollToSection("key-benefits")} className="hover:text-white cursor-pointer">
                Benefits
              </button>
              <button onClick={() => scrollToSection("pricing")} className="hover:text-white cursor-pointer">
                Pricing
              </button>
              <button onClick={() => scrollToSection("demo-video")} className="hover:text-white cursor-pointer">
                Demo
              </button>
              <button onClick={() => scrollToSection("faq")} className="hover:text-white cursor-pointer">
                FAQ
              </button>
              <button onClick={() => scrollToSection("contact")} className="hover:text-white cursor-pointer">
                Contact
              </button>
              <button onClick={() => router.push("/login")} className="hover:text-white cursor-pointer">
                Sign In
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} HomeVerse AI Technologies Inc. All rights reserved. Built for Indian residential architecture.
            </div>
            {/* 7. Fast Loading Speed indicator */}
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Next.js 16 Turbopack (Sub-Second Paint)</span>
              </span>
              <span>·</span>
              <span>Three.js 60FPS</span>
              <span>·</span>
              <span>Gemini Vision</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Interactive Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl glass-morphism-card border border-white/20 p-6 space-y-4 shadow-2xl">
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
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200"
                alt="Demo preview"
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="p-4 rounded-full bg-emerald-500 text-slate-950 font-bold shadow-2xl">
                  ▶
                </div>
                <span className="font-editorial text-lg text-white">
                  Real-time Spatial CAD & Budget Delta Simulation
                </span>
                <p className="text-xs text-slate-300 max-w-md font-light">
                  Watch how furniture swaps instantly update overall project budgets across civil, modular millwork, and lighting categories.
                </p>
              </div>
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
