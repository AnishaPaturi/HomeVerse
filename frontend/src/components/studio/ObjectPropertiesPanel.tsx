"use client";

import React from "react";
import { Trash2, Move, RotateCw, Maximize2, Palette } from "lucide-react";

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

interface ObjectPropertiesPanelProps {
  selectedObject: RoomObject | null;
  onUpdateObject: (id: string, updates: Partial<RoomObject>) => void;
  onDeleteObject: (id: string) => void;
}

export default function ObjectPropertiesPanel({
  selectedObject,
  onUpdateObject,
  onDeleteObject,
}: ObjectPropertiesPanelProps) {
  if (!selectedObject) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 border border-slate-800/40 rounded-2xl bg-slate-900/30">
        <div className="mb-3 p-3 bg-slate-800/20 rounded-full">
          <Palette className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400">No Object Selected</p>
        <p className="text-xs text-slate-500 mt-1">
          Click on any item, wall, or the floor inside the 3D scene to configure its properties.
        </p>
      </div>
    );
  }

  const { id, object_type, position_x, position_y, position_z, rotation, scale, material } = selectedObject;

  // Preset Colors for Furniture or Walls
  const colorPresets = [
    { name: "Cream", value: "#f5f5dc" },
    { name: "Off-White", value: "#f8fafc" },
    { name: "Charcoal", value: "#334155" },
    { name: "Soft Sage", value: "#86efac" },
    { name: "Teal", value: "#0d9488" },
    { name: "Tan Leather", value: "#b45309" },
    { name: "Midnight Blue", value: "#1e3a8a" },
    { name: "Blush Pink", value: "#fbcfe8" },
  ];

  // Presets for Floors
  const floorPresets = [
    { name: "Light Oak Wood", value: "wood_light" },
    { name: "Dark Walnut Wood", value: "wood_dark" },
    { name: "White Marble", value: "marble" },
    { name: "Dark Granite", value: "granite" },
  ];

  const isWallOrFloor = object_type === "wall" || object_type === "floor";

  return (
    <div className="h-full flex flex-col glass-panel border border-slate-700/50 rounded-2xl p-5 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">Configure Element</span>
          <h3 className="text-lg font-bold capitalize text-slate-100 mt-0.5">{object_type.replace("_", " ")}</h3>
        </div>
        {!isWallOrFloor && (
          <button
            onClick={() => onDeleteObject(id)}
            className="p-2 bg-red-950/20 hover:bg-red-500/20 text-red-400 border border-red-900/40 rounded-lg transition-colors cursor-pointer"
            title="Delete Object"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Surface Presets for Floor / Wall */}
      {object_type === "floor" && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">Floor Material</label>
          <div className="grid grid-cols-2 gap-2">
            {floorPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onUpdateObject(id, { material: preset.value })}
                className={`py-2 px-3 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                  material === preset.value
                    ? "border-blue-500 bg-blue-950/40 text-blue-300 font-medium"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors / Materials */}
      {object_type !== "floor" && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">
            {object_type === "wall" ? "Paint Color" : "Finish / Fabric Color"}
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onUpdateObject(id, { material: preset.value })}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 cursor-pointer relative ${
                  material === preset.value ? "border-blue-500" : "border-transparent"
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              >
                {material === preset.value && (
                  <span className="absolute inset-0 m-auto w-2 h-2 bg-slate-900 rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Custom:</span>
            <input
              type="color"
              value={material.startsWith("#") ? material : "#cccccc"}
              onChange={(e) => onUpdateObject(id, { material: e.target.value })}
              className="w-10 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-mono">{material}</span>
          </div>
        </div>
      )}

      {/* Spatial Transforms (Disable for Wall/Floor since they are fixed) */}
      {!isWallOrFloor && (
        <div className="space-y-6">
          {/* Position Section */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Move className="w-3.5 h-3.5 text-blue-400" /> Position Offset
            </span>
            <div className="space-y-2.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Left / Right (X)</span>
                  <span className="font-mono">{position_x.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={position_x}
                  onChange={(e) => onUpdateObject(id, { position_x: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Height (Y)</span>
                  <span className="font-mono">{position_y.toFixed(2)}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={position_y}
                  onChange={(e) => onUpdateObject(id, { position_y: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Forward / Back (Z)</span>
                  <span className="font-mono">{position_z.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={position_z}
                  onChange={(e) => onUpdateObject(id, { position_z: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Rotation Section */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <RotateCw className="w-3.5 h-3.5 text-blue-400" /> Rotation (Y-Axis)
            </span>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Angle</span>
                <span className="font-mono">{Math.round((rotation * 180) / Math.PI)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step={Math.PI / 12}
                value={rotation}
                onChange={(e) => onUpdateObject(id, { rotation: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Scale Section */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" /> Size Scale
            </span>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Scale Factor</span>
                <span className="font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={scale}
                onChange={(e) => onUpdateObject(id, { scale: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
