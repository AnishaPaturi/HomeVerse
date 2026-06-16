"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
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
  backgroundImageUrl?: string | null;
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
      {/* Base Cushion */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2, 0.3, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back Support */}
      <mesh position={[0, 0.7, -0.4]}>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-1.05, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[1.05, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Highlight Box if selected */}
      {isSelected && (
        <mesh position={[0, 0.5, 0]}>
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
      <mesh position={[0, 0.4, 0]}>
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
        <mesh position={[0, 0.22, 0]}>
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
      <mesh position={[-0.65, 0.37, 0]}>
        <boxGeometry args={[0.05, 0.74, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Right Panel */}
      <mesh position={[0.65, 0.37, 0]}>
        <boxGeometry args={[0.05, 0.74, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Backboard */}
      <mesh position={[0, 0.5, -0.35]}>
        <boxGeometry args={[1.25, 0.4, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {isSelected && (
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.5, 0.82, 0.9]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export default function CanvasContainer({
  objects,
  selectedObjectId,
  onSelectObject,
  backgroundImageUrl = null,
}: CanvasContainerProps) {
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
        camera={{ position: [5, 4, 6], fov: 50 }}
        shadows
        onClick={() => onSelectObject(null)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Load background room photo asynchronously */}
        {backgroundImageUrl && (
          <Suspense fallback={null}>
            <SceneBackground url={backgroundImageUrl} />
          </Suspense>
        )}

        {/* Floor */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, 0]} 
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            if (floorObj) onSelectObject(floorObj.id);
          }}
        >
          <planeGeometry args={[10, 10]} />
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

        {/* Hide walls and gridline helper if background photo is loaded for realism */}
        {!backgroundImageUrl && (
          <>
            {/* Back Wall */}
            <mesh 
              position={[0, 2.5, -5]} 
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (wallObj) onSelectObject(wallObj.id);
              }}
            >
              <boxGeometry args={[10, 5, 0.1]} />
              <meshStandardMaterial color={wallObj ? getWallColor(wallObj.material) : "#e2e8f0"} />
            </mesh>

            {/* Left Wall */}
            <mesh 
              position={[-5, 2.5, 0]} 
              rotation={[0, Math.PI / 2, 0]}
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (wallObj) onSelectObject(wallObj.id);
              }}
            >
              <boxGeometry args={[10, 5, 0.1]} />
              <meshStandardMaterial color={wallObj ? getWallColor(wallObj.material) : "#e2e8f0"} />
            </mesh>

            {/* Grid helper for architectural feel */}
            <Grid cellSize={0.5} sectionSize={1.5} fadeDistance={20} infiniteGrid />
          </>
        )}

        {/* Render Editable Furniture Objects */}
        {objects
          .filter((o) => o.object_type !== "floor" && o.object_type !== "wall")
          .map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const clickHandler = () => onSelectObject(obj.id);
            
            return (
              <group
                key={obj.id}
                position={[obj.position_x, obj.position_y, obj.position_z]}
                rotation={[0, obj.rotation, 0]}
                scale={[obj.scale, obj.scale, obj.scale]}
              >
                {obj.object_type === "sofa" && (
                  <Sofa3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
                )}
                {obj.object_type === "coffee_table" && (
                  <CoffeeTable3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
                )}
                {obj.object_type === "desk" && (
                  <Desk3D material={obj.material} isSelected={isSelected} onClick={clickHandler} />
                )}
              </group>
            );
          })}

        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} minDistance={2} maxDistance={15} />
      </Canvas>

      {/* Floating Instructions */}
      <div className="absolute bottom-4 left-4 glass-card px-4 py-2 rounded-lg text-xs text-slate-400 select-none pointer-events-none">
        🖱️ Left-Click + Drag: Rotate | 🖱️ Right-Click + Drag: Pan | 🖱️ Click object: Select to edit
      </div>
    </div>
  );
}
