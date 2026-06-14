"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, Image as ImageIcon, Video, Check, Layers, AlertCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing" | "complete">("idle");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern");

  // Sample style cards
  const styles = [
    { name: "Modern", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350", desc: "Sleek lines, dark wood accents, metal fixtures" },
    { name: "Japandi", img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350", desc: "East meets West. Warm wood, clean canvas, low profile" },
    { name: "Scandinavian", img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350", desc: "Light oak, high contrast, hygge vibes" },
    { name: "Minimalist", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350", desc: "Maximum space, hidden storage, monochrome" },
    { name: "Luxury", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350", desc: "Polished marble, gold lining, velvet upholstery" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setFileType(type);
    setUploadStep("uploading");

    // Simulate upload and AI Analysis
    setTimeout(() => {
      setUploadStep("analyzing");
    }, 1500);

    setTimeout(() => {
      setUploadStep("complete");
    }, 3500);
  };

  const handleEnterStudio = () => {
    // Navigate to /studio, pass selected style
    router.push(`/studio?style=${selectedStyle}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            HomeVerse
          </span>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-blue-950/40 text-blue-400 border border-blue-900/60 rounded-full">
          Academic Prototype MVP
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Side: Upload & Control Panel */}
        <div className="w-full lg:w-1/2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Transform your room <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                using AI and 3D Studio
              </span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Upload a single photo or a video scan of your living room, bedroom, office, or kitchen. Within seconds, customize colors, furniture and layout interactively.
            </p>
          </div>

          {/* Upload Dropzone */}
          {uploadStep === "idle" && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative group ${
                dragActive
                  ? "border-blue-500 bg-blue-950/20"
                  : "border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
              }`}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 group-hover:border-blue-500/40 group-hover:bg-slate-900 transition-colors">
                  <Upload className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, or MP4 (Video walkthrough)</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Room Photo</span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video Scan</span>
                </div>
              </div>
            </div>
          )}

          {/* Uploading progress */}
          {uploadStep === "uploading" && (
            <div className="glass-panel border-slate-800 rounded-2xl p-8 space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="font-bold">Uploading Assets...</h3>
                <p className="text-xs text-slate-400 mt-1">Sending file: {selectedFile?.name}</p>
              </div>
            </div>
          )}

          {/* AI Analysis pipeline */}
          {uploadStep === "analyzing" && (
            <div className="glass-panel border-slate-800 rounded-2xl p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-spin" /> AI Room Reconstruction
                </h3>
                <span className="text-xs text-blue-400 font-mono animate-pulse">Running YOLOv11 + SAM 2...</span>
              </div>
              <div className="space-y-2.5 text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="flex items-center justify-between text-green-400">
                  <span>✔ Loading {fileType} file metadata</span>
                  <span>[OK]</span>
                </div>
                <div className="flex items-center justify-between text-green-400">
                  <span>✔ Object Detection (YOLOv11: Sofa, Table, TV)</span>
                  <span>[OK]</span>
                </div>
                <div className="flex items-center justify-between text-blue-400">
                  <span className="animate-pulse">🔄 Segmenting walls, doors, ceiling (SAM 2)</span>
                  <span>[RUNNING]</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>☐ Creating 3D semantic layout coordinates</span>
                  <span>[WAITING]</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Variations Panel */}
          {uploadStep === "complete" && (
            <div className="glass-panel border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h3 className="font-bold text-slate-100">AI Design Suggestions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Choose your design style to open in 3D studio</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-950/40 border border-green-900/60 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" /> Reconstruction Ready
                </span>
              </div>

              {/* Grid of Styles */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setSelectedStyle(style.name)}
                    className={`group relative rounded-xl overflow-hidden border text-left p-3.5 bg-slate-900/50 hover:bg-slate-900/80 transition-all cursor-pointer ${
                      selectedStyle === style.name
                        ? "border-blue-500 ring-1 ring-blue-500/50"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <img src={style.img} alt={style.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="font-bold text-xs text-slate-200">{style.name}</span>
                  </button>
                ))}
              </div>

              {/* Enter Studio Trigger */}
              <button
                onClick={handleEnterStudio}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all cursor-pointer glow-btn mt-4 text-sm"
              >
                Open in Design Studio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Demo showcase / Mock layout preview */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Workspace Preview</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              {uploadStep === "complete" ? (
                <img
                  src={styles.find((s) => s.name === selectedStyle)?.img}
                  alt={selectedStyle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                  <Layers className="w-12 h-12 mb-3 text-slate-800" />
                  <p className="text-sm font-semibold">3D Room View Empty</p>
                  <p className="text-xs max-w-xs mt-1">Upload a photo or video walkthrough to see the AI redesign options and enter the editable viewport.</p>
                </div>
              )}
            </div>

            {uploadStep === "complete" && (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40">
                <span className="text-xs font-semibold text-blue-400 block mb-1">Style Profile: {selectedStyle}</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {styles.find((s) => s.name === selectedStyle)?.desc}
                </p>
              </div>
            )}
          </div>

          {/* Quick Start Card */}
          <div className="border border-slate-800/80 bg-slate-900/20 p-5 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-slate-200">Testing Without Uploading?</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                You can bypass upload to test immediately. Click the button below to load our pre-analyzed demo room template right inside the studio.
              </p>
              <button
                onClick={() => router.push("/studio?style=Modern")}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-blue-950/20 border border-blue-900/40 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Launch Pre-Loaded Demo Studio →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
