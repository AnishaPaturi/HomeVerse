"use client";

import React, { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { X, RotateCw, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface VRPanoramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStyle: string;
}

// Beautiful equirectangular or high-quality 360-ish room images representing each style
const PANORAMA_TEXTURES: Record<string, string> = {
  Modern: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop",
  Luxury: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop",
  Scandinavian: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1600&auto=format&fit=crop",
  Minimalist: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1600&auto=format&fit=crop",
  Japandi: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop",
  Industrial: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop",
  Contemporary: "https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?q=80&w=1600&auto=format&fit=crop",
};

function PanoramaSphere({ url }: { url: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const loader = new THREE.TextureLoader();
    
    // Enable cross-origin image loading
    loader.setCrossOrigin("anonymous");
    
    loader.load(
      url,
      (loadedTexture) => {
        // Map texture properly
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load panorama texture:", err);
        setError(true);
        setLoading(false);
      }
    );
  }, [url]);

  if (loading) {
    return null;
  }

  // Draw a sphere rendering on the inside (-1 scale on X axis)
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial 
        map={texture || undefined} 
        side={THREE.BackSide} 
      />
    </mesh>
  );
}

export default function VRPanoramaModal({
  isOpen,
  onClose,
  initialStyle,
}: VRPanoramaModalProps) {
  const [currentStyle, setCurrentStyle] = useState(initialStyle);
  const [autoRotate, setAutoRotate] = useState(true);
  const [loadingStyle, setLoadingStyle] = useState(false);

  useEffect(() => {
    setCurrentStyle(initialStyle);
  }, [initialStyle]);

  if (!isOpen) return null;

  const currentTextureUrl = PANORAMA_TEXTURES[currentStyle] || PANORAMA_TEXTURES.Modern;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 md:p-8 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                JoyPlan 720° VR Panorama Tour
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-450 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  PRO VIEW
                </span>
              </h2>
              <p className="text-[10px] text-slate-500">
                Immersive 3D walk-through simulation of selected {currentStyle} room interior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Viewport Panel */}
        <div className="flex-1 relative bg-black">
          <Suspense
            fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-xs font-semibold tracking-wider font-mono">
                  GENERATING 720° VR TEXTURES...
                </span>
              </div>
            }
          >
            <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                autoRotate={autoRotate}
                autoRotateSpeed={0.6}
                rotateSpeed={-0.4} // Negative speed matches drag direction
              />
              <PanoramaSphere url={currentTextureUrl} />
            </Canvas>
          </Suspense>

          {/* Quick HUD Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between items-center gap-3 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 pointer-events-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Rotation:
              </span>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                  autoRotate
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                {autoRotate ? "AUTO" : "MANUAL"}
              </button>
            </div>

            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 text-[9px] text-slate-400 font-mono pointer-events-auto">
              Drag mouse to look around • Scroll to zoom
            </div>
          </div>
        </div>

        {/* Style Selection footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
              Style Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(PANORAMA_TEXTURES).map((style) => (
                <button
                  key={style}
                  onClick={() => setCurrentStyle(style)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                    currentStyle === style
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-450 shadow-sm shadow-amber-500/5 font-extrabold"
                      : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Interactive rendering powered by JoyPlan 720° WebGL engine</span>
          </div>
        </div>

      </div>
    </div>
  );
}
