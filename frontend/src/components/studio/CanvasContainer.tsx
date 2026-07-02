"use client";

import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF, PointerLockControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";

interface RoomObject {
  id: string;
  object_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation: number;
  scale: number;
  material: string;
}

interface CanvasContainerProps {
  objects: RoomObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject?: (id: string, updates: Partial<RoomObject>) => void;
  backgroundImageUrl?: string | null;
  roomWidth?: number;
  roomDepth?: number;
  activeFloor?: number;
  renderStyle?: "mockup" | "realistic";
}

// Custom simple 3D Partition Wall component
function PartitionWall3D({ material, scale, isSelected, onClick }: { material: string; scale: number; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#e2e8f0";
  const length = 2.0 * scale;
  return (
    <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} position={[0, 1.25, 0]}>
      <boxGeometry args={[length, 2.5, 0.15]} />
      <meshStandardMaterial color={color} roughness={0.7} />
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[length + 0.05, 2.55, 0.2]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </mesh>
  );
}

// Custom 3D Door Component
function Door3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#8b5a2b";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Door Frame */}
      <mesh position={[-0.45, 1.0, 0]}>
        <boxGeometry args={[0.06, 2.0, 0.15]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.45, 1.0, 0]}>
        <boxGeometry args={[0.06, 2.0, 0.15]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[0.96, 0.06, 0.15]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      {/* Door Panel */}
      <mesh position={[0.15, 1.0, -0.2]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.84, 1.94, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.48, 1.0, -0.2]} rotation={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.08]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[1.05, 2.1, 0.4]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Window Component
