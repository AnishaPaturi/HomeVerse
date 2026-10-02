"use client";

import React from "react";
import Link from "next/link";
import { Plus, Home, Sparkles, ArrowRight } from "lucide-react";

interface CreateHomeCardProps {
  onClick?: () => void;
}

export const CreateHomeCard: React.FC<CreateHomeCardProps> = ({ onClick }) => {
  return (
    <Link
      href="/home/new"
      onClick={onClick}
      className="glass-morphism-card group rounded-3xl p-6 sm:p-8 border border-emerald-500/30 hover:border-emerald-400 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] shadow-2xl relative overflow-hidden cursor-pointer"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

      <div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all shadow-lg shadow-emerald-500/20">
          <Plus className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[11px] font-mono font-semibold mb-3">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>9-Step Home Setup</span>
        </div>

        <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors font-editorial">
          Create New Home
        </h3>

        <p className="text-xs text-slate-400 font-light mt-2 leading-relaxed">
          Configure residence type, floors, room count, establish your Indian budget guardrails, and generate spatial twins.
        </p>
      </div>

      <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
        <span>Start New Design Project</span>
        <ArrowRight className="w-4 h-4 text-emerald-400" />
      </div>
    </Link>
  );
};
