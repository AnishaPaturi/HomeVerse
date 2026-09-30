"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Layers, Cpu, Eye, ArrowRight } from "lucide-react";

interface ThreeDShowcaseProps {
  isAuthenticated: boolean;
}

export const ThreeDShowcase: React.FC<ThreeDShowcaseProps> = ({ isAuthenticated }) => {
  const router = useRouter();

  const capabilities = [
    {
      icon: <Box className="w-5 h-5 text-emerald-400" />,
      title: "Parametric 3D Geometries",
      desc: "True GLTF / Three.js meshes with physics colliders and bounding box clearance checking.",
    },
    {
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      title: "Real PBR Materials",
      desc: "Roughness, metalness, and bump mapping tailored to white oak, brushed brass, travertine, and bouclé.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: "Real-time AI Copilot",
      desc: "Speak or type natural language instructions: 'Swap rug to jute', 'Shift dining table 50cm toward window'.",
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      title: "Interactive 3D Walkthrough",
      desc: "First-person walkthrough view lets you navigate room-by-room across all floors of your house.",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 border-t border-white/[0.06] bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>BROWSER-FIRST 3D ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Architecture-grade CAD in your browser.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            No heavy software downloads. Built on WebGL and Three.js with full parametric control, real physics, and instantaneous AI alterations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((c, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                {c.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{c.title}</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => router.push(isAuthenticated ? "/home/new" : "/login")}
            className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider px-7 py-3.5 rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>Explore 3D Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ThreeDShowcase;
