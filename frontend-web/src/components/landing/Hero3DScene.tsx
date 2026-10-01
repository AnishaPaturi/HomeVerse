"use client";

// Silence internal Three.js deprecation warnings
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
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  Eye, 
  Sun, 
  Sunset, 
  Moon, 
  Grid3X3, 
  Layers, 
  Maximize2, 
  Minimize2,
  RotateCw, 
  RotateCcw,
  Plus, 
  Sliders, 
  Info,
  Wand2,
  MousePointer
} from "lucide-react";

interface Hero3DSceneProps {
  styleName?: string;
  onStyleChange?: (style: string) => void;
}

// 3D Furniture Procedural Meshes
function Sofa3D({ 
  color, 
  accentColor, 
  wireframe = false,
  onClick,
  isSelected = false
}: { 
  color: string; 
  accentColor: string; 
  wireframe?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <group 
      position={[-0.2, 0, -0.6]} 
      rotation={[0, 0, 0]} 
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      {/* Base Cushion */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.3, 0.95]} />
        <meshStandardMaterial 
          color={isSelected ? "#10b981" : color} 
          roughness={0.7} 
          metalness={0.05} 
          wireframe={wireframe} 
        />
      </mesh>
      {/* Back Support */}
      <mesh position={[0, 0.75, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.7, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.75} wireframe={wireframe} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.15, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.55, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.75} wireframe={wireframe} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.15, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.55, 0.95]} />
        <meshStandardMaterial color={color} roughness={0.75} wireframe={wireframe} />
      </mesh>
      {/* Throw Pillows */}
      <mesh position={[-0.7, 0.5, -0.22]} rotation={[0.2, 0.1, 0]} castShadow>
        <boxGeometry args={[0.38, 0.38, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.7, 0.5, -0.22]} rotation={[0.2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.38, 0.38, 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} wireframe={wireframe} />
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
          <meshStandardMaterial color="#451a03" roughness={0.4} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable3D({ 
  color, 
  topMaterial, 
  wireframe = false,
  onClick,
  isSelected = false
}: { 
  color: string; 
  topMaterial: "glass" | "wood" | "marble"; 
  wireframe?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <group 
      position={[-0.2, 0, 0.7]} 
      rotation={[0, 0, 0]} 
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      {/* Tabletop */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.75]} />
        {topMaterial === "glass" ? (
          <meshStandardMaterial 
            color={isSelected ? "#10b981" : "#94a3b8"} 
            roughness={0.1} 
            metalness={0.9} 
            transparent 
            opacity={0.6} 
            wireframe={wireframe} 
          />
        ) : topMaterial === "marble" ? (
          <meshStandardMaterial 
            color={isSelected ? "#10b981" : "#f8fafc"} 
            roughness={0.15} 
            metalness={0.2} 
            wireframe={wireframe} 
          />
        ) : (
          <meshStandardMaterial 
            color={isSelected ? "#10b981" : color} 
            roughness={0.5} 
            metalness={0.1} 
            wireframe={wireframe} 
          />
        )}
      </mesh>
      {/* Shelf */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.1, 0.03, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} wireframe={wireframe} />
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
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
}

function FloorLamp3D({ wireframe = false }: { wireframe?: boolean }) {
  return (
    <group position={[-0.2, 0, -2.5]}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.2} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 2.2]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.32, 0.45, 32, 1, true]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} side={THREE.DoubleSide} wireframe={wireframe} />
      </mesh>
      <pointLight position={[0, 2.05, 0]} intensity={4.5} color="#fde047" distance={8} />
    </group>
  );
}

function ModernPottedPlant({ wireframe = false }: { wireframe?: boolean }) {
  return (
    <group position={[1.4, 0, 0.6]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.7, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.3, 4]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} wireframe={wireframe} />
      </mesh>
    </group>
  );
}

function WallArtCanvas({ accentColor, wireframe = false }: { accentColor: string; wireframe?: boolean }) {
  return (
    <group position={[1.8, 2.3, -3.92]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.4, 0.05]} />
        <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.7} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.03]} receiveShadow>
        <planeGeometry args={[2.28, 1.28]} />
        <meshStandardMaterial 
          color={accentColor} 
          roughness={0.3} 
          emissive={accentColor} 
          emissiveIntensity={0.35} 
          wireframe={wireframe} 
        />
      </mesh>
    </group>
  );
}

