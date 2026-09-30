"use client";

import React from "react";
import Link from "next/link";
import { Plus, Home, Sparkles, ArrowRight } from "lucide-react";

export const CreateHomeCard: React.FC = () => {
  return (
    <Link
      href="/home/new"
      className="group bg-gradient-to-br from-indigo-900/40 via-zinc-900 to-zinc-950 border border-indigo-500/20 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      <div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Plus className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          House Creation Wizard
        </div>
        <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
          Create New Home
        </h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Configure house type, floors, room count, establish your project budget, and upload your floor plan.
        </p>
      </div>

      <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
        <span>Start New Design Project</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
};
