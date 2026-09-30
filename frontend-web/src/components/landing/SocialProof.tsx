"use client";

import React from "react";
import { Star, ShieldCheck, Home, TrendingUp, Award, CheckCircle2 } from "lucide-react";

export const SocialProof: React.FC = () => {
  const metrics = [
    {
      value: "2,840+",
      label: "Homes Designed Across India",
      subtext: "Bangalore · Mumbai · Delhi NCR · Hyderabad",
      icon: Home,
    },
    {
      value: "₹24.8 Cr",
      label: "Interior Budgets Modeled",
      subtext: "Zero budget overruns reported",
      icon: TrendingUp,
    },
    {
      value: "99.2%",
      label: "Contractor Cost Accuracy",
      subtext: "Direct vendor catalog pricing",
      icon: CheckCircle2,
    },
    {
      value: "4.92 / 5",
      label: "Homeowner & Architect Rating",
      subtext: "Based on 850+ verified reviews",
      icon: Star,
    },
  ];

  const publications = [
    { name: "Architectural Digest India", role: "Featured Spatial Tech" },
    { name: "Elle Decor", role: "Design Innovation Award" },
    { name: "Dezeen", role: "Next-Gen CAD Spotlight" },
    { name: "IIA National Forum", role: "Architect Partner Network" },
    { name: "Forbes Asia", role: "Top PropTech Innovators" },
  ];

  return (
    <section className="relative py-16 px-6 lg:px-12 border-y border-white/[0.08] bg-[#06090e]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="glass-morphism p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    VERIFIED
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-200 mt-1">
                  {m.label}
                </div>
                <div className="text-[11px] text-slate-400 font-light mt-0.5">
                  {m.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Media & Industry Trust */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs font-mono text-slate-400 tracking-wider uppercase flex items-center gap-2 shrink-0">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Recognized By Leading Architectural Institutions</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 lg:gap-10 text-slate-400 font-serif tracking-wide text-sm">
            {publications.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center md:items-start group cursor-default">
                <span className="font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors text-sm sm:text-base">
                  {p.name}
                </span>
                <span className="text-[10px] font-sans text-slate-500 font-mono">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
