"use client";

import React, { useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface FurnitureObjectProps {
  id: string;
  name: string;
  type: string; // "sofa" | "table" | "chair" | "bed" | "desk" | "lamp" | string
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  price?: number;
}

export const FurnitureObject: React.FC<FurnitureObjectProps> = ({
  id,
  name,
  type,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color = "#334155",
  isSelected = false,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Check if GLTF model is available
  const knownTypes = ["sofa", "table", "chair", "bed", "desk", "lamp"];
  const modelType = knownTypes.includes(type.toLowerCase()) ? type.toLowerCase() : "chair";
  const modelPath = `/models/furniture/${modelType}.glb`;

  let gltf: any = null;
  try {
    gltf = useGLTF(modelPath);
  } catch (_) {
    gltf = null;
  }

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) onSelect(id);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Visual GLTF Model */}
      {gltf && gltf.scene ? (
        <primitive object={gltf.scene.clone()} castShadow receiveShadow />
      ) : (
        /* Procedural Fallback Mesh */
        <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[1, 0.8, 1]} />
          <meshStandardMaterial
            color={hovered ? "#10b981" : color}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Selection Bounding Box & Halo */}
      {(isSelected || hovered) && (
        <group>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.2, 0.95, 1.2]} />
            <meshBasicMaterial
              color={isSelected ? "#10b981" : "#38bdf8"}
              wireframe
              transparent
              opacity={isSelected ? 0.7 : 0.3}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default FurnitureObject;
