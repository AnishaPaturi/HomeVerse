"use client";

// Silence internal Three.js deprecation warnings (e.g. THREE.Clock, THREE.WebGLShadowMap)
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("THREE.Clock") || args[0].includes("THREE.WebGLShadowMap"))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Sparkles, CheckCircle2, AlertTriangle, IndianRupee, Eye, Wand2 } from "lucide-react";

interface Hero3DSceneProps {
  styleName?: string;
  onStyleChange?: (style: string) => void;
}

// Procedural 3D Furniture Meshes with PBR Materials
function Sofa3D({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <group position={[-0.8, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Base Cushion */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.3, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Back Support */}
      <mesh position={[0, 0.75, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.7, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.15, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.55, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.15, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.55, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Throw Pillows */}
      <mesh position={[-0.7, 0.5, -0.22]} rotation={[0.2, 0.1, 0]} castShadow>
        <boxGeometry args={[0.38, 0.38, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.7, 0.5, -0.22]} rotation={[0.2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.38, 0.38, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
      {/* Wooden Legs */}
      {[
        [-1.0, 0.08, -0.38],
        [1.0, 0.08, -0.38],
        [-1.0, 0.08, 0.38],
        [1.0, 0.08, 0.38],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.16]} />
          <meshStandardMaterial color="#451a03" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable3D({ color, topMaterial }: { color: string; topMaterial: "glass" | "wood" | "marble" }) {
  return (
    <group position={[0.5, 0, 0.9]} rotation={[0, -Math.PI / 8, 0]}>
      {/* Tabletop */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.75]} />
        {topMaterial === "glass" ? (
          <meshStandardMaterial color="#94a3b8" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
        ) : topMaterial === "marble" ? (
          <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.2} />
        ) : (
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        )}
      </mesh>
      {/* Base Shelving */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.1, 0.03, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[
        [-0.55, 0.22, -0.3],
        [0.55, 0.22, -0.3],
        [-0.55, 0.22, 0.3],
        [0.55, 0.22, 0.3],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.44]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Coffee Table Book / Decor */}
      <mesh position={[-0.2, 0.47, 0]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.26, 0.03, 0.35]} />
        <meshStandardMaterial color="#0d9488" roughness={0.3} />
      </mesh>
    </group>
  );
}

function FloorLamp3D() {
  return (
    <group position={[-2.3, 0, -1.2]}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 2.2]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Lamp Shade */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.32, 0.45, 32, 1, true]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Warm Ambient Glow */}
      <pointLight position={[0, 2.05, 0]} intensity={1.8} color="#fde047" distance={4} />
    </group>
  );
}

