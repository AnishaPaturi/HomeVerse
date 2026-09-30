"use client";

import React from "react";

interface LightingProps {
  preset?: "warm" | "neutral" | "cool" | "luxury" | "studio";
  intensity?: number;
  castShadows?: boolean;
}

export const Lighting: React.FC<LightingProps> = ({
  preset = "warm",
  intensity = 1.0,
  castShadows = true,
}) => {
  const getPresetConfig = () => {
    switch (preset) {
      case "warm":
        return {
          ambient: "#fef3c7",
          ambientIntensity: 0.6 * intensity,
          main: "#fffbeb",
          mainIntensity: 1.4 * intensity,
          fill: "#fed7aa",
          fillIntensity: 0.5 * intensity,
        };
      case "cool":
        return {
          ambient: "#e0f2fe",
          ambientIntensity: 0.5 * intensity,
          main: "#f8fafc",
          mainIntensity: 1.5 * intensity,
          fill: "#bae6fd",
          fillIntensity: 0.4 * intensity,
        };
      case "luxury":
        return {
          ambient: "#fef08a",
          ambientIntensity: 0.5 * intensity,
          main: "#fef3c7",
          mainIntensity: 1.8 * intensity,
          fill: "#fde047",
          fillIntensity: 0.6 * intensity,
        };
      case "studio":
        return {
          ambient: "#ffffff",
          ambientIntensity: 0.7 * intensity,
          main: "#ffffff",
          mainIntensity: 1.6 * intensity,
          fill: "#f1f5f9",
          fillIntensity: 0.6 * intensity,
        };
      default: // neutral
        return {
          ambient: "#ffffff",
          ambientIntensity: 0.55 * intensity,
          main: "#ffffff",
          mainIntensity: 1.5 * intensity,
          fill: "#e2e8f0",
          fillIntensity: 0.45 * intensity,
        };
    }
  };

  const config = getPresetConfig();

  return (
    <group name="lighting-rig">
      {/* Ambient Light */}
      <ambientLight color={config.ambient} intensity={config.ambientIntensity} />

      {/* Primary Key Directional Sun/Window Light */}
      <directionalLight
        position={[6, 8, 5]}
        intensity={config.mainIntensity}
        color={config.main}
        castShadow={castShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={25}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />

      {/* Secondary Fill Directional Light */}
      <directionalLight
        position={[-6, 5, -4]}
        intensity={config.fillIntensity}
        color={config.fill}
      />

      {/* Interior Warm Accent Point Light */}
      <pointLight position={[0, 2.5, 0]} intensity={0.4 * intensity} color="#fbbf24" distance={8} decay={2} />
    </group>
  );
};

export default Lighting;
