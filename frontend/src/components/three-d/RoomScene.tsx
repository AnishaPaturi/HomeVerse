"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import Lighting from "./Lighting";
import CameraControls, { ViewAngle } from "./CameraControls";
import FurnitureObject, { FurnitureObjectProps } from "./FurnitureObject";

interface RoomDimensions {
  width: number; // in meters (e.g. 5)
  length: number; // in meters (e.g. 6)
  height?: number; // in meters (e.g. 3)
}

interface RoomSceneProps {
  dimensions?: RoomDimensions;
  wallColor?: string;
  floorColor?: string;
  styleName?: string;
  furniture?: FurnitureObjectProps[];
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  viewAngle?: ViewAngle;
  lightingPreset?: "warm" | "neutral" | "cool" | "luxury" | "studio";
}

export const RoomScene: React.FC<RoomSceneProps> = ({
  dimensions = { width: 5, length: 6, height: 3 },
  wallColor = "#f8fafc",
  floorColor = "#d4b896",
  furniture = [
    { id: "sofa-1", name: "3-Seater Sofa", type: "sofa", position: [0, 0, 1], price: 42000 },
    { id: "table-1", name: "Coffee Table", type: "table", position: [0, 0, -0.5], price: 14500 },
    { id: "lamp-1", name: "Floor Lamp", type: "lamp", position: [2, 0, -1.8], price: 6800 },
  ],
  selectedObjectId = null,
  onSelectObject,
  viewAngle = "perspective",
  lightingPreset = "warm",
}) => {
  const w = dimensions.width;
  const l = dimensions.length;
  const h = dimensions.height || 3;

  return (
    <div className="w-full h-full relative select-none bg-[#090d14] rounded-2xl overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [5.5, 4.5, 6], fov: 45 }}
        onPointerMissed={() => onSelectObject && onSelectObject(null)}
      >
        <Suspense fallback={null}>
          <Lighting preset={lightingPreset} />
          <CameraControls viewAngle={viewAngle} />

          {/* Architectural Room Shell */}
          <group name="room-architecture">
            {/* Floor */}
            <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[w, l]} />
              <meshStandardMaterial color={floorColor} roughness={0.4} metalness={0.05} />
            </mesh>

            {/* Back Wall */}
            <mesh position={[0, h / 2, -l / 2]} receiveShadow>
              <boxGeometry args={[w, h, 0.15]} />
              <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>

            {/* Left Wall */}
            <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
              <boxGeometry args={[l, h, 0.15]} />
              <meshStandardMaterial color={wallColor} roughness={0.8} />
            </mesh>

            {/* Subtle Baseboard trims */}
            <mesh position={[0, 0.06, -l / 2 + 0.05]}>
              <boxGeometry args={[w, 0.12, 0.04]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>
            <mesh position={[-w / 2 + 0.05, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[l, 0.12, 0.04]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>

            {/* Ground Grid for Floor Plan Scale Reference */}
            <Grid
              position={[0, 0.001, 0]}
              args={[w, l]}
              cellSize={0.5}
              cellThickness={0.6}
              cellColor="#38bdf8"
              sectionSize={1}
              sectionThickness={1.2}
              sectionColor="#10b981"
              fadeDistance={18}
              fadeStrength={1.5}
            />
          </group>

          {/* Furniture Entities */}
          <group name="furniture-objects">
            {furniture.map((item) => (
              <FurnitureObject
                key={item.id}
                {...item}
                isSelected={selectedObjectId === item.id}
                onSelect={(id) => onSelectObject && onSelectObject(id)}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default RoomScene;