function Window3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#cbd5e1";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Frame */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.2, 1.0, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.1, 0.9, 0.04]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.4} roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Horizontal Grill Bar */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.1, 0.02, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Vertical Grill Bars */}
      <mesh position={[-0.3, 1.25, 0]}>
        <boxGeometry args={[0.02, 0.9, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 1.25, 0]}>
        <boxGeometry args={[0.02, 0.9, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[1.3, 1.1, 0.2]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Curtains Component
function Curtains3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#e2e8f0";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Rod */}
      <mesh position={[0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 1.4]} />
        <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Left Curtain */}
      <mesh position={[-0.45, 1.15, 0.04]}>
        <boxGeometry args={[0.25, 2.2, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Right Curtain */}
      <mesh position={[0.45, 1.15, 0.04]}>
        <boxGeometry args={[0.25, 2.2, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[1.5, 2.4, 0.2]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Blinds Component
function Blinds3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#f8fafc";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 2.05 - i * 0.2, 0.02]}>
          <boxGeometry args={[1.2, 0.05, 0.015]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
      {isSelected && (
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[1.4, 1.7, 0.15]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Balcony Component
function Balcony3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#78350f";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.01, 0.75]}>
        <boxGeometry args={[3.0, 0.02, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 1.48]}>
        <boxGeometry args={[3.0, 1.0, 0.04]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[-1.48, 0.5, 0.75]}>
        <boxGeometry args={[0.04, 1.0, 1.5]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[1.48, 0.5, 0.75]}>
        <boxGeometry args={[0.04, 1.0, 1.5]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.01, 0.75]}>
        <boxGeometry args={[0.04, 0.02, 1.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.5, 0.75]}>
          <boxGeometry args={[3.1, 1.1, 1.6]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D TV Component
function TV3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#334155";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.05, 0.05]}>
        <boxGeometry args={[1.2, 0.75, 0.04]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.59, 0.05]}>
        <boxGeometry args={[0.15, 0.2, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.51, 0.05]}>
        <boxGeometry args={[0.3, 0.02, 0.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.6, 1.5, 0.45]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D AC Component
function AC3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#f1f5f9";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Main AC Body */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.0, 0.28, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Vent Flap */}
      <mesh position={[0, 2.08, 0.05]}>
        <boxGeometry args={[0.9, 0.02, 0.18]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      {/* Subtle Brand/LED Dot */}
      <mesh position={[0.35, 2.15, 0.12]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[1.1, 0.35, 0.3]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Refrigerator Component
function Refrigerator3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#cbd5e1";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Main Fridge Body */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.75, 1.8, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Freezer Door Handle */}
      <mesh position={[-0.32, 1.25, 0.36]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>
      {/* Fridge Door Handle */}
      <mesh position={[-0.32, 0.5, 0.36]}>
        <boxGeometry args={[0.03, 0.6, 0.03]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>
      {/* Horizontal separator line */}
      <mesh position={[0, 0.95, 0.355]}>
        <boxGeometry args={[0.73, 0.01, 0.01]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.85, 1.9, 0.8]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Washing Machine Component
function WashingMachine3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#f8fafc";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Main Body */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.65, 0.85, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Circular Front Door Ring */}
      <mesh position={[0, 0.4, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Circular Front Glass */}
      <mesh position={[0, 0.4, 0.335]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.01, 32]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {/* Top Control Panel screen */}
      <mesh position={[0, 0.75, 0.31]}>
        <boxGeometry args={[0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.75, 0.95, 0.75]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Flower Pot Component
function FlowerPot3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const potColor = material.startsWith("#") ? material : "#e2e8f0";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.15, 0.1, 0.3, 12]} />
        <meshStandardMaterial color={potColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      <mesh position={[-0.08, 0.52, 0.06]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 0.48, -0.06]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.45, 0.8, 0.45]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Dining Table Component
function DiningTable3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const tableColor = material.startsWith("#") ? material : "#854d0e";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.7, 0.05, 0.95]} />
        <meshStandardMaterial color={tableColor} roughness={0.5} />
      </mesh>
      {[-0.75, 0.75].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.36, z]}>
            <cylinderGeometry args={[0.035, 0.035, 0.72]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))
      )}
      {/* 6 Chairs outline */}
      {[-0.5, 0, 0.5].map((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.38, z]}>
            <boxGeometry args={[0.3, 0.76, 0.3]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        ))
      )}
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[2.0, 0.95, 1.5]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Shutters Component
function Shutters3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const frameColor = material.startsWith("#") ? material : "#475569";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[1.9, 0.04, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.9, 0.03, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.42, 1.22, 0]}>
        <boxGeometry args={[0.85, 2.36, 0.025]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.42, 1.22, 0.03]}>
        <boxGeometry args={[0.85, 2.36, 0.025]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} transparent opacity={0.7} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.22, 0.01]}>
          <boxGeometry args={[1.95, 2.45, 0.18]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Scene background loader component
function SceneBackground({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return <primitive attach="background" object={texture} />;
}

// Custom simple 3D Sofa component made of blocks
function Sofa3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#c084fc"; // fallback or parsed
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Sofa Legs */}
      <mesh position={[-0.95, 0.075, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      <mesh position={[0.95, 0.075, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      <mesh position={[-0.95, 0.075, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      <mesh position={[0.95, 0.075, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      
      {/* Base Cushion */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.3, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back Support */}
      <mesh position={[0, 0.65, -0.35]}>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.05, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.05, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Highlight Box if selected */}
      {isSelected && (
        <mesh position={[0, 0.475, 0]}>
          <boxGeometry args={[2.3, 1.0, 1.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom simple 3D Coffee Table
function CoffeeTable3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#78350f";
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Tabletop */}
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.5, 0.2, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.5, 0.2, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.5, 0.2, 0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.5, 0.2, 0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[1.3, 0.5, 0.8]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom simple 3D Desk
function Desk3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#451a03";
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Desktop */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Left Panel */}
      <mesh position={[-0.65, 0.36, 0]}>
        <boxGeometry args={[0.05, 0.72, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Right Panel */}
      <mesh position={[0.65, 0.36, 0]}>
        <boxGeometry args={[0.05, 0.72, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Backboard */}
      <mesh position={[0, 0.48, -0.35]}>
        <boxGeometry args={[1.25, 0.48, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.39, 0]}>
          <boxGeometry args={[1.5, 0.82, 0.9]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom simple 3D Chair
function Chair3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#475569";
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.8, -0.275]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.25, 0.225, -0.25]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.25, 0.225, -0.25]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.25, 0.225, 0.25]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.25, 0.225, 0.25]}>
        <cylinderGeometry args={[0.025, 0.025, 0.45]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.475, 0]}>
          <boxGeometry args={[0.7, 0.95, 0.7]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom simple 3D Bed
function Bed3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#1e3a8a";
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Bed Base / Frame */}
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[1.62, 0.15, 2.02]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.6, 0.4, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.45, -1.05]}>
        <boxGeometry args={[1.7, 0.9, 0.1]} />
        <meshStandardMaterial color="#3e2723" roughness={0.6} />
      </mesh>
      {/* Pillow 1 */}
      <mesh position={[-0.4, 0.58, -0.7]}>
        <boxGeometry args={[0.5, 0.1, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      {/* Pillow 2 */}
      <mesh position={[0.4, 0.58, -0.7]}>
        <boxGeometry args={[0.5, 0.1, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.8, 1.1, 2.2]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom simple 3D Lamp
function Lamp3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#eab308";
  
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Base */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.4]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 0.3, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.775, 0]}>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Realistic 3D components loading local glTF assets
function RealisticChair3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/chair.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[1.2, 1.2, 1.2]} position={[0, 0, 0]} />
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.8, 1.0, 0.8]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RealisticSofa3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/sofa.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[1.0, 1.0, 1.0]} position={[0, 0, 0]} />
      {isSelected && (
        <mesh position={[0, 0.475, 0]}>
          <boxGeometry args={[2.3, 1.0, 1.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RealisticTable3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/table.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[3.0, 3.0, 3.0]} position={[0, 0.2, 0]} />
      {isSelected && (
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[1.3, 0.5, 0.8]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RealisticDesk3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/desk.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[1.0, 1.0, 1.0]} position={[0, 0, 0]} />
      {isSelected && (
        <mesh position={[0, 0.39, 0]}>
          <boxGeometry args={[1.5, 0.82, 0.9]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RealisticBed3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/bed.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[1.0, 1.0, 1.0]} position={[0, 0, 0]} />
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.8, 1.1, 2.2]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function RealisticLamp3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const { scene } = useGLTF("/models/lamp.glb");
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && material.startsWith("#")) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(material);
      }
    });
  }, [clonedScene, material]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <primitive object={clonedScene} scale={[0.5, 0.5, 0.5]} position={[0, 0.8, 0]} />
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.5, 1.8, 0.5]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom first-person controller for Walkthrough Mode
function WalkthroughControls({
  activeFloor,
  objects,
  roomWidth,
  roomDepth,
}: {
  activeFloor: number;
  objects: RoomObject[];
  roomWidth: number;
  roomDepth: number;
}) {
  const { camera } = useThree();
  const keys = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch ((e.key || "").toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = true;
          break;
        case "s":
        case "arrowdown":
          keys.current.backward = true;
          break;
        case "a":
        case "arrowleft":
          keys.current.left = true;
          break;
        case "d":
        case "arrowright":
          keys.current.right = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch ((e.key || "").toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = false;
          break;
        case "s":
        case "arrowdown":
          keys.current.backward = false;
          break;
        case "a":
        case "arrowleft":
          keys.current.left = false;
          break;
        case "d":
        case "arrowright":
          keys.current.right = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Initial eye-level camera placement
    camera.position.set(0, activeFloor * 3.0 + 1.6, 2.0);
    camera.lookAt(new THREE.Vector3(0, activeFloor * 3.0 + 1.6, -3.0));

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Reset camera to standard orbit view position
      camera.position.set(5, activeFloor * 3.0 + 4, 6);
    };
  }, [camera, activeFloor]);

  useFrame((state, delta) => {
    const frontVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // Get horizontal look direction
    camera.getWorldDirection(frontVector);
    frontVector.y = 0;
    frontVector.normalize();

    // Side vector points right
    sideVector.crossVectors(frontVector, up).normalize();

    // Move speed adjusted by frame delta
    const speed = 4.0 * delta; // 4 meters per second
    const move = new THREE.Vector3(0, 0, 0);

    if (keys.current.forward) move.addScaledVector(frontVector, speed);
    if (keys.current.backward) move.addScaledVector(frontVector, -speed);
    if (keys.current.left) move.addScaledVector(sideVector, speed); // cross is left
    if (keys.current.right) move.addScaledVector(sideVector, -speed);

    if (move.lengthSq() > 0) {
      const nextPos = camera.position.clone().add(move);

      // Boundary detection constraints
      const padding = 0.4;
      const xMin = -roomWidth / 2 + padding;
      const xMax = roomWidth / 2 - padding;
      const zMin = -roomDepth / 2 - 2.5 + padding;
      const zMax = roomDepth / 2 - 2.5 - padding;

      if (nextPos.x < xMin) nextPos.x = xMin;
      if (nextPos.x > xMax) nextPos.x = xMax;
      if (nextPos.z < zMin) nextPos.z = zMin;
      if (nextPos.z > zMax) nextPos.z = zMax;

      // Check collision with objects
      let collision = false;
      for (const obj of objects) {
        if (obj.object_type === "room") {
          let rWidth = 4;
          let rDepth = 4;
          const mat = obj.material || "";
          if (mat.includes(";")) {
            const parts = mat.split(";");
            for (const part of parts.slice(1)) {
              if (part.startsWith("width=")) {
                rWidth = parseFloat(part.split("=")[1]) || 4;
              } else if (part.startsWith("depth=")) {
                rDepth = parseFloat(part.split("=")[1]) || 4;
              }
            }
          }
          
          const dx = nextPos.x - obj.position_x;
          const dz = nextPos.z - obj.position_z;
          const cos = Math.cos(-obj.rotation);
          const sin = Math.sin(-obj.rotation);
          const lx = dx * cos - dz * sin;
          const lz = dx * sin + dz * cos;
          
          // Back Wall (-depth/2)
          if (Math.abs(lz - (-rDepth / 2)) < 0.35 && Math.abs(lx) < rWidth / 2 + 0.3) {
            collision = true;
            break;
          }
          // Left Wall (-width/2)
          if (Math.abs(lx - (-rWidth / 2)) < 0.35 && Math.abs(lz) < rDepth / 2 + 0.3) {
            collision = true;
            break;
          }
          // Right Wall (width/2)
          if (Math.abs(lx - (rWidth / 2)) < 0.35 && Math.abs(lz) < rDepth / 2 + 0.3) {
            collision = true;
            break;
          }
          // Front Wall Left Segment (z = rDepth/2, x <= -0.8)
          if (Math.abs(lz - (rDepth / 2)) < 0.35 && lx < -0.8 && lx > -rWidth / 2 - 0.3) {
            collision = true;
            break;
          }
          // Front Wall Right Segment (z = rDepth/2, x >= 0.8)
          if (Math.abs(lz - (rDepth / 2)) < 0.35 && lx > 0.8 && lx < rWidth / 2 + 0.3) {
            collision = true;
            break;
          }
          continue;
        }

        if (
          obj.object_type === "floor" ||
          obj.object_type === "wall" ||
          obj.object_type === "partition"
        ) {
          continue;
        }

        let objWidth = 1.0;
        let objDepth = 1.0;

        switch (obj.object_type) {
          case "sofa":
            objWidth = 2.3;
            objDepth = 1.1;
            break;
          case "bed":
            objWidth = 1.8;
            objDepth = 2.2;
            break;
          case "desk":
            objWidth = 1.5;
            objDepth = 0.9;
            break;
          case "coffee_table":
            objWidth = 1.3;
            objDepth = 0.8;
            break;
          case "chair":
            objWidth = 0.7;
            objDepth = 0.7;
            break;
          case "lamp":
            objWidth = 0.5;
            objDepth = 0.5;
            break;
          case "bookshelf":
            objWidth = 1.0;
            objDepth = 0.4;
            break;
          case "nightstand":
            objWidth = 0.5;
            objDepth = 0.5;
            break;
          case "wardrobe":
            objWidth = 1.5;
            objDepth = 0.6;
            break;
          case "armchair":
            objWidth = 1.05;
            objDepth = 0.9;
            break;
          case "sideboard":
            objWidth = 1.8;
            objDepth = 0.45;
            break;
          case "pouf":
            objWidth = 0.6;
            objDepth = 0.6;
            break;
          case "bench":
            objWidth = 1.2;
            objDepth = 0.4;
            break;
          case "stool":
            objWidth = 0.4;
            objDepth = 0.4;
            break;
          case "bar_stool":
            objWidth = 0.4;
            objDepth = 0.4;
            break;
          case "plant_box":
            objWidth = 1.0;
            objDepth = 0.3;
            break;
          case "console_table":
            objWidth = 1.4;
            objDepth = 0.35;
            break;
        }

        const dx = nextPos.x - obj.position_x;
        const dz = nextPos.z - obj.position_z;

        // Inverse transform by object rotation
        const cos = Math.cos(-obj.rotation);
        const sin = Math.sin(-obj.rotation);
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;

        const halfWidth = (objWidth * obj.scale) / 2 + 0.3;
        const halfDepth = (objDepth * obj.scale) / 2 + 0.3;

        if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        camera.position.copy(nextPos);
      }
    }

    camera.position.y = activeFloor * 3.0 + 1.6;
  });

  return null;
}

