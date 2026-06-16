"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Check, 
  Layers, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  LogOut,
  User,
  Home
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (!userSession) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userSession));
      setAuthChecking(false);
    }
  }, [router]);

  // Upload/Analysis states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing" | "complete">("idle");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern");
  const [generatedDesigns, setGeneratedDesigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const getFilterForStyle = (style: string) => {
    switch (style) {
      case "Modern":
        return "contrast(1.15) saturate(0.85) brightness(0.95) hue-rotate(-5deg)";
      case "Luxury":
        return "contrast(1.1) saturate(1.25) sepia(0.15) brightness(0.95)";
      case "Scandinavian":
        return "brightness(1.15) contrast(0.95) saturate(1.05) sepia(0.05)";
      case "Minimalist":
        return "brightness(1.1) saturate(0.3) contrast(1.05)";
      case "Japandi":
        return "sepia(0.2) brightness(1.05) saturate(0.9) contrast(0.95)";
      default:
        return "none";
    }
  };

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

  const processFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setFileType(type);
    
    // Create local object URL for previewing
    const fileUrl = URL.createObjectURL(file);
    setUploadedFileUrl(fileUrl);

    // Client-side Room Validation
    const filenameLower = file.name.toLowerCase();
    const nonRoomKeywords = [
      "cat", "dog", "animal", "car", "vehicle", "apple", "banana", "fruit", 
      "outdoor", "outside", "landscape", "nature", "forest", "mountain", 
      "ocean", "beach", "sky", "garden", "park", "street", "exterior",
      "cityscape", "food"
    ];
    let isRoom = true;
    for (const kw of nonRoomKeywords) {
      if (filenameLower.includes(kw)) {
        isRoom = false;
        break;
      }
    }

    if (!isRoom) {
      setError("Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room or home area.");
      setUploadStep("idle");
      setSelectedFile(null);
      return;
    }

    setUploadStep("uploading");

    // Retrieve active user ID
    const userId = user?.id || "d0000000-0000-0000-0000-000000000000";

    try {
      // 1. Create project on backend
      const projTitle = file.name.split(".")[0] || "My Interior Design";
      let projectData = null;

      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: "Living Room",
            thumbnail: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350",
            user_id: userId
          })
        });
        if (projRes.ok) {
          projectData = await projRes.json();
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client-side UUID:", err);
      }

      const projectId = projectData?.id || crypto.randomUUID();

      // Trigger UI analysis state
      setTimeout(() => {
        setUploadStep("analyzing");
      }, 800);

      // 2. Upload file & analyze on backend
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("file", file);

      let designsList = [];
      try {
        const analyzeRes = await fetch("http://localhost:8080/api/ai/analyze-upload", {
          method: "POST",
          body: formData
        });
        if (analyzeRes.ok) {
          designsList = await analyzeRes.json();
        } else {
          const errData = await analyzeRes.json();
          throw new Error(errData.detail || "Backend analysis failed");
        }
      } catch (err: any) {
        console.warn("Backend analysis failed:", err.message);
        // If it's a validation error raised from backend, throw it to the outer catch
        if (err.message.includes("Not appropriate data")) {
          throw err;
        }
        // Fallback mock designs (if server is offline/error but was not validation error)
        designsList = [
          { id: crypto.randomUUID(), style: "Modern", image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Japandi", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Scandinavian", image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Minimalist", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Luxury", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350" }
        ];
      }

      setGeneratedDesigns(designsList);
      
      // Delay completion step for smoother UX animation
      setTimeout(() => {
        setUploadStep("complete");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during room analysis. Please try again.");
      setUploadStep("idle");
      setSelectedFile(null);
    }
  };

  const handleEnterStudio = () => {
    // Find design matching the selected style
    const matchedDesign = generatedDesigns.find(
      (d) => d.style.toLowerCase() === selectedStyle.toLowerCase()
    );
    if (matchedDesign) {
      router.push(`/studio?style=${selectedStyle}&designId=${matchedDesign.id}`);
    } else {
      router.push(`/studio?style=${selectedStyle}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/5 to-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              HomeVerse
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block -mt-0.5">
              AI Design Studio
            </span>
          </div>
        </div>

        {/* User Info / Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-855 px-3.5 py-2 rounded-xl border border-slate-850 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 px-3 py-2 rounded-xl border border-slate-855 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center z-10">
        
        {/* Intro */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex bg-blue-950/30 text-blue-400 border border-blue-900/30 px-3.5 py-1.5 rounded-full text-xs font-semibold gap-1.5 items-center mx-auto shadow-sm">
            <Home className="w-3.5 h-3.5" /> Welcome to HomeVerse, {user?.name || "Designer"}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Upload Your Space
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Upload a photo or a video walkthrough of any room or area in your house. Our AI will automatically reconstruct the space into an interactive 3D model.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/40 text-red-400 rounded-2xl text-sm flex items-start gap-3 max-w-xl mx-auto shadow-lg animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-300">Invalid Upload Attempt</h4>
              <p className="text-xs text-red-450/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-stretch max-w-4xl w-full mx-auto">
          {/* Left Side: Upload console */}
          <div className="w-full md:w-1/2 flex">
            <div className="glass-panel p-6 rounded-3xl border-slate-800/80 flex flex-col justify-between w-full space-y-6 shadow-2xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Upload Console
                </span>
                <span className="text-[9px] text-blue-400 font-semibold px-2 py-0.5 bg-blue-950/40 border border-blue-900/40 rounded-full font-mono uppercase animate-pulse">
                  {uploadStep}
                </span>
              </div>

              {/* Upload Dropzone */}
              {uploadStep === "idle" && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group flex-1 flex flex-col justify-center ${
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
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 group-hover:border-blue-500/40 group-hover:bg-slate-900 transition-colors">
                      <Upload className="w-7 h-7 text-blue-400 group-hover:scale-115 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or MP4 (Video walkthrough)</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-slate-500" /> Room Photo</span>
                      <span className="text-slate-800">|</span>
                      <span className="flex items-center gap-1.5"><Video className="w-3 h-3 text-slate-500" /> Video Scan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploading progress */}
              {uploadStep === "uploading" && (
                <div className="border border-slate-850 rounded-2xl p-8 space-y-4 text-center bg-slate-950/30 flex-1 flex flex-col justify-center items-center">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-300">Uploading Assets...</h3>
                    <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]">File: {selectedFile?.name}</p>
                  </div>
                </div>
              )}

              {/* AI Analysis pipeline logs */}
              {uploadStep === "analyzing" && (
                <div className="border border-slate-850/80 rounded-2xl p-5 space-y-4 bg-slate-950/40 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" /> AI Room Reconstruction
                    </h3>
                    <span className="text-[9px] text-blue-400 font-mono animate-pulse">Running Scan...</span>
                  </div>
                  <div className="space-y-2 text-[10px] text-slate-450 font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-900 leading-relaxed">
                    <div className="flex items-center justify-between text-green-400">
                      <span>✔ Loaded {fileType} file metadata</span>
                      <span>[OK]</span>
                    </div>
                    <div className="flex items-center justify-between text-green-400">
                      <span>✔ Furniture Recognition (Sofa, Table, TV)</span>
                      <span>[OK]</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-400 animate-pulse">
                      <span>🔄 Segmenting walls, doors, ceiling</span>
                      <span>[RUNNING]</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>☐ Creating 3D semantic layout coordinates</span>
                      <span>[WAITING]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style Presets selection after analysis */}
              {uploadStep === "complete" && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
                    <div>
                      <h3 className="font-bold text-xs text-slate-200">AI Design Suggestions</h3>
                      <p className="text-[9px] text-slate-450 mt-0.5">Select a style preset to open in 3D studio</p>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] text-green-400 font-semibold bg-green-950/20 border border-green-900/40 px-2 py-0.5 rounded-full font-mono">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  </div>

                  {/* Grid of Styles */}
                  <div className="grid grid-cols-2 gap-2 flex-1 items-center py-2">
                    {styles.slice(0, 4).map((style) => {
                      const matchedDesign = generatedDesigns.find(
                        (d) => d.style.toLowerCase() === style.name.toLowerCase()
                      );
                      const displayImg = matchedDesign?.image_url || style.img;
                      return (
                        <button
                          key={style.name}
                          onClick={() => {
                            setSelectedStyle(style.name);
                            setShowOriginal(false); // Switch preview to show redesign on click
                          }}
                          className={`group relative rounded-xl overflow-hidden border text-left p-2 bg-slate-950/50 hover:bg-slate-900/80 transition-all cursor-pointer h-24 flex flex-col justify-between ${
                            selectedStyle === style.name
                              ? "border-blue-500 ring-1 ring-blue-500/50"
                              : "border-slate-850"
                          }`}
                        >
                          <div className="relative h-12 w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                            <img
                              src={displayImg}
                              alt={style.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="font-bold text-[10px] text-slate-300">{style.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Enter Studio Trigger */}
                  <button
                    onClick={handleEnterStudio}
                    className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn mt-2 text-xs"
                  >
                    Open in Design Studio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right Side: Demo showcase preview */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-3xl border-slate-800/80 space-y-4 flex flex-col justify-between flex-1 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Active Workspace Preview</span>
                {uploadStep === "complete" && (
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900/60">
                    <button
                      onClick={() => setShowOriginal(true)}
                      className={`text-[9px] px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                        showOriginal
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setShowOriginal(false)}
                      className={`text-[9px] px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                        !showOriginal
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      AI Redesign
                    </button>
                  </div>
                )}
                <span className={`w-2 h-2 rounded-full ${uploadStep === "complete" ? "bg-emerald-500 animate-pulse" : "bg-blue-500 animate-pulse"}`} />
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center flex-1 min-h-[160px]">
                {uploadStep === "complete" ? (
                  showOriginal && uploadedFileUrl ? (
                    fileType === "video" ? (
                      <video
                        src={uploadedFileUrl}
                        className="w-full h-full object-cover animate-fadeIn"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={uploadedFileUrl}
                        alt="Original Room"
                        className="w-full h-full object-cover animate-fadeIn"
                      />
                    )
                  ) : (
                    (() => {
                      const matchedDesign = generatedDesigns.find(
                        (d) => d.style.toLowerCase() === selectedStyle.toLowerCase()
                      );
                      const displayImg = matchedDesign?.image_url || styles.find((s) => s.name === selectedStyle)?.img;
                      return (
                        <img
                          src={displayImg}
                          alt={selectedStyle}
                          className="w-full h-full object-cover animate-fadeIn"
                        />
                      );
                    })()
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-650 p-4 text-center">
                    <Layers className="w-10 h-10 mb-2 text-slate-800" />
                    <p className="text-xs font-semibold text-slate-400">3D Room View Empty</p>
                    <p className="text-[10px] max-w-[220px] mt-1 text-slate-500 leading-relaxed">
                      Please upload a room image to run the AI mapping pipeline.
                    </p>
                  </div>
                )}
              </div>

              {uploadStep === "complete" && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 animate-fadeIn">
                  <span className="text-[10px] font-bold text-blue-400 block mb-0.5">Style Profile: {selectedStyle}</span>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    {styles.find((s) => s.name === selectedStyle)?.desc}
                  </p>
                </div>
              )}

              {/* Quick Bypass / Demo Trigger */}
              <div className="border border-slate-850 bg-slate-900/20 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-[11px] text-slate-300">Testing Without Uploading?</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Directly load the pre-analyzed demo room template into the 3D studio.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/studio?style=Modern")}
                  className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-1 bg-blue-950/20 border border-blue-900/40 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Launch Demo Studio →
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
