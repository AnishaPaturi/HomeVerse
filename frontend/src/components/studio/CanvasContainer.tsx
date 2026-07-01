"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
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

export default function CanvasContainer({
  objects,
  selectedObjectId,
  onSelectObject,
  backgroundImageUrl = null,
  roomWidth = 10,
  roomDepth = 10,
  activeFloor = 0,
  renderStyle = "realistic",
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
            const clickHandler = () => onSelectObject(obj.id);
            const objFloor = Math.floor(obj.position_y / 3.0);
            
            // Clip objects above the active floor so we can edit inside
            if (objFloor > activeFloor) return null;
            
            return (
              <group
                key={obj.id}
                position={[obj.position_x, obj.position_y, obj.position_z]}
                rotation={[0, obj.rotation, 0]}
                scale={[obj.scale, obj.scale, obj.scale]}
              >
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
              </group>
            );
          })}

        <OrbitControls 
          makeDefault 
          target={[0, activeFloor * 3.0, -2.5]}
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={2} 
          maxDistance={20} 
        />
      </Canvas>

      {/* Floating Instructions */}
      <div className="absolute bottom-4 left-4 glass-card px-4 py-2 rounded-lg text-xs text-slate-400 select-none pointer-events-none">
        🖱️ Left-Click + Drag: Rotate | 🖱️ Right-Click + Drag: Pan | 🖱️ Click object: Select to edit
      </div>
    </div>
  );
}
