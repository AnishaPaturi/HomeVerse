"use client";

import React from "react";
import { ShieldCheck, Lock, CheckCircle2, Cpu, FileCheck2, Sparkles } from "lucide-react";

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: FileCheck2,
      title: "RERA-Aligned Estimates",
      desc: "Standardized area definitions & transparent schedules",
    },
    {
      icon: ShieldCheck,
      title: "ISO 27001 Certified",
      desc: "Enterprise spatial data security & access controls",
    },
    {
      icon: Lock,
      title: "256-Bit SSL Encryption",
      desc: "Bank-grade protection for payment & project assets",
    },
    {
      icon: Cpu,
      title: "Three.js WebGL Engine",
      desc: "Zero-latency 60FPS browser-native spatial rendering",
    },
    {
      icon: Sparkles,
      title: "Google Gemini Vision",
      desc: "Multimodal architectural AI with zero hallucinations",
    },
  ];

  return (
    <section className="py-12 px-6 lg:px-12 border-y border-white/[0.06] bg-[#06090e]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="text-center text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-8">
          Enterprise Security, Structural Accuracy & Technology Standards
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="glass-morphism p-4 rounded-2xl flex flex-col items-center text-center space-y-2 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">
                  {b.title}
                </div>
                <div className="text-[10px] text-slate-400 font-light leading-tight">
                  {b.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
