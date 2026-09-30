"use client";

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, Html } from "@react-three/drei";
import Lighting from "./Lighting";
import CameraControls, { ViewAngle } from "./CameraControls";
import { Floor, Room } from "@/types";

interface HouseSceneProps {
  floors?: Floor[];
  rooms?: Room[];
  selectedFloorId?: string | null;
  onSelectFloor?: (floorId: string) => void;
  onSelectRoom?: (roomId: string) => void;
  viewAngle?: ViewAngle;
}

export const HouseScene: React.FC<HouseSceneProps> = ({
  floors = [
    { id: "f1", project_id: "p1", level: 1, name: "Ground Floor", room_count: 3, created_at: "", updated_at: "" },
    { id: "f2", project_id: "p1", level: 2, name: "First Floor", room_count: 2, created_at: "", updated_at: "" },
  ],
  rooms = [
    { id: "r1", floor_id: "f1", name: "Living Room", room_type: "living_room", width_meters: 5.5, length_meters: 6.5, area_sqm: 35.75, created_at: "", updated_at: "" },
    { id: "r2", floor_id: "f1", name: "Kitchen", room_type: "kitchen", width_meters: 3.5, length_meters: 4.0, area_sqm: 14.0, created_at: "", updated_at: "" },
    { id: "r3", floor_id: "f1", name: "Master Bedroom", room_type: "master_bedroom", width_meters: 4.5, length_meters: 5.0, area_sqm: 22.5, created_at: "", updated_at: "" },
    { id: "r4", floor_id: "f2", name: "Bedroom 2", room_type: "bedroom", width_meters: 4.0, length_meters: 4.5, area_sqm: 18.0, created_at: "", updated_at: "" },
    { id: "r5", floor_id: "f2", name: "Home Office", room_type: "office", width_meters: 3.2, length_meters: 3.8, area_sqm: 12.16, created_at: "", updated_at: "" },
  ],
  selectedFloorId,
  onSelectFloor,
  onSelectRoom,
  viewAngle = "perspective",
}) => {
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);

  // Each floor stacked vertically by 3.2 meters
  const floorHeight = 3.2;

  return (
    <div className="w-full h-full relative select-none bg-[#070a0f] rounded-2xl overflow-hidden">
      <Canvas shadows camera={{ position: [10, 10, 12], fov: 42 }}>
        <Suspense fallback={null}>
          <Lighting preset="studio" intensity={1.1} />
          <CameraControls viewAngle={viewAngle} maxDistance={35} />

          {/* Ground Terrain / Exterior Grid */}
          <Grid
            position={[0, -0.05, 0]}
            args={[25, 25]}
            cellSize={1}
            cellColor="#1e293b"
            sectionSize={5}
            sectionColor="#10b981"
            fadeDistance={30}
          />

          {/* Stacked Floors */}
          {floors.map((floor, fIdx) => {
            const isFloorSelected = selectedFloorId === floor.id;
            const isHovered = hoveredFloor === floor.id;
            const yOffset = fIdx * (floorHeight + 0.6); // slight separation for cutaway visibility
            const floorRooms = rooms.filter((r) => r.floor_id === floor.id);

            return (
              <group
                key={floor.id}
                position={[0, yOffset, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredFloor(floor.id);
                }}
                onPointerOut={() => setHoveredFloor(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectFloor) onSelectFloor(floor.id);
                }}
              >
                {/* Floor Slab */}
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                  <boxGeometry args={[12, 0.2, 10]} />
                  <meshStandardMaterial
                    color={
                      isFloorSelected
                        ? "#10b981"
                        : isHovered
                        ? "#38bdf8"
                        : "#1e293b"
                    }
                    roughness={0.6}
                  />
                </mesh>

                {/* Rooms Outline / Partitions */}
                {floorRooms.map((room, rIdx) => {
                  const xPos = (rIdx % 2 === 0 ? -2.5 : 2.5);
                  const zPos = (rIdx < 2 ? -2 : 2);
                  return (
                    <group
                      key={room.id}
                      position={[xPos, 0.1, zPos]}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectRoom) onSelectRoom(room.id);
                      }}
                    >
                      {/* Room boundary walls wireframe */}
                      <mesh position={[0, 1.2, 0]}>
                        <boxGeometry args={[room.width_meters || 4, 2.4, room.length_meters || 4]} />
                        <meshStandardMaterial
                          color="#334155"
                          wireframe
                          transparent
                          opacity={0.3}
                        />
                      </mesh>

                      {/* Room Tag Pin */}
                      <Html position={[0, 1.5, 0]} center distanceFactor={15}>
                        <div className="px-2 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-emerald-300 pointer-events-none whitespace-nowrap">
                          {room.name}
                        </div>
                      </Html>
                    </group>
                  );
                })}

                {/* Floor Level Label */}
                <Html position={[-6.8, 0.5, 0]} center distanceFactor={18}>
                  <div
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-lg ${
                      isFloorSelected
                        ? "bg-emerald-500 text-slate-950 border-white"
                        : "bg-[#090e15] text-slate-300 border-slate-700 hover:border-emerald-500"
                    }`}
                  >
                    {floor.name || `Level ${floor.level}`}
                  </div>
                </Html>
              </group>
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HouseScene;