export default function Hero3DScene({ styleName = "Industrial", onStyleChange }: Hero3DSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [activeStyle, setActiveStyle] = useState(styleName);
  
  // Playground Viewport Controls (Point 1 & Point 6)
  const [cameraMode, setCameraMode] = useState<"orbit" | "topdown" | "eye">("orbit");
  const [lightingPreset, setLightingPreset] = useState<"day" | "sunset" | "night">("night");
  const [showGrid, setShowGrid] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const resetCamera = () => {
    setCameraMode("orbit");
    setCameraKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Furniture items visibility in playground
  const [visibleItems, setVisibleItems] = useState({
    sofa: true,
    table: true,
    lamp: true,
    plant: true,
    art: true,
  });

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
          promptText: "Japandi: Organic oak slats, low-profile bouclé & wabi-sabi lighting.",
          budget: "₹8,45,000",
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
          promptText: "Scandinavian: Bright chalk walls, pale birch wood & cozy wool textures.",
          budget: "₹7,90,000",
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
          promptText: "Modern Luxury: Bookmatched Statuario marble, velvet & brushed gold brass.",
          budget: "₹14,80,000",
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
          promptText: "Industrial: Heritage red brick, warehouse screed & cognac saddle leather.",
          budget: "₹9,25,000",
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
          promptText: "Contemporary: Sculptural curved couch & honed travertine stone.",
          budget: "₹11,40,000",
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
          promptText: "Modern: Structured geometric dark smoked walnut with crisp lighting.",
          budget: "₹8,80,000",
        };
    }
  };

  const theme = getStyleTheme(activeStyle);

  // Camera coordinates based on mode
  const getCameraConfig = () => {
    switch (cameraMode) {
      case "topdown":
        return { 
          position: [0.01, 15.5, 0.01] as [number, number, number], 
          target: [0, 0, 0] as [number, number, number], 
          fov: 46 
        };
      case "eye":
        return { 
          position: [0, 1.5, 4.0] as [number, number, number], 
          target: [-0.2, 1.2, -0.6] as [number, number, number], 
          fov: 55 
        };
      case "orbit":
      default:
        return { 
          position: [7.2, 5.6, 7.8] as [number, number, number], 
          target: [0, 1.3, 0] as [number, number, number], 
          fov: 45 
        };
    }
  };

  const cameraConfig = getCameraConfig();

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[540px] bg-[#070b10] rounded-3xl flex items-center justify-center border border-white/10">
        <div className="flex items-center gap-3 text-emerald-400 text-xs font-mono animate-pulse">
          <Wand2 className="w-4 h-4" />
          <span>LOADING 3D SPATIAL PLAYGROUND...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={
        isExpanded
          ? "fixed inset-0 z-50 p-4 sm:p-8 bg-[#060a0f]/98 backdrop-blur-2xl flex flex-col justify-between overflow-hidden"
          : "w-full h-full min-h-[560px] lg:min-h-[660px] relative rounded-3xl overflow-hidden border border-white/15 bg-[#060a0f] shadow-2xl shadow-emerald-950/40 flex flex-col justify-between transition-all"
      }
    >
      
      {/* ========================================================================================= */}
      {/* 1. TOP VIEWPORT PLAYGROUND TOOLBAR */}
      {/* ========================================================================================= */}
      <div className="relative z-30 p-2.5 sm:p-3 bg-[#080d14]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs font-mono text-slate-300">
        {/* Left: Camera Angle Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => {
              setCameraMode("orbit");
              setAutoRotate(true);
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] transition-all cursor-pointer shrink-0 ${
              cameraMode === "orbit"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Orbit</span>
          </button>

          <button
            onClick={() => {
              setCameraMode("topdown");
              setAutoRotate(false);
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] transition-all cursor-pointer shrink-0 ${
              cameraMode === "topdown"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>2D CAD</span>
          </button>

          <button
            onClick={() => {
              setCameraMode("eye");
              setAutoRotate(false);
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] transition-all cursor-pointer shrink-0 ${
              cameraMode === "eye"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🚶 Walk</span>
          </button>
        </div>

        {/* Center: Lighting Environment Presets */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setLightingPreset("day")}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              lightingPreset === "day"
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                : "text-slate-400 hover:text-white"
            }`}
            title="Daylight (5000K)"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset("sunset")}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              lightingPreset === "sunset"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                : "text-slate-400 hover:text-white"
            }`}
            title="Golden Hour Sunset (3000K)"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset("night")}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              lightingPreset === "night"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
            title="Night Architectural Warm Mood"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Toggles (Grid, Wireframe, Rotate, Fit View, Expand) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded-xl border text-[11px] transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              showGrid ? "bg-white/10 border-white/20 text-white" : "border-transparent text-slate-500"
            }`}
            title="Toggle Metric Grid"
          >
            <Grid3X3 className="w-3 h-3" />
            <span className="hidden sm:inline text-[10px]">Grid</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-1 rounded-xl border text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              wireframeMode ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-transparent text-slate-500"
            }`}
            title="Toggle Wireframe CAD"
          >
            <span>Wireframe</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              autoRotate ? "text-emerald-400 border-emerald-500/30" : "text-slate-500 border-transparent"
            }`}
            title="Auto-Rotate Camera"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          <button
            onClick={resetCamera}
            className="px-2.5 py-1 rounded-xl border border-white/10 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Reset to Complete Room View"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Fit View</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isExpanded
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "text-slate-400 hover:text-white border-white/10 hover:bg-white/10"
            }`}
            title={isExpanded ? "Exit Fullscreen (ESC)" : "Expand to Fullscreen View"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 2. 3D WEBGL INTERACTIVE CANVAS */}
      {/* ========================================================================================= */}
      <div className="relative flex-1 w-full h-full min-h-[380px]">
        <Canvas
          key={`${cameraMode}-${lightingPreset}-${cameraKey}`}
          camera={{ position: cameraConfig.position, fov: cameraConfig.fov }}
          shadows={{ type: THREE.PCFSoftShadowMap }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Dynamic Lighting Presets */}
          {lightingPreset === "day" && (
            <>
              <ambientLight intensity={0.9} />
              <directionalLight position={[6, 9, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
              <pointLight position={[-4, 4, -3]} intensity={0.5} color="#93c5fd" />
            </>
          )}

          {lightingPreset === "sunset" && (
            <>
              <ambientLight intensity={0.6} color="#fed7aa" />
              <directionalLight position={[8, 4, 3]} intensity={2.0} color="#fb923c" castShadow />
              <pointLight position={[-2, 3, -1]} intensity={0.8} color="#f97316" />
            </>
          )}

          {lightingPreset === "night" && (
            <>
              <ambientLight intensity={0.45} color="#1e1b4b" />
              <directionalLight position={[5, 8, 6]} intensity={0.35} color="#94a3b8" />
              <pointLight position={[-0.2, 2.2, -2.5]} intensity={4.5} color="#fde047" distance={8} />
              <pointLight position={[1.8, 2.3, -3.2]} intensity={2.0} color="#ea580c" distance={6} />
              <pointLight position={[0, 3.2, 0]} intensity={1.2} color="#fef08a" distance={10} />
            </>
          )}

          {cameraMode === "eye" && (
            <pointLight position={[0, 1.8, 3.2]} intensity={1.8} color="#fed7aa" distance={8} />
          )}

          {/* Floor Slab with PBR material */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[8.5, 8.5]} />
            <meshStandardMaterial
              color={theme.floor}
              roughness={theme.floorRoughness}
              metalness={theme.floorMetalness}
              wireframe={wireframeMode}
            />
          </mesh>

          {/* Back Wall */}
          <mesh position={[0, 2.1, -4.0]} receiveShadow>
            <boxGeometry args={[8.5, 4.2, 0.15]} />
            <meshStandardMaterial color={theme.wall} roughness={0.85} wireframe={wireframeMode} />
          </mesh>

          {/* Left Wall */}
          <mesh position={[-4.0, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <boxGeometry args={[8.5, 4.2, 0.15]} />
            <meshStandardMaterial color={theme.wall} roughness={0.85} wireframe={wireframeMode} />
          </mesh>

          {/* Metric Ground Grid */}
          {showGrid && (
            <Grid
              cellSize={0.5}
              sectionSize={1.5}
              fadeDistance={18}
              infiniteGrid
              cellColor="#0d9488"
              sectionColor="#059669"
            />
          )}

          {/* Procedural 3D Furniture Objects with Interactive Selection */}
          {visibleItems.sofa && (
            <Sofa3D 
              color={theme.sofa} 
              accentColor={theme.accent} 
              wireframe={wireframeMode}
              isSelected={selectedItem === "sofa"}
              onClick={() => setSelectedItem("sofa")}
            />
          )}

          {visibleItems.table && (
            <CoffeeTable3D 
              color={theme.table} 
              topMaterial={theme.tableType} 
              wireframe={wireframeMode}
              isSelected={selectedItem === "table"}
              onClick={() => setSelectedItem("table")}
            />
          )}

          {visibleItems.lamp && <FloorLamp3D wireframe={wireframeMode} />}
          {visibleItems.plant && <ModernPottedPlant wireframe={wireframeMode} />}
          {visibleItems.art && <WallArtCanvas accentColor={theme.accent} wireframe={wireframeMode} />}

          {/* Orbit Controls */}
          <OrbitControls
            makeDefault
            target={cameraConfig.target}
            autoRotate={autoRotate}
            autoRotateSpeed={0.6}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={Math.PI / 16}
            minDistance={2.5}
            maxDistance={28}
          />
        </Canvas>

        {/* AI Copilot Compact Status Pill (Top-Left, non-overlapping) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-[11px] font-mono text-emerald-400 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white uppercase tracking-wider">{activeStyle}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[10px] text-emerald-400/90 font-medium">60 FPS WebGL</span>
        </div>

        {/* Click Furniture Hint Pill (Top-Right) */}
        {!selectedItem && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-slate-400 shadow-md">
            <MousePointer className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Click furniture to inspect</span>
          </div>
        )}

        {/* Interactive Floating Item Inspector Card (Bottom-Right, docked and non-overlapping) */}
        {selectedItem && (
          <div className="absolute bottom-3 right-3 z-20 w-64 bg-slate-950/90 backdrop-blur-xl p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3 h-3" />
                <span>Object Specs</span>
              </span>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer transition-colors"
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>

            {selectedItem === "sofa" ? (
              <div className="space-y-1 text-xs font-mono">
                <div className="font-bold text-white text-xs">3-Seater Platform Sofa</div>
                <div className="text-[11px] text-slate-400">2.2m × 0.95m × 0.75m · Bouclé</div>
                <div className="text-emerald-400 font-bold text-xs">₹ 48,500 (Verified Vendor)</div>
                <div className="text-[10px] text-slate-400">Clearance: 82cm to Table ✓</div>
              </div>
            ) : (
              <div className="space-y-1 text-xs font-mono">
                <div className="font-bold text-white text-xs">Architectural Coffee Table</div>
                <div className="text-[11px] text-slate-400">1.3m × 0.75m × 0.44m · {theme.tableType}</div>
                <div className="text-emerald-400 font-bold text-xs">₹ 18,200 (Teak / Glass)</div>
                <div className="text-[10px] text-slate-400">Anchor Placed [X: 0.5, Z: 0.9] ✓</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Architectural AI Prompt Tagline Strip */}
      <div className="relative z-20 px-3.5 py-1.5 bg-[#05080c]/90 backdrop-blur-sm border-t border-white/[0.08] flex items-center gap-2 text-xs text-slate-300 font-mono overflow-hidden shrink-0">
        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-semibold shrink-0">
          AI Spec
        </span>
        <span className="text-[11px] text-slate-300 truncate font-light">
          "{theme.promptText}"
        </span>
      </div>

      {/* ========================================================================================= */}
      {/* 3. BOTTOM HUD BAR: LIVE BUDGET GAUGE & STYLE SWITCHER */}
      {/* ========================================================================================= */}
      <div className="relative z-30 p-2.5 sm:p-3 bg-[#080d14]/95 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        {/* Live Budget Counter */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
            ₹
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none">
              Live Room Budget
            </div>
            <div className="text-xs font-bold font-mono text-white flex items-center gap-2 mt-0.5">
              <span>{theme.budget}</span>
              <span className="text-[10px] text-emerald-400 font-normal">Within ₹10L ✓</span>
            </div>
          </div>
        </div>

        {/* Interactive Style Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full no-scrollbar shrink-0">
          {["Japandi", "Modern", "Scandinavian", "Luxury", "Industrial"].map((style) => (
            <button
              key={style}
              onClick={() => handleStyleSelect(style)}
              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                activeStyle.toLowerCase().includes(style.toLowerCase())
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
