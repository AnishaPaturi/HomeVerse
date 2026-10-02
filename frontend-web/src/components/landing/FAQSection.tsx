"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the Indian budget allocation engine ensure zero overspending?",
      a: "When you create a home project, you specify your total target budget in ₹ Lakhs or Crores (e.g. ₹25 Lakhs) and select a posture: Strict (±0%), Moderate (±10%), or Flexible (±25%). HomeVerse uses historical cost models across Indian metro tiers to automatically distribute funds across 5 trade categories: Civil & Flooring, Modular Millwork, Loose Furniture, Lighting & Electricals, and Wall Finishes. If you choose an expensive finish in one room, the system flags the delta and recommends exact offsets in other rooms.",
    },
    {
      q: "What types of floor plans can I upload?",
      a: "You can upload architectural CAD exports (PDF, DXF), high-res blueprint images (PNG, JPG), developer layout brochures, or even a clear top-down smartphone photo of a hand-drawn sketch with rough measurements. Our Gemini multimodal AI vision engine recognizes exterior and interior partition walls, window openings, door swing radius, and room boundary tags.",
    },
    {
      q: "Can I walk through the rooms in 3D without installing special software?",
      a: "Yes! HomeVerse runs entirely in your modern web browser (Chrome, Safari, Edge, Firefox) using high-performance Three.js WebGL with PBR shaders. You can orbit in isometric view, inspect architectural blueprint top-down mode, or click 'Walkthrough' to navigate with WASD / arrow keys in first-person mode with true human perspective height.",
    },
    {
      q: "Are the furniture and materials linked to actual Indian vendors?",
      a: "Yes. Unlike generic AI renderers that hallucinate unbuildable concepts, HomeVerse connects directly to vetted Indian material rates and commercial catalogues (CenturyPly, Greenlam, Kajaria, Asian Paints, Jaquar, Pepperfry, Urban Ladder, and custom carpentry rate cards). The bill of materials includes exact per-sq-ft rates for acrylic, laminate, veneer, PU polish, and hardware.",
    },
    {
      q: "How does cross-platform sync work between Web and the Flutter Mobile app?",
      a: "HomeVerse uses a canonical scene graph stored in PostgreSQL / SQLite. Every room has a platform-agnostic JSON structure containing room dimensions, furniture coordinates, rotation matrices, and applied material IDs. Any edit made in your desktop browser updates the cloud instantly; open the Flutter app on your iOS or Android phone at your job site, and you'll see the exact same 3D room and budget status.",
    },
    {
      q: "Can I share my project with my family, contractor, or personal interior designer?",
      a: "Absolutely. You can invite collaborators via a secure link with View-Only or Co-Editor privileges. Furthermore, you can download a full Architectural Home Book PDF containing 2D dimensioned floor plans, 3D perspective renders, and an itemized Contractor Bill of Materials for transparent tender bidding.",
    },
  ];

  return (
    <section id="faq" className="py-24 px-6 lg:px-12 bg-[#070b10] relative">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Everything You Need To Know
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Got questions about how HomeVerse spatial intelligence and Indian budgeting work? We have answers.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`glass-morphism rounded-2xl transition-all duration-300 overflow-hidden border ${
                  isOpen ? "border-emerald-500/40 bg-white/[0.04]" : "border-white/[0.08]"
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-semibold text-white">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? "bg-emerald-500 text-slate-950 rotate-180"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-300 font-light leading-relaxed border-t border-white/[0.06] pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help CTA */}
        <div className="glass-morphism rounded-2xl p-6 text-center space-y-3">
          <p className="text-xs font-mono text-slate-400">
            Have a custom architectural inquiry or enterprise studio requirement?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
          >
            <span>Talk directly to our architectural engineering team →</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
