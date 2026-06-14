"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

interface Hero3DSceneProps {
  styleName: string;
}

// 3D furniture models from CanvasContainer
function Sofa3D({ color }: { color: string }) {
  return (
    <group>
      {/* Base Cushion */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.3, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back Support */}
      <mesh position={[0, 0.7, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.05, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.05, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function CoffeeTable3D({ color }: { color: string }) {
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.5, 0.2, -0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.5, 0.2, -0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.5, 0.2, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.5, 0.2, 0.25]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function Desk3D({ color }: { color: string }) {
  return (
    <group>
      {/* Desktop */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Left Panel */}
      <mesh position={[-0.65, 0.37, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.74, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Right Panel */}
      <mesh position={[0.65, 0.37, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.74, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Backboard */}
      <mesh position={[0, 0.5, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.4, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Hero3DScene({ styleName }: Hero3DSceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map styles to specific colors
  const getColors = (style: string) => {
    switch (style.toLowerCase()) {
      case "scandinavian":
        return {
          wall: "#f8fafc",
          floor: "#cbd5e1",
          sofa: "#e2e8f0",
          table: "#fafaf9",
          desk: "#f5f5dc",
        };
      case "japandi":
        return {
          wall: "#fafaf9",
          floor: "#e7e5e4",
          sofa: "#b45309",
          table: "#78350f",
          desk: "#d7ccc8",
        };
      case "minimalist":
        return {
          wall: "#ffffff",
          floor: "#cbd5e1",
          sofa: "#f1f5f9",
          table: "#64748b",
          desk: "#334155",
        };
      case "luxury":
        return {
          wall: "#1e1b4b",
          floor: "#e2e8f0",
          sofa: "#0d9488",
          table: "#d97706",
          desk: "#78350f",
        };
      case "modern":
      default:
        return {
          wall: "#334155",
          floor: "#475569",
          sofa: "#1e293b",
          table: "#78350f",
          desk: "#451a03",
        };
    }
  };

  const colors = getColors(styleName);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] bg-slate-950/40 rounded-2xl flex items-center justify-center border border-slate-800">
        <div className="text-slate-500 text-xs animate-pulse font-mono">
          Loading 3D Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[350px] relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
      <Canvas
        camera={{ position: [4.5, 3.5, 5.5], fov: 45 }}
        shadows
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial
            color={colors.floor}
            roughness={styleName.toLowerCase() === "luxury" ? 0.15 : 0.8}
            metalness={styleName.toLowerCase() === "luxury" ? 0.2 : 0.0}
          />
        </mesh>

        {/* Back Wall */}
        <mesh position={[0, 2, -4]} receiveShadow>
          <boxGeometry args={[8, 4, 0.1]} />
          <meshStandardMaterial color={colors.wall} roughness={0.9} />
        </mesh>

        {/* Left Wall */}
        <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[8, 4, 0.1]} />
          <meshStandardMaterial color={colors.wall} roughness={0.9} />
        </mesh>

        {/* Grid helper for architectural feel */}
        <Grid cellSize={0.5} sectionSize={1.5} fadeDistance={15} infiniteGrid />

        {/* 3D Furniture Elements */}
        {/* Sofa */}
        <group position={[-1.2, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <Sofa3D color={colors.sofa} />
        </group>

        {/* Coffee Table */}
        <group position={[0.4, 0, 0.8]} rotation={[0, -Math.PI / 6, 0]}>
          <CoffeeTable3D color={colors.table} />
        </group>

        {/* Desk */}
        <group position={[1.5, 0, -1.8]} rotation={[0, -Math.PI / 4, 0]}>
          <Desk3D color={colors.desk} />
        </group>

        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={0.6}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={12}
        />
      </Canvas>

      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
          Interactive Viewport
        </span>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 select-none pointer-events-none font-mono">
        Drag to Orbit
      </div>
    </div>
  );
}
