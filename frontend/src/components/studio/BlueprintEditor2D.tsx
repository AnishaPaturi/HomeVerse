"use client";

import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Trash2, Plus, Sparkles, AlertCircle } from "lucide-react";

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

interface BlueprintEditor2DProps {
  objects: RoomObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<RoomObject>) => void;
  onDeleteObject: (id: string) => void;
  onAddObject: (type: "sofa" | "coffee_table" | "desk" | "chair" | "bed" | "lamp" | "partition" | "door" | "window", customMaterial?: string, customScale?: number) => void;
  roomWidth: number;
  roomDepth: number;
  onUpdateRoomDimensions: (width: number, depth: number) => void;
  activeFloor: number;
}

export default function BlueprintEditor2D({
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onAddObject,
  roomWidth,
  roomDepth,
  onUpdateRoomDimensions,
  activeFloor,
}: BlueprintEditor2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [objectStartCoords, setObjectStartCoords] = useState({ x: 0, z: 0 });
  const [dragMode, setDragMode] = useState<"move" | "rotate" | "wall-width" | "wall-depth" | "partition-scale" | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [objectStartRotation, setObjectStartRotation] = useState(0);

  // Grid size in pixels per meter
  const BASE_SCALE = 35; 
  const scale = BASE_SCALE * zoom;

  // Center coordinate mappings: (0, 0) in 3D maps to SVG center + pan
  const [svgCenter, setSvgCenter] = useState({ x: 250, y: 250 });

  useEffect(() => {
    if (containerRef.current) {
      setSvgCenter({
        x: containerRef.current.clientWidth / 2,
        y: containerRef.current.clientHeight / 2,
      });
    }
  }, [zoom]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSvgCenter({
          x: containerRef.current.clientWidth / 2,
          y: containerRef.current.clientHeight / 2,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Convert 3D coordinate (meters) to 2D SVG pixel coordinate
  const to2D = (x: number, z: number) => {
    // 3D Z axis points towards camera (positive Z), room center is offset at Z = -2.5
    const svgX = svgCenter.x + pan.x + x * scale;
    const svgY = svgCenter.y + pan.y + (z + 2.5) * scale;
    return { x: svgX, y: svgY };
  };

  // Convert 2D SVG pixel coordinate to 3D coordinate (meters)
  const to3D = (svgX: number, svgY: number) => {
    const x = (svgX - svgCenter.x - pan.x) / scale;
    const z = (svgY - svgCenter.y - pan.y) / scale - 2.5;
    return { x, z };
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers (when clicking background grid)
  const handleBgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).id === "grid-bg") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectObject(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!dragMode || !draggedObjectId) return;

    if (dragMode === "move") {
      // Delta drag in pixels
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;

      // Delta drag in meters
      const dxMeters = dx / scale;
      const dzMeters = dy / scale;

      let newX = objectStartCoords.x + dxMeters;
      let newZ = objectStartCoords.z + dzMeters;

      // Snap to grid option (0.1m snap)
      newX = Math.round(newX * 10) / 10;
      newZ = Math.round(newZ * 10) / 10;

      // Retrieve selected object properties for dimensions
      const obj = objects.find((o) => o.id === draggedObjectId);
      if (!obj) return;
      
      const width = getObjectDimensions(obj.object_type).w * obj.scale;
      const depth = getObjectDimensions(obj.object_type).d * obj.scale;

      // Snapping to outer walls
      const boundaryLeft = -roomWidth / 2 + width / 2;
      const boundaryRight = roomWidth / 2 - width / 2;
      const boundaryBack = -roomDepth / 2 - 2.5 + depth / 2;
      const boundaryFront = roomDepth / 2 - 2.5 - depth / 2;

      let rotationSnap = obj.rotation;

      // Wall Snapping Heuristic (snaps within 0.25 meters)
      const snapThreshold = 0.25;
      if (Math.abs(newX - boundaryLeft) < snapThreshold) {
        newX = boundaryLeft;
        rotationSnap = Math.PI / 2; // Face right wall (rot = 90 deg)
      } else if (Math.abs(newX - boundaryRight) < snapThreshold) {
        newX = boundaryRight;
        rotationSnap = -Math.PI / 2; // Face left wall (rot = -90 deg)
      }

      if (Math.abs(newZ - boundaryBack) < snapThreshold) {
        newZ = boundaryBack;
        rotationSnap = 3.14; // Face camera / back wall (rot = 180 deg)
      } else if (Math.abs(newZ - boundaryFront) < snapThreshold) {
        newZ = boundaryFront;
        rotationSnap = 0; // Face back wall / front (rot = 0 deg)
      }

      onUpdateObject(draggedObjectId, {
        position_x: newX,
        position_z: newZ,
        rotation: rotationSnap,
      });

    } else if (dragMode === "rotate") {
      const obj = objects.find((o) => o.id === draggedObjectId);
      if (!obj) return;

      const objCenter2D = to2D(obj.position_x, obj.position_z);

      // Angle from object center to current cursor
      const currentAngle = Math.atan2(mouseY - objCenter2D.y, mouseX - objCenter2D.x);
      
      // Net change in rotation
      const deltaAngle = currentAngle - rotateStartAngle;
      let newRotation = objectStartRotation + deltaAngle;

      // Normalize rotation between -PI and PI
      newRotation = Math.atan2(Math.sin(newRotation), Math.cos(newRotation));

      // Snap rotation to 45 degree increments if close
      const deg45 = Math.PI / 4;
      const snappedRotation = Math.round(newRotation / deg45) * deg45;
      const rotDiff = Math.abs(newRotation - snappedRotation);
      
      onUpdateObject(draggedObjectId, {
        rotation: rotDiff < 0.15 ? snappedRotation : newRotation,
      });

    } else if (dragMode === "partition-scale") {
      const obj = objects.find((o) => o.id === draggedObjectId);
      if (!obj) return;

      const objCenter2D = to2D(obj.position_x, obj.position_z);
      const dx = mouseX - objCenter2D.x;
      const dy = mouseY - objCenter2D.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distMeters = distPx / scale;

      let newScale = distMeters; // half-length represents the scale multiplier
      newScale = Math.max(Math.round(newScale * 10) / 10, 0.2); // min 0.2 scale (0.4m wall)
      newScale = Math.min(newScale, 6.0); // max 6.0 scale (12m wall)

      onUpdateObject(draggedObjectId, {
        scale: newScale,
      });

    } else if (dragMode === "wall-width") {
      // Resize room width
      const coords = to3D(mouseX, mouseY);
      let newWidth = Math.max(Math.round(coords.x * 2 * 2) / 2, 4); // Min width 4m, rounded to 0.5m
      newWidth = Math.min(newWidth, 16); // Max width 16m
      onUpdateRoomDimensions(newWidth, roomDepth);

    } else if (dragMode === "wall-depth") {
      // Resize room depth (offset Z maps with offset -2.5)
      const coords = to3D(mouseX, mouseY);
      let newDepth = Math.max(Math.round((coords.z + 2.5) * 2 * 2) / 2, 4); // Min depth 4m
      newDepth = Math.min(newDepth, 16); // Max depth 16m
      onUpdateRoomDimensions(roomWidth, newDepth);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedObjectId(null);
    setDragMode(null);
  };

  // Start dragging a furniture object
  const handleObjectMouseDown = (e: React.MouseEvent, objId: string) => {
    e.stopPropagation();
    onSelectObject(objId);
    setDraggedObjectId(objId);
    setDragMode("move");
    setDragStartPos({ x: e.clientX, y: e.clientY });

    const obj = objects.find((o) => o.id === objId);
    if (obj) {
      setObjectStartCoords({ x: obj.position_x, z: obj.position_z });
    }
  };

  // Start rotating a furniture object
  const handleRotateMouseDown = (e: React.MouseEvent, obj: RoomObject) => {
    e.stopPropagation();
    setDraggedObjectId(obj.id);
    setDragMode("rotate");

    const svgRect = containerRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const objCenter2D = to2D(obj.position_x, obj.position_z);

    // Initial angle between center and rotation handle coordinate
    const angle = Math.atan2(mouseY - objCenter2D.y, mouseX - objCenter2D.x);
    setRotateStartAngle(angle);
    setObjectStartRotation(obj.rotation);
  };

  // Dimensions of furniture types in meters (width, depth)
  const getObjectDimensions = (type: string) => {
    switch (type) {
      case "sofa": return { w: 2.0, d: 0.9 };
      case "coffee_table": return { w: 1.2, d: 0.7 };
      case "desk": return { w: 1.4, d: 0.8 };
      case "chair": return { w: 0.6, d: 0.6 };
      case "bed": return { w: 1.6, d: 2.0 };
      case "lamp": return { w: 0.5, d: 0.5 };
      case "partition": return { w: 2.0, d: 0.15 };
      case "door": return { w: 0.9, d: 0.9 };
      case "window": return { w: 1.2, d: 0.15 };
      default: return { w: 1.0, d: 1.0 };
    }
  };

  // Colors mapping matching the 3D materials
  const getMaterialColor = (mat: string, fallback: string) => {
    if (mat.startsWith("#")) return mat;
    switch (mat) {
      case "wood_light": return "#d7ccc8";
      case "wood_dark": return "#5c4033";
      case "marble": return "#f5f5f5";
      case "granite": return "#374151";
      case "leather_brown": return "#8d6e63";
      case "leather_black": return "#1e293b";
      default: return fallback;
    }
  };

  const selectedObj = objects.find((o) => o.id === selectedObjectId);

  // Render SVG furniture details based on type
  const renderFurnitureSVG = (obj: RoomObject, widthPx: number, depthPx: number, isSelected: boolean) => {
    const color = getMaterialColor(obj.material, "#a78bfa");
    
    switch (obj.object_type) {
      case "sofa":
        return (
          <>
            {/* Sofa back support */}
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx*0.2} fill={color} stroke="#1e293b" strokeWidth="1" rx="2" />
            {/* Base Cushion */}
            <rect x={-widthPx/2 + 2} y={-depthPx/2 + depthPx*0.2} width={widthPx - 4} height={depthPx*0.8} fill={color} stroke="#1e293b" strokeWidth="1" rx="2" />
            {/* Armrests */}
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx*0.1} height={depthPx} fill={color} stroke="#1e293b" strokeWidth="1" rx="1.5" />
            <rect x={widthPx/2 - widthPx*0.1} y={-depthPx/2} width={widthPx*0.1} height={depthPx} fill={color} stroke="#1e293b" strokeWidth="1" rx="1.5" />
            {/* Lines separating cushions */}
            <line x1={0} y1={-depthPx/2 + depthPx*0.2} x2={0} y2={depthPx/2} stroke="#1e293b" strokeWidth="1" />
          </>
        );
      case "bed":
        return (
          <>
            {/* Headboard */}
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx*0.08} fill="#5c4033" stroke="#1e293b" strokeWidth="1" />
            {/* Mattress */}
            <rect x={-widthPx/2 + 2} y={-depthPx/2 + depthPx*0.08} width={widthPx - 4} height={depthPx*0.92} fill={color} stroke="#1e293b" strokeWidth="1" rx="3" />
            {/* Pillows */}
            <rect x={-widthPx/2 + 8} y={-depthPx/2 + depthPx*0.15} width={widthPx*0.35} height={depthPx*0.2} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="1.5" />
            <rect x={widthPx/2 - widthPx*0.35 - 8} y={-depthPx/2 + depthPx*0.15} width={widthPx*0.35} height={depthPx*0.2} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="1.5" />
            {/* Fold sheet line */}
            <path d={`M ${-widthPx/2 + 2} ${-depthPx/2 + depthPx*0.45} L ${widthPx/2 - 2} ${-depthPx/2 + depthPx*0.45}`} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
          </>
        );
      case "coffee_table":
        return (
          <>
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx} fill={color} stroke="#1e293b" strokeWidth="1.5" rx="4" />
            {/* Inner design line */}
            <rect x={-widthPx/2 + 4} y={-depthPx/2 + 4} width={widthPx - 8} height={depthPx - 8} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1,1" rx="2" />
          </>
        );
      case "desk":
        return (
          <>
            {/* Table top */}
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx} fill={color} stroke="#1e293b" strokeWidth="1.5" rx="1" />
            {/* Keyboard drawer tray indicator */}
            <line x1={-widthPx*0.3} y1={depthPx/2 - 4} x2={widthPx*0.3} y2={depthPx/2 - 4} stroke="#1e293b" strokeWidth="1" />
            {/* Desk grommet holes */}
            <circle cx={-widthPx/2 + 8} cy={-depthPx/2 + 8} r="3" fill="#1e293b" />
          </>
        );
      case "partition":
        return (
          <g>
            <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx} fill="#475569" stroke="#1e293b" strokeWidth="1" rx="1" />
            <line x1={-widthPx/2 + 2} y1={0} x2={widthPx/2 - 2} y2={0} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
          </g>
        );
      case "door":
        return (
          <g>
            {/* Door Swing Arc */}
            <path d={`M ${-widthPx/2} 0 A ${widthPx} ${widthPx} 0 0 1 ${widthPx/2} ${widthPx/2}`} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
            {/* Door Panel */}
            <line x1={-widthPx/2} y1={0} x2={widthPx/2} y2={widthPx/2} stroke="#b45309" strokeWidth="2.5" />
            {/* Door Frame */}
            <rect x={-widthPx/2 - 2} y={-3} width="4" height="6" fill="#475569" />
            <rect x={widthPx/2 - 2} y={-3} width="4" height="6" fill="#475569" />
          </g>
        );
      case "window":
        return (
          <g>
            {/* Window Frame */}
            <rect x={-widthPx/2} y={-4} width={widthPx} height="8" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Window Glass Line */}
            <line x1={-widthPx/2} y1={0} x2={widthPx/2} y2={0} stroke="#60a5fa" strokeWidth="2.5" />
            {/* Grills indicator */}
            <line x1={-widthPx/4} y1={-4} x2={-widthPx/4} y2={4} stroke="#475569" strokeWidth="1" />
            <line x1={widthPx/4} y1={-4} x2={widthPx/4} y2={4} stroke="#475569" strokeWidth="1" />
          </g>
        );
      case "chair":
        return (
          <>
            {/* Seat */}
            <rect x={-widthPx/2} y={-depthPx/2 + 4} width={widthPx} height={depthPx - 4} fill={color} stroke="#1e293b" strokeWidth="1" rx="2" />
            {/* Backrest support */}
            <rect x={-widthPx/2 + 2} y={-depthPx/2} width={widthPx - 4} height={4} fill={color} stroke="#1e293b" strokeWidth="1" />
            {/* Stylized mesh outline */}
            <circle cx={0} cy={2} r="4" fill="none" stroke="#475569" strokeWidth="0.8" />
          </>
        );
      case "lamp":
        return (
          <>
            {/* Base */}
            <circle cx="0" cy="0" r={widthPx/2} fill={color} stroke="#1e293b" strokeWidth="1" />
            {/* Center light core */}
            <circle cx="0" cy="0" r={widthPx/3} fill="#ffffff" opacity="0.85" />
            <circle cx="0" cy="0" r="3" fill="#fbbf24" />
          </>
        );
      default:
        return <rect x={-widthPx/2} y={-depthPx/2} width={widthPx} height={depthPx} fill={color} stroke="#1e293b" strokeWidth="1" />;
    }
  };

  // Coordinates of center bounds for distance guides
  const backWallZ = -roomDepth / 2 - 2.5;
  const leftWallX = -roomWidth / 2;
  const rightWallX = roomWidth / 2;
  const frontWallZ = roomDepth / 2 - 2.5;

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/90 flex flex-col min-h-[400px]">
      
      {/* 2D Canvas SVG Viewport */}
      <svg
        className="w-full flex-1 select-none cursor-grab active:cursor-grabbing bg-slate-950"
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Custom pattern for minor and major gridlines */}
          <pattern id="grid-pattern" width={scale} height={scale} patternUnits="userSpaceOnUse">
            {/* Major grid lines (1m) */}
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#334155" strokeWidth="1" />
            {/* Minor grid lines (0.25m) */}
            <path d={`M ${scale/4} 0 L ${scale/4} ${scale} M ${scale/2} 0 L ${scale/2} ${scale} M ${scale*3/4} 0 L ${scale*3/4} ${scale} M 0 ${scale/4} L ${scale} ${scale/4} M 0 ${scale/2} L ${scale} ${scale/2} M 0 ${scale*3/4} L ${scale} ${scale*3/4}`} fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="1,2" />
          </pattern>
          
          {/* Drop shadow filter for furniture */}
          <filter id="furniture-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. Grid Background */}
        <rect id="grid-bg" width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* 2. Room Floor Plane */}
        {(() => {
          const floorTopLeft = to2D(-roomWidth / 2, -roomDepth / 2 - 2.5);
          const floorWidth = roomWidth * scale;
          const floorHeight = roomDepth * scale;
          
          return (
            <rect
              x={floorTopLeft.x}
              y={floorTopLeft.y}
              width={floorWidth}
              height={floorHeight}
              fill="#090d16"
              opacity="0.6"
              stroke="#475569"
              strokeWidth="0.8"
            />
          );
        })()}

        {/* 3. Distance Guidelines (Only drawn when an object is being dragged/moved) */}
        {dragMode === "move" && selectedObj && (
          (() => {
            const center2D = to2D(selectedObj.position_x, selectedObj.position_z);
            const backWall2D = to2D(selectedObj.position_x, backWallZ);
            const frontWall2D = to2D(selectedObj.position_x, frontWallZ);
            const leftWall2D = to2D(leftWallX, selectedObj.position_z);
            const rightWall2D = to2D(rightWallX, selectedObj.position_z);

            const distLeft = Math.abs(selectedObj.position_x - leftWallX).toFixed(2);
            const distRight = Math.abs(rightWallX - selectedObj.position_x).toFixed(2);
            const distBack = Math.abs(selectedObj.position_z - backWallZ).toFixed(2);
            const distFront = Math.abs(frontWallZ - selectedObj.position_z).toFixed(2);

            return (
              <g opacity="0.85">
                {/* Guidelines to Walls */}
                <line x1={center2D.x} y1={center2D.y} x2={leftWall2D.x} y2={center2D.y} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3,3" />
                <line x1={center2D.x} y1={center2D.y} x2={rightWall2D.x} y2={center2D.y} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3,3" />
                <line x1={center2D.x} y1={center2D.y} x2={center2D.x} y2={backWall2D.y} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3,3" />
                <line x1={center2D.x} y1={center2D.y} x2={center2D.x} y2={frontWall2D.y} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3,3" />

                {/* Distance text labels */}
                <rect x={leftWall2D.x + (center2D.x - leftWall2D.x)/2 - 18} y={center2D.y - 8} width="36" height="15" rx="3" fill="#1e1b4b" stroke="#312e81" strokeWidth="0.5" />
                <text x={leftWall2D.x + (center2D.x - leftWall2D.x)/2} y={center2D.y + 3} fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{distLeft}m</text>

                <rect x={center2D.x + (rightWall2D.x - center2D.x)/2 - 18} y={center2D.y - 8} width="36" height="15" rx="3" fill="#1e1b4b" stroke="#312e81" strokeWidth="0.5" />
                <text x={center2D.x + (rightWall2D.x - center2D.x)/2} y={center2D.y + 3} fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{distRight}m</text>

                <rect x={center2D.x - 18} y={backWall2D.y + (center2D.y - backWall2D.y)/2 - 8} width="36" height="15" rx="3" fill="#1e1b4b" stroke="#312e81" strokeWidth="0.5" />
                <text x={center2D.x} y={backWall2D.y + (center2D.y - backWall2D.y)/2 + 3} fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{distBack}m</text>

                <rect x={center2D.x - 18} y={center2D.y + (frontWall2D.y - center2D.y)/2 - 8} width="36" height="15" rx="3" fill="#1e1b4b" stroke="#312e81" strokeWidth="0.5" />
                <text x={center2D.x} y={center2D.y + (frontWall2D.y - center2D.y)/2 + 3} fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{distFront}m</text>
              </g>
            );
          })()
        )}

        {/* 4. Outer Walls & Resize Drag Handles */}
        {(() => {
          const topLeft = to2D(-roomWidth / 2, -roomDepth / 2 - 2.5);
          const topRight = to2D(roomWidth / 2, -roomDepth / 2 - 2.5);
          const bottomLeft = to2D(-roomWidth / 2, roomDepth / 2 - 2.5);
          const bottomRight = to2D(roomWidth / 2, roomDepth / 2 - 2.5);

          const midRight = { x: topRight.x, y: topRight.y + (bottomRight.y - topRight.y) / 2 };
          const midBottom = { x: bottomLeft.x + (bottomRight.x - bottomLeft.x) / 2, y: bottomLeft.y };

          return (
            <g>
              {/* Left Wall Line */}
              <line x1={topLeft.x} y1={topLeft.y} x2={bottomLeft.x} y2={bottomLeft.y} stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              {/* Back Wall Line */}
              <line x1={topLeft.x} y1={topLeft.y} x2={topRight.x} y2={topRight.y} stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              {/* Right Wall Line */}
              <line x1={topRight.x} y1={topRight.y} x2={bottomRight.x} y2={bottomRight.y} stroke="#475569" strokeWidth="6" strokeLinecap="round" />
              {/* Front Boundary Line (Dashed) */}
              <line x1={bottomLeft.x} y1={bottomLeft.y} x2={bottomRight.x} y2={bottomRight.y} stroke="#475569" strokeWidth="2" strokeDasharray="4,4" />

              {/* Dynamic Width Text Annotation on Back Wall */}
              <text x={topLeft.x + (topRight.x - topLeft.x)/2} y={topLeft.y - 12} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                Width: {roomWidth.toFixed(1)}m
              </text>
              
              {/* Dynamic Depth Text Annotation on Left Wall */}
              <text
                x={topLeft.x - 12}
                y={topLeft.y + (bottomLeft.y - topLeft.y)/2}
                fill="#94a3b8"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                transform={`rotate(-90, ${topLeft.x - 12}, ${topLeft.y + (bottomLeft.y - topLeft.y)/2})`}
                fontFamily="sans-serif"
              >
                Depth: {roomDepth.toFixed(1)}m
              </text>

              {/* Right wall resize handle dot */}
              <g
                className="cursor-ew-resize group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragMode("wall-width");
                  setDraggedObjectId("wall-handle");
                }}
              >
                <circle cx={midRight.x} cy={midRight.y} r="8" fill="#3b82f6" opacity="0.3" className="group-hover:opacity-60 transition-opacity" />
                <circle cx={midRight.x} cy={midRight.y} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              </g>

              {/* Bottom wall resize handle dot */}
              <g
                className="cursor-ns-resize group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragMode("wall-depth");
                  setDraggedObjectId("wall-handle");
                }}
              >
                <circle cx={midBottom.x} cy={midBottom.y} r="8" fill="#3b82f6" opacity="0.3" className="group-hover:opacity-60 transition-opacity" />
                <circle cx={midBottom.x} cy={midBottom.y} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            </g>
          );
        })()}

        {/* 5. Render Furniture & Partition Objects on Active Floor */}
        {objects
          .filter((o) => {
            if (o.object_type === "floor" || o.object_type === "wall") return false;
            const objFloor = Math.floor(o.position_y / 3.0);
            return objFloor === activeFloor;
          })
          .map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const pos2D = to2D(obj.position_x, obj.position_z);
            
            const dimensions = getObjectDimensions(obj.object_type);
            const widthPx = dimensions.w * scale * obj.scale;
            const depthPx = dimensions.d * scale * obj.scale;

            // Rotation in degrees (SVG uses degrees instead of radians)
            const rotationDeg = (obj.rotation * 180) / Math.PI;

            return (
              <g
                key={obj.id}
                transform={`translate(${pos2D.x}, ${pos2D.y}) rotate(${rotationDeg})`}
                onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
                className="cursor-move"
                filter="url(#furniture-shadow)"
              >
                {/* Visual outline highlighting selection */}
                {isSelected && (
                  <rect
                    x={-widthPx/2 - 4}
                    y={-depthPx/2 - 4}
                    width={widthPx + 8}
                    height={depthPx + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeDasharray="2,2"
                    rx="4"
                  />
                )}

                {/* Render specific furniture shapes */}
                {renderFurnitureSVG(obj, widthPx, depthPx, isSelected)}

                {/* Rotation Handle (Drawn only if selected) */}
                {isSelected && (
                  <g
                    transform={`translate(0, ${-depthPx/2 - 30})`}
                    className="cursor-alias"
                    onMouseDown={(e) => handleRotateMouseDown(e, obj)}
                  >
                    {/* Connecting line */}
                    <line x1="0" y1="30" x2="0" y2="8" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2,2" />
                    
                    {/* Handle dot */}
                    <circle cx="0" cy="0" r="7" fill="#3b82f6" opacity="0.3" />
                    <circle cx="0" cy="0" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                  </g>
                )}

                {/* Wall Stretch Handle (Drawn only if partition and selected) */}
                {isSelected && obj.object_type === "partition" && (
                  <g
                    transform={`translate(${widthPx / 2}, 0)`}
                    className="cursor-ew-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedObjectId(obj.id);
                      setDragMode("partition-scale");
                      setDragStartPos({ x: e.clientX, y: e.clientY });
                    }}
                  >
                    <circle cx="0" cy="0" r="7" fill="#10b981" opacity="0.3" />
                    <circle cx="0" cy="0" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                  </g>
                )}
              </g>
            );
          })}
      </svg>

      {/* Floating Canvas UI Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="flex bg-slate-900/90 border border-slate-850 p-1 rounded-xl shadow-lg backdrop-blur-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom / Pan"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {selectedObjectId && (
          <button
            onClick={() => onDeleteObject(selectedObjectId)}
            className="p-2.5 bg-red-950/80 hover:bg-red-900 border border-red-900/60 rounded-xl text-red-400 hover:text-white transition-all shadow-lg backdrop-blur-sm self-end cursor-pointer"
            title="Delete Selected Object"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Blueprint Drawing Tooltip */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none">
        <div className="glass-card px-4 py-2 rounded-lg text-[10px] text-slate-400">
          💡 Drag furniture to move • Drag top handle to rotate • Drag wall handle dots to resize room size
        </div>
        <div className="glass-card px-3 py-1.5 rounded-lg text-[10px] text-blue-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Wall Snapping Enabled
        </div>
      </div>
    </div>
  );
}