function ModernPottedPlant() {
  return (
    <group position={[2.4, 0, -1.8]}>
      {/* Ceramic Pot */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.7, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Wooden Stand */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.3, 4]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      {/* Foliage Spheres */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>
      <mesh position={[0.15, 1.15, -0.1]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 1.05, 0.1]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
    </group>
  );
}

function WallArtCanvas({ accentColor }: { accentColor: string }) {
  return (
    <group position={[0, 2.2, -3.92]}>
      {/* Wooden Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.4, 0.05]} />
        <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Canvas Artwork */}
      <mesh position={[0, 0, 0.03]} receiveShadow>
        <planeGeometry args={[2.28, 1.28]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function Hero3DScene({ styleName = "Japandi", onStyleChange }: Hero3DSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [activeStyle, setActiveStyle] = useState(styleName);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveStyle(styleName);
  }, [styleName]);

  const handleStyleSelect = (style: string) => {
    setActiveStyle(style);
    if (onStyleChange) onStyleChange(style);
  };

  // Color & material profiles per design style
  const getStyleTheme = (style: string) => {
    switch (style.toLowerCase()) {
      case "japandi":
        return {
          wall: "#f5f5f4",
          floor: "#e7e5e4",
          sofa: "#b45309",
          accent: "#0f766e",
          table: "#78350f",
          tableType: "wood" as const,
          floorRoughness: 0.7,
          floorMetalness: 0.05,
          promptText: "Make this more Japandi with organic textures & warm lighting.",
          budget: "₹8,42,000",
        };
      case "scandinavian":
        return {
          wall: "#f8fafc",
          floor: "#cbd5e1",
          sofa: "#e2e8f0",
          accent: "#0284c7",
          table: "#f8fafc",
          tableType: "wood" as const,
          floorRoughness: 0.6,
          floorMetalness: 0.05,
          promptText: "Bright Scandinavian setup with bleached oak and cozy textiles.",
          budget: "₹7,95,000",
        };
      case "modern luxury":
      case "luxury":
        return {
          wall: "#0f172a",
          floor: "#334155",
          sofa: "#1e293b",
          accent: "#d97706",
          table: "#ffffff",
          tableType: "marble" as const,
          floorRoughness: 0.15,
          floorMetalness: 0.3,
          promptText: "Upgrade to Modern Luxury with Calacatta marble & gold brass trims.",
          budget: "₹14,20,000",
        };
      case "industrial":
        return {
          wall: "#27272a",
          floor: "#18181b",
          sofa: "#451a03",
          accent: "#ea580c",
          table: "#09090b",
          tableType: "glass" as const,
          floorRoughness: 0.8,
          floorMetalness: 0.2,
          promptText: "Industrial urban loft with exposed dark metal and rich leather.",
          budget: "₹9,10,000",
        };
      case "contemporary":
        return {
          wall: "#f1f5f9",
          floor: "#e2e8f0",
          sofa: "#334155",
          accent: "#6366f1",
          table: "#94a3b8",
          tableType: "glass" as const,
          floorRoughness: 0.3,
          floorMetalness: 0.2,
          promptText: "Curvaceous contemporary silhouette with statement ambient glow.",
          budget: "₹10,50,000",
        };
      case "modern":
      default:
        return {
          wall: "#1e293b",
          floor: "#0f172a",
          sofa: "#334155",
          accent: "#0d9488",
          table: "#475569",
          tableType: "glass" as const,
          floorRoughness: 0.4,
          floorMetalness: 0.1,
          promptText: "Clean geometric modern lines with balanced neutral tones.",
          budget: "₹8,80,000",
        };
    }
  };

  const theme = getStyleTheme(activeStyle);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[480px] bg-[#070b10] rounded-3xl flex items-center justify-center border border-slate-800">
        <div className="flex items-center gap-3 text-emerald-400 text-xs font-mono animate-pulse">
          <Wand2 className="w-4 h-4" />
          <span>INITIALIZING 3D SPATIAL DIGITAL TWIN...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[480px] lg:min-h-[560px] relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-[#060a0f] shadow-2xl shadow-emerald-950/40">
      
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [4.8, 3.8, 5.8], fov: 42 }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.8} />
        
        {/* Sun Directional Light */}
        <directionalLight
          position={[6, 9, 5]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        
        {/* Soft fill light */}
        <pointLight position={[-4, 4, -3]} intensity={0.6} color="#93c5fd" />

        {/* Room Floor Slab */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[8.5, 8.5]} />
          <meshStandardMaterial
            color={theme.floor}
            roughness={theme.floorRoughness}
            metalness={theme.floorMetalness}
          />
        </mesh>

        {/* Architectural Back Wall */}
        <mesh position={[0, 2.1, -4.0]} receiveShadow>
          <boxGeometry args={[8.5, 4.2, 0.15]} />
          <meshStandardMaterial color={theme.wall} roughness={0.85} />
        </mesh>

        {/* Architectural Left Wall */}
        <mesh position={[-4.0, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[8.5, 4.2, 0.15]} />
          <meshStandardMaterial color={theme.wall} roughness={0.85} />
        </mesh>

        {/* Architectural Grid Pattern */}
        <Grid
          cellSize={0.5}
          sectionSize={1.5}
          fadeDistance={18}
          infiniteGrid
          cellColor="#0d9488"
          sectionColor="#059669"
        />

        {/* 3D Living Room Furniture Group */}
        <Sofa3D color={theme.sofa} accentColor={theme.accent} />
        <CoffeeTable3D color={theme.table} topMaterial={theme.tableType} />
        <FloorLamp3D />
        <ModernPottedPlant />
        <WallArtCanvas accentColor={theme.accent} />

        {/* Smooth Auto-Orbit Controls */}
        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 - 0.08}
          minPolarAngle={Math.PI / 6}
          minDistance={4}
          maxDistance={12}
        />
      </Canvas>

      {/* ========================================================================================= */}
      {/* FLOATING PRODUCT HUD OVERLAYS (Communicates true spatial intelligence) */}
      {/* ========================================================================================= */}

      {/* 1. AI DESIGN COPILOT FLOATING BADGE (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 max-w-[260px] sm:max-w-[290px] p-3 rounded-2xl bg-[#090f17]/90 backdrop-blur-md border border-emerald-500/30 shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
            <span>AI Design Copilot</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono border border-emerald-800/60">
            LIVE
          </span>
        </div>
        <p className="text-[11px] text-slate-200 leading-snug italic font-light">
          "{theme.promptText}"
        </p>
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>✓ 3D Room geometry updated</span>
        </div>
      </div>

      {/* 2. SPATIAL CLEARANCE & ERGONOMICS AUDIT BADGE (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 max-w-[230px] p-3 rounded-2xl bg-[#090f17]/90 backdrop-blur-md border border-slate-700/60 shadow-xl hidden sm:block">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          <span>Spatial Audit</span>
          <span className="text-emerald-400">96% SCORE</span>
        </div>
        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Walkway
            </span>
            <span className="text-slate-400">82 cm (Pass)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Sofa Clearance
            </span>
            <span className="text-slate-400">48 cm (Pass)</span>
          </div>
          <div className="flex items-center justify-between text-amber-300">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Ambient Lux
            </span>
            <span className="text-amber-400">Warm 2700K</span>
          </div>
        </div>
      </div>

      {/* 3. LIVE ESTIMATED BUDGET BADGE (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-[#090f17]/90 backdrop-blur-md border border-slate-700/60 shadow-xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <IndianRupee className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
            Est. Project Budget
          </div>
          <div className="text-sm font-bold font-mono text-white flex items-center gap-1.5">
            <span>{theme.budget}</span>
            <span className="text-[10px] text-emerald-400 font-normal">84% of ₹10L</span>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE STYLE QUICK SWITCHER (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-[#090f17]/95 p-1.5 rounded-2xl border border-slate-700/70 backdrop-blur-md">
        {["Japandi", "Modern", "Scandinavian", "Luxury"].map((style) => (
          <button
            key={style}
            onClick={() => handleStyleSelect(style)}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              activeStyle.toLowerCase().includes(style.toLowerCase())
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* Subtle Drag to Orbit Guide */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="px-3 py-1 rounded-full bg-slate-950/70 text-[10px] font-mono text-slate-400 border border-slate-800 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-emerald-400" />
          <span>Drag to Orbit in 3D</span>
        </div>
      </div>

    </div>
  );
}
