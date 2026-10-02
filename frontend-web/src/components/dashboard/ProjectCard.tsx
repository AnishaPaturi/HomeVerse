"use client";

import React from "react";
import Link from "next/link";
import { Project } from "@/types";
import { formatIndianBudget } from "@/lib/utils";
import { ArrowRight, Home, Layers, Calendar, Sparkles } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const propertyLabel = project.home_type || project.property_type || "Residence";
  const displayBudget = project.total_budget || project.budget || 1500000;

  return (
    <div className="glass-morphism-card rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
      {/* Ambient background hover glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 group-hover:bg-emerald-500/15 rounded-full blur-2xl transition-all pointer-events-none" />

      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
              Residential Twin
            </span>
            <h3 className="font-bold text-xl text-white group-hover:text-emerald-300 transition-colors font-editorial">
              {project.name}
            </h3>
          </div>
          <span className="text-[10px] uppercase font-mono font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full shrink-0">
            {propertyLabel}
          </span>
        </div>

        <div className="text-xs font-mono text-slate-400 space-y-1.5 my-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Configuration:</span>
            <span className="text-slate-200">
              {project.bhk ? `${project.bhk} BHK` : `${project.total_rooms || 4} Rooms`}
            </span>
          </div>
          {project.floors_count && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Levels:</span>
              <span className="text-slate-200">{project.floors_count} Floor(s)</span>
            </div>
          )}
          {project.area_sqft && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Built-Up Area:</span>
              <span className="text-slate-200">{project.area_sqft} sq.ft</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
            <span className="text-slate-500">Indian Budget:</span>
            <span className="text-emerald-400 font-bold">
              {formatIndianBudget(displayBudget)}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>{project.design_style || "Japandi"} Theme</span>
        </span>

        <Link
          href={`/project/${project.id}`}
          className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors group-hover:translate-x-1"
        >
          <span>Open Twin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