// Minimalist Bookshelf
function Bookshelf3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#854d0e";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.0, 1.8, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.35, 0.01]}>
        <boxGeometry args={[0.9, 0.05, 0.36]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.9, 0.01]}>
        <boxGeometry args={[0.9, 0.05, 0.36]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.45, 0.01]}>
        <boxGeometry args={[0.9, 0.05, 0.36]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.05, 1.85, 0.4]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Bedside Nightstand
function Nightstand3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#475569";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.3, 0.23]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.12, 0.23]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.55, 0.55, 0.5]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Minimal Wardrobe / Closet
function Wardrobe3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#334155";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[1.5, 2.2, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.1, 0.301]}>
        <boxGeometry args={[0.01, 2.2, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.1, 1.1, 0.31]}>
        <boxGeometry args={[0.03, 0.6, 0.02]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
      <mesh position={[0.1, 1.1, 0.31]}>
        <boxGeometry args={[0.03, 0.6, 0.02]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.55, 2.25, 0.65]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Flat Floor Rug
function Rug3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#cbd5e1";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh receiveShadow position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.9, 2.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Cozy Armchair
function Armchair3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#78350f";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.85, 0.3, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6, -0.325]}>
        <boxGeometry args={[0.85, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.425, 0.45, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.425, 0.45, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.05, 0.95, 0.9]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Minimal Sideboard
function Sideboard3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#475569";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.8, 0.8, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[-0.3, 0.4, 0.226]}>
        <boxGeometry args={[0.01, 0.8, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.3, 0.4, 0.226]}>
        <boxGeometry args={[0.01, 0.8, 0.002]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.85, 0.85, 0.5]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Cushion Pouf / Ottoman
function Pouf3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#64748b";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.42, 16]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Rounded Wall Mirror
function Mirror3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow position={[0, 1.5, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.02, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, -0.009]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.01, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.0} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[1.1, 1.1, 0.1]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Entryway Bench
function Bench3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#b45309";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.55, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.55, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[1.25, 0.45, 0.45]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Accent Stool
function Stool3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#78350f";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.225, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0.1, 0.225, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.225, -0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.23, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.4]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Kitchen Bar Stool
function BarStool3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#451a03";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.1, 0.375, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.75]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0.1, 0.375, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.75]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.375, -0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 0.75]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.4, 0.8, 0.4]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Concrete/Wood Planter Box
function PlantBox3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#475569";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.0, 0.5, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.95, 0.35, 0.26]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.05, 0.85, 0.35]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Minimal Console Table
function ConsoleTable3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const color = material.startsWith("#") ? material : "#78350f";
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.65, 0.4, -0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.65, 0.4, 0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0.65, 0.4, -0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0.65, 0.4, 0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.41, 0]}>
          <boxGeometry args={[1.45, 0.85, 0.4]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// Custom 3D Room Extension (Floor + 4 Walls with doorway cutout)
function Room3D({ material, isSelected, onClick }: { material: string; isSelected: boolean; onClick: () => void }) {
  const parseDimensions = (materialStr: string) => {
    let mat = materialStr || "";
    let width = 4;
    let depth = 4;
    if (mat.includes(";")) {
      const parts = mat.split(";");
      mat = parts[0];
      for (const part of parts.slice(1)) {
        if (part.startsWith("width=")) {
          width = parseFloat(part.split("=")[1]) || 4;
        } else if (part.startsWith("depth=")) {
          depth = parseFloat(part.split("=")[1]) || 4;
        }
      }
    }
    return { material: mat, width, depth };
  };

  const getFloorColor = (mat: string) => {
    switch (mat) {
      case "wood_light": return "#d7ccc8";
      case "wood_dark": return "#5c4033";
      case "marble": return "#f5f5f5";
      case "granite": return "#374151";
      default: return mat.startsWith("#") ? mat : "#d7ccc8";
    }
  };

  const { material: color, width, depth } = parseDimensions(material);
  const floorColor = getFloorColor(color);
  const wallColor = "#fafafa"; // clean light wall color

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Floor Slab */}
      <mesh receiveShadow position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 1.25, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, 2.5, 0.1]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Front Wall with doorway */}
      <group position={[0, 1.25, depth / 2]}>
        {/* Left segment */}
        <mesh position={[-width / 4 - 0.5, 0, 0]} receiveShadow>
          <boxGeometry args={[Math.max(0.1, width / 2 - 1.0), 2.5, 0.1]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {/* Right segment */}
        <mesh position={[width / 4 + 0.5, 0, 0]} receiveShadow>
          <boxGeometry args={[Math.max(0.1, width / 2 - 1.0), 2.5, 0.1]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {/* Top segment */}
        <mesh position={[0, 0.75, 0]} receiveShadow>
          <boxGeometry args={[2.0, 1.0, 0.1]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </group>

      {/* Left Wall */}
      <mesh position={[-width / 2, 1.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[depth, 2.5, 0.1]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[width / 2, 1.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[depth, 2.5, 0.1]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width + 0.15, depth + 0.15]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

interface TransformableObjectProps {
  obj: RoomObject;
  isSelected: boolean;
  isWalkthrough: boolean;
  transformMode: "translate" | "rotate";
  renderStyle: "mockup" | "realistic";
  onSelectObject: (id: string | null) => void;
  onUpdateObject?: (id: string, updates: Partial<RoomObject>) => void;
}

function TransformableObject({
  obj,
  isSelected,
  isWalkthrough,
  transformMode,
  renderStyle,
  onSelectObject,
  onUpdateObject
}: TransformableObjectProps) {
  const groupRef = useRef<any>(null);
  const clickHandler = () => onSelectObject(obj.id);

  const groupContent = (
    <>
      {obj.object_type === "sofa" && (
        renderStyle === "realistic" ? (
          <RealisticSofa3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <Sofa3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "coffee_table" && (
        renderStyle === "realistic" ? (
          <RealisticTable3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <CoffeeTable3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "desk" && (
        renderStyle === "realistic" ? (
          <RealisticDesk3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <Desk3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "chair" && (
        renderStyle === "realistic" ? (
          <RealisticChair3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <Chair3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "room" && (
        <Room3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "bed" && (
        renderStyle === "realistic" ? (
          <RealisticBed3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <Bed3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "lamp" && (
        renderStyle === "realistic" ? (
          <RealisticLamp3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        ) : (
          <Lamp3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
        )
      )}
      {obj.object_type === "partition" && (
        <PartitionWall3D material={obj.material} scale={obj.scale} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "door" && (
        <Door3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "window" && (
        <Window3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "curtains" && (
        <Curtains3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "blinds" && (
        <Blinds3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "balcony" && (
        <Balcony3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "tv" && (
        <TV3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "flower_pot" && (
        <FlowerPot3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "dining_table" && (
        <DiningTable3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "shutters" && (
        <Shutters3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "bookshelf" && (
        <Bookshelf3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "nightstand" && (
        <Nightstand3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "wardrobe" && (
        <Wardrobe3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "rug" && (
        <Rug3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "armchair" && (
        <Armchair3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "sideboard" && (
        <Sideboard3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "pouf" && (
        <Pouf3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "mirror" && (
        <Mirror3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "bench" && (
        <Bench3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "stool" && (
        <Stool3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "bar_stool" && (
        <BarStool3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "plant_box" && (
        <PlantBox3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
      {obj.object_type === "console_table" && (
        <ConsoleTable3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
      )}
    </>
  );

  if (isSelected && !isWalkthrough) {
    return (
      <TransformControls
        mode={transformMode}
        object={groupRef}
        onMouseUp={() => {
          if (groupRef.current && onUpdateObject) {
            onUpdateObject(obj.id, {
              position_x: groupRef.current.position.x,
              position_y: groupRef.current.position.y,
              position_z: groupRef.current.position.z,
              rotation: groupRef.current.rotation.y
            });
          }
        }}
      >
        <group
          ref={groupRef}
          position={[obj.position_x, obj.position_y, obj.position_z]}
          rotation={[0, obj.rotation, 0]}
          scale={[obj.scale, obj.scale, obj.scale]}
        >
          {groupContent}
        </group>
      </TransformControls>
    );
  }

  return (
    <group
      position={[obj.position_x, obj.position_y, obj.position_z]}
      rotation={[0, obj.rotation, 0]}
      scale={[obj.scale, obj.scale, obj.scale]}
    >
      {groupContent}
    </group>
  );
}

export default function CanvasContainer({
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  backgroundImageUrl = null,
  roomWidth = 10,
  roomDepth = 10,
  activeFloor = 0,
  renderStyle = "realistic",
}: CanvasContainerProps) {
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate">("translate");

  // Find floor and wall materials from list
  const floorObj = objects.find((o) => o.object_type === "floor");
  const wallObj = objects.find((o) => o.object_type === "wall");
  
  // Custom material colors for floor types
  const getFloorColor = (mat: string) => {
    switch (mat) {
      case "wood_light": return "#d7ccc8";
      case "wood_dark": return "#5c4033";
      case "marble": return "#f5f5f5";
      case "granite": return "#374151";
      default: return mat.startsWith("#") ? mat : "#d7ccc8";
    }
  };

  const getWallColor = (mat: string) => {
    return mat.startsWith("#") ? mat : "#e2e8f0";
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/80">
      <Canvas
        camera={{ position: [5, activeFloor * 3.0 + 4, 6], fov: 50 }}
        shadows
        onClick={() => onSelectObject(null)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10 + activeFloor * 3.0, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5 + activeFloor * 3.0, -5]} intensity={0.5} />

        {/* Load background room photo asynchronously */}
        {backgroundImageUrl && (
          <Suspense fallback={null}>
            <SceneBackground url={backgroundImageUrl} />
          </Suspense>
        )}

        {/* Render floor slabs and outer walls for all floors up to activeFloor */}
        {Array.from({ length: activeFloor + 1 }).map((_, floorIdx) => {
          const floorY = floorIdx * 3.0;
          return (
            <group key={floorIdx}>
              {/* Floor Slab */}
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, floorY, -2.5]} 
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  if (floorObj) onSelectObject(floorObj.id);
                }}
              >
                <planeGeometry args={[roomWidth, roomDepth]} />
                {backgroundImageUrl ? (
                  <shadowMaterial transparent opacity={0.4} />
                ) : (
                  <meshStandardMaterial 
                    color={floorObj ? getFloorColor(floorObj.material) : "#d7ccc8"} 
                    roughness={floorObj?.material === "marble" ? 0.1 : 0.8}
                    metalness={floorObj?.material === "marble" ? 0.3 : 0.0}
                  />
                )}
              </mesh>

              {/* Hide walls if background photo is loaded for realism */}
              {!backgroundImageUrl && (
                <>
                  {/* Back Wall */}
                  <mesh 
                    position={[0, floorY + 1.25, -roomDepth / 2 - 2.5]} 
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      if (wallObj) onSelectObject(wallObj.id);
                    }}
                  >
                    <boxGeometry args={[roomWidth, 2.5, 0.1]} />
                    <meshStandardMaterial color={wallObj ? getWallColor(wallObj.material) : "#e2e8f0"} />
                  </mesh>

                  {/* Left Wall */}
                  <mesh 
                    position={[-roomWidth / 2, floorY + 1.25, -2.5]} 
                    rotation={[0, Math.PI / 2, 0]}
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      if (wallObj) onSelectObject(wallObj.id);
                    }}
                  >
                    <boxGeometry args={[roomDepth, 2.5, 0.1]} />
                    <meshStandardMaterial color={wallObj ? getWallColor(wallObj.material) : "#e2e8f0"} />
                  </mesh>

                  {/* Right Wall */}
                  <mesh 
                    position={[roomWidth / 2, floorY + 1.25, -2.5]} 
                    rotation={[0, Math.PI / 2, 0]}
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      if (wallObj) onSelectObject(wallObj.id);
                    }}
                  >
                    <boxGeometry args={[roomDepth, 2.5, 0.1]} />
                    <meshStandardMaterial color={wallObj ? getWallColor(wallObj.material) : "#e2e8f0"} />
                  </mesh>
                </>
              )}
            </group>
          );
        })}

        {/* Grid helper for architectural feel - rendered at the active floor level */}
        {!backgroundImageUrl && (
          <Grid 
            position={[0, activeFloor * 3.0, -2.5]} 
            cellSize={0.5} 
            sectionSize={1.5} 
            fadeDistance={20} 
            infiniteGrid 
          />
        )}

        {/* Render Editable Furniture & Partition Objects */}
        {objects
          .filter((o) => o.object_type !== "floor" && o.object_type !== "wall")
          .map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const objFloor = Math.floor(obj.position_y / 3.0);
            
            // Clip objects above the active floor so we can edit inside
            if (objFloor > activeFloor) return null;
            
            return (
              <TransformableObject
                key={obj.id}
                obj={obj}
                isSelected={isSelected}
                isWalkthrough={isWalkthrough}
                transformMode={transformMode}
                renderStyle={renderStyle}
                onSelectObject={onSelectObject}
                onUpdateObject={onUpdateObject}
              />
            );
          })}

        {isWalkthrough ? (
          <>
            <PointerLockControls 
              makeDefault 
              onLock={() => setIsLocked(true)} 
              onUnlock={() => setIsLocked(false)} 
            />
            <WalkthroughControls 
              activeFloor={activeFloor} 
              objects={objects} 
              roomWidth={roomWidth} 
              roomDepth={roomDepth} 
            />
          </>
        ) : (
          <OrbitControls 
            makeDefault 
            target={[0, activeFloor * 3.0, -2.5]}
            maxPolarAngle={Math.PI / 2 - 0.05} 
            minDistance={2} 
            maxDistance={20} 
          />
        )}
      </Canvas>

      {/* Walkthrough Toggle Button */}
      <button 
        onClick={() => setIsWalkthrough(!isWalkthrough)}
        className="absolute top-4 right-4 z-30 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700/60 transition-colors backdrop-blur-md cursor-pointer select-none"
      >
        {isWalkthrough ? "🚶 Orbit Mode" : "🚶 Walkthrough Mode"}
      </button>

      {/* Floating 3D Transform Mode controls */}
      {selectedObjectId && !isWalkthrough && (
        <div className="absolute top-4 left-4 z-30 flex bg-slate-900/90 border border-slate-700/60 p-1 rounded-lg shadow-xl gap-1 backdrop-blur-md">
          <button
            onClick={() => setTransformMode("translate")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              transformMode === "translate"
                ? "bg-indigo-650 text-white shadow-sm font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ↔️ Move
          </button>
          <button
            onClick={() => setTransformMode("rotate")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              transformMode === "rotate"
                ? "bg-indigo-650 text-white shadow-sm font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔄 Rotate
          </button>
        </div>
      )}

      {/* Floating Instructions */}
      {!isWalkthrough && (
        <div className="absolute bottom-4 left-4 glass-card px-4 py-2 rounded-lg text-xs text-slate-400 select-none pointer-events-none z-10">
          🖱️ Left-Click + Drag: Rotate | 🖱️ Right-Click + Drag: Pan | 🖱️ Click object: Select to edit
        </div>
      )}

      {/* Walkthrough Locked Instructions */}
      {isWalkthrough && isLocked && (
        <div className="absolute bottom-4 left-4 glass-card px-4 py-2 rounded-lg text-xs text-slate-400 select-none pointer-events-none z-10">
          ⌨️ WASD / Arrows: Move | 🖱️ Mouse: Look | <span className="text-white font-semibold">Esc</span>: Unlock Cursor
        </div>
      )}

      {/* Walkthrough Instructions Modal */}
      {isWalkthrough && !isLocked && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
          <div className="bg-slate-900/95 border border-slate-700/60 p-6 rounded-2xl max-w-sm shadow-2xl backdrop-blur-md">
            <h3 className="text-white font-bold text-lg mb-2">Walkthrough Mode</h3>
            <p className="text-slate-300 text-xs mb-6">
              Click on the screen to lock your cursor and walk around. Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-slate-200">Esc</kbd> to unlock the cursor.
            </p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-left text-slate-400 text-xs border-t border-slate-800 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">W / ↑</span> Move Forward
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">S / ↓</span> Move Backward
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">A / ←</span> Move Left
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">D / →</span> Move Right
              </div>
            </div>
            <button
              onClick={() => setIsWalkthrough(false)}
              className="mt-6 w-full px-4 py-2 bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 text-white rounded-lg text-xs font-semibold border border-rose-500/40 transition-colors cursor-pointer"
            >
              Exit Walkthrough
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
