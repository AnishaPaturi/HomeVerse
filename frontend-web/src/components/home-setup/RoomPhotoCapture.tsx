"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight,
  Maximize2,
} from "lucide-react";

export interface CapturedPhoto {
  id: string;
  url: string;
  source: "camera" | "upload" | "sample";
  label: string;
  name?: string;
  timestamp: string;
}

interface RoomPhotoCaptureProps {
  roomName: string;
  designStyle: string;
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  onProceed: () => void;
}

export const RoomPhotoCapture: React.FC<RoomPhotoCaptureProps> = ({
  roomName,
  designStyle,
  photos,
  onPhotosChange,
  onProceed,
}) => {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or Stop camera stream when mode or facingMode changes
  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported by your browser. Please upload photos instead.");
        setMode("upload");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings or upload photos directly."
          : "Unable to connect to camera device. Please upload room pictures instead."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture snapshot from live video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      const photoNum = photos.length + 1;
      const newPhoto: CapturedPhoto = {
        id: `photo-${Date.now()}-${photoNum}`,
        url: dataUrl,
        source: "camera",
        label: getAngleLabel(photoNum),
        name: `${roomName} - Angle ${photoNum}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      onPhotosChange([...photos, newPhoto]);
    }

    setTimeout(() => {
      setIsCapturing(false);
    }, 200);
  };

  // Handle file uploads (multiple images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: CapturedPhoto[] = [];
    let currentCount = photos.length;

    Array.from(files).forEach((file) => {
      currentCount++;
      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `upload-${Date.now()}-${currentCount}`,
        url,
        source: "upload",
        label: getAngleLabel(currentCount),
        name: file.name,
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    onPhotosChange([...photos, ...newPhotos]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper: auto-generate standard architectural perspective labels
  const getAngleLabel = (idx: number): string => {
    switch (idx) {
      case 1:
        return "Angle 1 (Wide Entrance)";
      case 2:
        return "Angle 2 (Corner Perspective)";
      case 3:
        return "Angle 3 (Window / Daylight Wall)";
      default:
        return `Perspective ${idx}`;
    }
  };

  // Load sample photos for instant testing
  const handleLoadSamplePhotos = () => {
    const samples: CapturedPhoto[] = [
      {
        id: `sample-1`,
        url: "/rooms/empty-room.png",
        source: "sample",
        label: "Angle 1 (Empty Room View)",
        name: "Empty Room Raw Scan",
        timestamp: "Sample Scan",
      },
      {
        id: `sample-2`,
        url: "/rooms/master-bed-room-1.png",
        source: "sample",
        label: "Angle 2 (Daylight Perspective)",
        name: "Natural Light Perspective",
        timestamp: "Sample Scan",
      },
    ];
    onPhotosChange(samples);
  };

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvas for video captures */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#090e15] border border-white/[0.08] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Camera className="w-3.5 h-3.5" />
              <span>ROOM VISUAL INTAKE · {roomName.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Capture or Upload Pictures of {roomName}
            </h2>
            <p className="text-xs text-slate-400 font-light">
              Take a couple of pictures or upload existing photos. The AI will synthesize photorealistic 3D room concepts matching your <strong className="text-emerald-400">{designStyle}</strong> style DNA.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMode("camera")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                mode === "camera"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                mode === "upload"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Capture / Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Camera Viewfinder OR Upload Dropzone */}
        <div className="lg:col-span-7 space-y-4">
          {mode === "camera" ? (
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-white/10 aspect-video sm:aspect-[4/3] flex items-center justify-center shadow-2xl">
              {cameraError ? (
                <div className="p-8 text-center space-y-4 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
                    <p className="text-xs text-slate-400">{cameraError}</p>
                  </div>
                  <button
                    onClick={() => setMode("upload")}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-mono text-emerald-400 transition-all cursor-pointer"
                  >
                    Switch to Upload Mode &rarr;
                  </button>
                </div>
              ) : (
                <>
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Architectural Rule-of-Thirds Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-b border-emerald-400/40" />
                    <div className="border-r border-emerald-400/40" />
                    <div className="border-r border-emerald-400/40" />
                    <div />
                  </div>

                  {/* Center Crosshair Horizon Marker */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 border border-emerald-400/40 rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                    </div>
                  </div>

                  {/* Top Status Banner on Camera */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live CAD Viewfinder · {roomName}</span>
                    </div>

                    <button
                      onClick={toggleCameraFacing}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-emerald-400 transition-colors pointer-events-auto cursor-pointer"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Camera Action Bar */}
                  <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4">
                    <button
                      onClick={handleSnapPhoto}
                      disabled={isCapturing || !cameraActive}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCapturing ? "Capturing..." : "Take Picture"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-3xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-[#090e15] p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-slate-950/60 group space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 group-hover:scale-110 group-hover:border-emerald-500/40 transition-transform">
                <Upload className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Drop pictures of {roomName} here
                </h4>
                <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
                  Drag and drop 1 to 4 photos from your phone or computer, or click to browse. Supports JPG, PNG, and HEIC.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs font-bold border border-slate-800 group-hover:border-emerald-500/40 transition-all">
                  Browse Room Files
                </span>
              </div>
            </div>
          )}

          {/* Guidance Card with Quick Sample Option */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>
                Tip: Capture from opposite room corners with good daylight for optimal depth analysis.
              </span>
            </div>

            <button
              onClick={handleLoadSamplePhotos}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-mono font-bold text-[11px] border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shrink-0"
            >
              Use Sample Room Photos
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Captured Photos Tray & AI Generative Output Targets */}
        <div className="lg:col-span-5 space-y-4">
          {/* Photos Tray */}
          <div className="p-5 rounded-3xl bg-[#090e15] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-mono">
                  Captured Room Photos ({photos.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {photos.length === 0 ? "0 photos" : `${photos.length} angle(s)`}
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  No pictures added yet. Snap a picture with camera or upload files to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-900">
                      <img
                        src={p.url}
                        alt={p.name || `Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 space-y-0.5 bg-slate-950">
                      <div className="text-[11px] font-bold text-white font-mono truncate">
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono capitalize">
                        {p.source} capture · {p.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Generative Renders Preview (Shows Master-Bed-Room-1 & Master-Bed-Room-2 style targets) */}
          <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-xs text-white font-mono uppercase tracking-wider">
                AI Target Generative Output ({designStyle})
              </h4>
            </div>

            <p className="text-[11px] text-slate-300 font-light leading-relaxed">
              Based on your {roomName} photos, the AI synthesis pipeline will generate 3D photorealistic perspective images like these:
            </p>

            {/* Target Sample Renders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setSelectedPreviewPhoto("/rooms/master-bed-room-1.png")}
                className="group relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 cursor-pointer"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src="/rooms/master-bed-room-1.png"
                    alt={`${designStyle} Concept 1`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2 bg-slate-950/90 text-center">
                  <span className="text-[10px] font-mono text-emerald-300 font-bold block truncate">
                    {designStyle} View 1
                  </span>
                </div>
              </div>

              <div
                onClick={() => setSelectedPreviewPhoto("/rooms/master-bed-room-2.png")}
                className="group relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 cursor-pointer"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src="/rooms/master-bed-room-2.png"
                    alt={`${designStyle} Concept 2`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2 bg-slate-950/90 text-center">
                  <span className="text-[10px] font-mono text-emerald-300 font-bold block truncate">
                    {designStyle} View 2
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-400">
              <span>Verified Spatial Clearances</span>
              <span>Indian Catalog Pricing Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Lightbox preview */}
      {selectedPreviewPhoto && (
        <div
          onClick={() => setSelectedPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-3xl w-full rounded-3xl overflow-hidden bg-slate-950 border border-white/20 shadow-2xl">
            <img
              src={selectedPreviewPhoto}
              alt="Target AI Render"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-4 bg-slate-950 text-center text-xs font-mono text-emerald-400">
              Photorealistic 3D PBR Spatial Render ({designStyle} DNA) · Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
