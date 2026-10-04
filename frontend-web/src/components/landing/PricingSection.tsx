"use client";

import React, { useState } from "react";
import { Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export const PricingSection: React.FC = () => {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"project" | "annual">("project");

  const plans = [
    {
      name: "Explorer",
      tagline: "For homeowners exploring initial spatial ideas",
      price: "₹0",
      period: "forever free",
      badge: null,
      highlight: false,
      ctaText: "Start For Free",
      ctaLink: "/signup",
      features: [
        "1 Active Home Project",
        "Single-floor room layout (Up to 3 rooms)",
        "Basic Blueprint & Sketch OCR (Gemini AI)",
        "Interactive 3D WebGL Studio (Three.js)",
        "Access to 150+ Standard Furniture Models",
        "Estimated High-Level Budget Range",
      ],
      missingFeatures: [
        "Multi-Floor Duplex / Villa Navigation",
        "Strict Budget Guardrails & Delta Simulator",
        "Exportable Contractor Bill of Materials (BOM)",
        "Mobile Browser Real-time Scene Sync",
      ],
    },
    {
      name: "Homeowner Pro",
      tagline: "Complete turnkey design & financial peace of mind",
      price: billingCycle === "project" ? "₹2,499" : "₹1,999",
      period: billingCycle === "project" ? "per full home project" : "billed annually",
      badge: "MOST POPULAR",
      highlight: true,
      ctaText: "Launch Pro Project",
      ctaLink: "/home/new",
      features: [
        "Full Multi-Level Residence (Up to 4 floors)",
        "Unlimited Rooms (Living, Dining, Kitchen, Beds, Bath)",
        "Precision Vector CAD & Blueprint Ingestion",
        "Strict (±0%) & Moderate (±10%) Budget Guardrails",
        "Real-Time 'What-If?' Delta Cost Simulator",
        "First-Person 3D Walkthrough Mode",
        "Itemized Indian Contractor Bill of Materials (CSV/PDF)",
        "Instant Real-Time Cloud Scene Synchronization",
        "Dedicated AI Architectural Copilot Swarm",
      ],
      missingFeatures: [],
    },
    {
      name: "Architecture Studio",
      tagline: "For interior designers, builders & architecture firms",
      price: billingCycle === "project" ? "₹7,999" : "₹6,499",
      period: "per month / studio",
      badge: "PROFESSIONAL",
      highlight: false,
      ctaText: "Get Studio License",
      ctaLink: "/signup?plan=studio",
      features: [
        "Unlimited Client Projects & Revisions",
        "White-Label Client Presentation Mode (Your Logo)",
        "Custom 3D GLB/glTF Model Uploads",
        "Multi-User Team Collaboration & Role Access",
        "Priority Server-Side Cloud 4K Renders",
        "Custom Vendor Price Book & Rate Card Ingestion",
        "Direct API Webhook Access & DXF/DWG Export",
        "Dedicated Account Architect & Priority WhatsApp Support",
      ],
      missingFeatures: [],
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 lg:px-12 bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>TRANSPARENT VALUE · ZERO SURPRISE COSTS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Transparent, Predictable Investment
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Design your space with complete cost certainty. One project save will easily prevent ₹50,000+ in contractor rework fees.
          </p>

          {/* Billing Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="glass-morphism p-1 rounded-full flex items-center gap-1 border border-white/10">
              <button
                onClick={() => setBillingCycle("project")}
                className={`px-5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  billingCycle === "project"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Pay Per Home Project
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Annual Studio (Save 20%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between space-y-8 transition-all duration-300 relative ${
                p.highlight
                  ? "glass-morphism-card border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50 scale-[1.02] lg:-translate-y-2 z-10"
                  : "glass-morphism hover:border-white/20"
              }`}
            >
              {/* Badge */}
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] tracking-wider uppercase shadow-lg shadow-emerald-500/40">
                  {p.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white font-editorial">{p.name}</h3>
                  <p className="text-xs text-slate-400 font-light">{p.tagline}</p>
                </div>

                <div className="flex items-baseline gap-2 pt-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ {p.period}</span>
                </div>

                <button
                  onClick={() => router.push(p.ctaLink)}
                  className={`w-full py-3.5 rounded-full font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    p.highlight
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  <span>{p.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Feature List */}
              <div className="space-y-3 pt-6 border-t border-white/[0.08]">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Included Capabilities:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-300 font-light">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {p.missingFeatures.map((mfeat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600 line-through">
                      <span className="w-4 h-4 text-slate-600 shrink-0 text-center font-mono">✕</span>
                      <span>{mfeat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Money-Back Accuracy Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No Recurring Auto-Debit On Home Projects</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GST Invoice & Input Credit Available</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
