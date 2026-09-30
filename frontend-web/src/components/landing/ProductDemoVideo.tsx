"use client";

import React, { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Layers, Box, IndianRupee } from "lucide-react";

export const ProductDemoVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeChapter, setActiveChapter] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const chapters = [
    {
      time: "00:00",
      title: "Blueprint Ingestion",
      icon: Layers,
      desc: "Instant vectorization of 2D blueprints & sketches",
      videoUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600",
    },
    {
      time: "00:35",
      title: "AI Room & Dimension OCR",
      icon: Sparkles,
      desc: "Automatic wall detection & square footage calculations",
      videoUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600",
    },
    {
      time: "01:10",
      title: "3D CAD Twin & Materials",
      icon: Box,
      desc: "Interactive WebGL studio with 6 curated design styles",
      videoUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600",
    },
    {
      time: "01:45",
      title: "Budget Delta & Vendor BOM",
      icon: IndianRupee,
      desc: "Real-time cost recalculation & contractor-ready export",
      videoUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600",
    },
  ];

  return (
    <section id="demo-video" className="py-24 px-6 lg:px-12 bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>INTERACTIVE PRODUCT DEMO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Watch HomeVerse In Action: 2 Minutes To Full Spatial Clarity
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            See how a raw apartment blueprint transforms into a millimeter-accurate 3D digital twin with linked vendor pricing.
          </p>
        </div>

        {/* Video Player Bezel */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-morphism rounded-3xl p-3 sm:p-4 border border-white/[0.12] shadow-2xl relative group">
            {/* Display screen */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-white/[0.08]">
              <img
                src={chapters[activeChapter].videoUrl}
                alt={chapters[activeChapter].title}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isPlaying ? "scale-105 filter brightness-95" : "filter brightness-80"
                }`}
              />

              {/* Screen Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex flex-col justify-between p-6 sm:p-8">
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 glass-morphism px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>CHAPTER {activeChapter + 1} OF 4: {chapters[activeChapter].title.toUpperCase()}</span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-9 h-9 rounded-full glass-morphism flex items-center justify-center text-slate-300 hover:text-white hover:scale-105 transition-all cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Center Play Button */}
                <div className="self-center">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      setModalOpen(true);
                    }}
                    className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer group/btn"
                  >
                    <Play className="w-8 h-8 fill-slate-950 ml-1 group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>

                {/* Bottom Controls Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{chapters[activeChapter].time}</span>
                      <span className="text-slate-500">/ 02:15</span>
                      <span className="text-slate-400 hidden sm:inline">· {chapters[activeChapter].desc}</span>
                    </div>

                    <button
                      onClick={() => setModalOpen(true)}
                      className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Full Screen</span>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${((activeChapter + 1) / chapters.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Selection Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-3">
              {chapters.map((ch, idx) => {
                const Icon = ch.icon;
                const isActive = activeChapter === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveChapter(idx)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-white"
                        : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {ch.time}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate text-white">
                        {ch.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                        {ch.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Video Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl glass-morphism border border-white/20 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs font-bold text-white tracking-wide">
                  HOMEVERSE 3D SPATIAL CAD & BUDGETING WALKTHROUGH
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full glass-morphism flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img
                src={chapters[activeChapter].videoUrl}
                alt="Walkthrough Preview"
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-2xl shadow-emerald-500/50">
                  ▶
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-white font-editorial max-w-lg">
                  {chapters[activeChapter].title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 font-light max-w-md">
                  {chapters[activeChapter].desc}. HomeVerse brings zero-friction spatial 3D architectural modeling right inside your modern web browser.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs font-mono text-slate-400">
                Resolution: 4K WebGL · Real-Time Dynamic PBR Rendering
              </span>
              <button
                onClick={() => {
                  setModalOpen(false);
                  window.location.href = "/home/new";
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all"
              >
                Try It Yourself Free →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDemoVideo;
