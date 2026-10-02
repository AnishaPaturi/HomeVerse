"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Layers,
  Box,
  IndianRupee,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface Chapter {
  time: string;
  seconds: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

export const ProductDemoVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isHoveringVideo, setIsHoveringVideo] = useState<boolean>(false);

  const chapters: Chapter[] = [
    {
      time: "00:00",
      seconds: 0,
      title: "Blueprint Ingestion",
      icon: Layers,
      desc: "Instant vectorization of 2D blueprints & CAD sketches",
    },
    {
      time: "00:03",
      seconds: 3,
      title: "AI Dimension & Wall OCR",
      icon: Sparkles,
      desc: "Automatic wall detection & millimeter metric calculations",
    },
    {
      time: "00:06",
      seconds: 6,
      title: "3D CAD Twin & Materials",
      icon: Box,
      desc: "Interactive WebGL studio with curated architectural styles",
    },
    {
      time: "00:08",
      seconds: 8,
      title: "Budget Delta & Vendor BOM",
      icon: IndianRupee,
      desc: "Real-time cost recalculation & contractor-ready tender export",
    },
  ];

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  // Toggle audio mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Handle time update to track chapter and progress
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Auto-detect current active chapter
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (curr >= chapters[i].seconds) {
        setActiveChapter(i);
        break;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration;
    if (d && !isNaN(d)) {
      setDuration(d);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Jump to specific chapter timestamp
  const seekToChapter = (chapterIndex: number) => {
    if (!videoRef.current) return;
    const targetSeconds = chapters[chapterIndex].seconds;
    videoRef.current.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
    setActiveChapter(chapterIndex);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  // Interactive scrubbing on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newPercentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Open modal and sync video playback
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setModalOpen(true);
  };

  useEffect(() => {
    if (modalOpen && modalVideoRef.current) {
      modalVideoRef.current.currentTime = currentTime;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [modalOpen]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section id="demo-video" className="py-24 px-6 lg:px-12 bg-[#05080c] relative border-t border-white/[0.06]">
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
            <div
              className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-white/[0.08] cursor-pointer"
              onMouseEnter={() => setIsHoveringVideo(true)}
              onMouseLeave={() => setIsHoveringVideo(false)}
              onClick={togglePlay}
            >
              {/* Actual HTML5 Video Element */}
              <video
                ref={videoRef}
                src="/demo-video.mp4"
                playsInline
                preload="metadata"
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="w-full h-full object-cover"
              />

              {/* Screen Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-opacity duration-300 ${
                  isPlaying && !isHoveringVideo ? "opacity-0 hover:opacity-100" : "opacity-100"
                }`}
              >
                {/* Top Badge Strip */}
                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 glass-morphism px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      CHAPTER {activeChapter + 1} OF 4: {chapters[activeChapter].title.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="w-9 h-9 rounded-full glass-morphism flex items-center justify-center text-slate-300 hover:text-white hover:scale-105 transition-all cursor-pointer border border-white/10"
                      title={isMuted ? "Unmute Audio" : "Mute Audio"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="w-9 h-9 rounded-full glass-morphism flex items-center justify-center text-slate-300 hover:text-white hover:scale-105 transition-all cursor-pointer border border-white/10"
                      title="Expand Video"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Center Play/Pause Button */}
                <div className="self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer group/btn"
                    title={isPlaying ? "Pause Video" : "Play Demo Video"}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-slate-950" />
                    ) : (
                      <Play className="w-8 h-8 fill-slate-950 ml-1 group-hover/btn:scale-110 transition-transform" />
                    )}
                  </button>
                </div>

                {/* Bottom Controls Bar */}
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-sm">
                        {formatTime(currentTime)}
                      </span>
                      <span className="text-slate-500">/ {formatTime(duration)}</span>
                      <span className="text-slate-400 hidden sm:inline">
                        · {chapters[activeChapter].desc}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            videoRef.current.play().catch(() => {});
                          }
                        }}
                        className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Restart</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenModal}
                        className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Full Screen</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Progress Bar */}
                  <div
                    ref={progressBarRef}
                    onClick={handleProgressBarClick}
                    className="w-full h-2 bg-white/20 hover:h-2.5 rounded-full overflow-hidden relative cursor-pointer transition-all group/bar"
                  >
                    <div
                      className="h-full bg-emerald-400 transition-[width] duration-150 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                      style={{ width: `${progressPercent}%` }}
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
                    type="button"
                    onClick={() => seekToChapter(idx)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 border ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10 scale-[1.02]"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate text-white flex items-center gap-1.5">
                        <span>{ch.title}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full glass-morphism flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-sm border border-white/10"
              >
                ✕
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <video
                ref={modalVideoRef}
                src="/demo-video.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs font-mono text-slate-400">
                Resolution: 4K WebGL · Real-Time Dynamic PBR Rendering
              </span>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  window.location.href = "/home/new";
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
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
