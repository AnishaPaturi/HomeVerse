"use client";

import React, { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type ViewAngle = "perspective" | "top" | "front" | "isometric" | "walkthrough";

interface CameraControlsProps {
  viewAngle?: ViewAngle;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  autoRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  viewAngle = "perspective",
  enableZoom = true,
  enablePan = true,
  enableRotate = true,
  autoRotate = false,
  minDistance = 2,
  maxDistance = 20,
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    switch (viewAngle) {
      case "top":
        camera.position.set(0, 12, 0.001);
        controlsRef.current.target.set(0, 0, 0);
        break;
      case "front":
        camera.position.set(0, 2, 8);
        controlsRef.current.target.set(0, 1.2, 0);
        break;
      case "isometric":
        camera.position.set(7, 7, 7);
        controlsRef.current.target.set(0, 0.5, 0);
        break;
      case "walkthrough":
        camera.position.set(0, 1.6, 3.5);
        controlsRef.current.target.set(0, 1.6, -1);
        break;
      default: // perspective
        camera.position.set(5.5, 4.5, 6);
        controlsRef.current.target.set(0, 0.6, 0);
        break;
    }

    controlsRef.current.update();
  }, [viewAngle, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={enableZoom}
      enablePan={enablePan}
      enableRotate={enableRotate}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={viewAngle === "top" ? Math.PI / 2 : Math.PI / 2 + 0.05}
      dampingFactor={0.08}
    />
  );
};

export default CameraControls;
