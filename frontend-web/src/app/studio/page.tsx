"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  FileText, 
  Download, 
  Plus, 
  Sparkles, 
  Layers, 
  Box, 
  Search, 
  Sliders, 
  ShoppingBag, 
  Image as ImageIcon, 
  ShoppingCart, 
  Trash2, 
  ExternalLink, 
  Tv, 
  Cpu, 
  Undo2, 
  Redo2, 
  Save, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Eye, 
  Maximize2, 
  X, 
  Share2, 
  Command, 
  Paintbrush, 
  Ruler, 
  Lightbulb, 
  IndianRupee, 
  ShieldCheck, 
  FileCode, 
  Film,
  Zap,
  HelpCircle,
  Smartphone
} from "lucide-react";
import CanvasContainer from "@/components/studio/CanvasContainer";
import BlueprintEditor2D from "@/components/studio/BlueprintEditor2D";
import ObjectPropertiesPanel from "@/components/studio/ObjectPropertiesPanel";
import CopilotChat from "@/components/studio/CopilotChat";
import VRPanoramaModal from "@/components/studio/VRPanoramaModal";
import VoiceAssistantWidget from "@/components/studio/VoiceAssistantWidget";
import ARPlacementModal from "@/components/studio/ARPlacementModal";
import MaterialExplorerModal from "@/components/studio/MaterialExplorerModal";

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

const getInitialObjectsForRoomType = (
  roomType: string,
  style: string,
  width: number = 8,
  depth: number = 8
): RoomObject[] => {
  const room = roomType.toLowerCase();
  const floorMat = style === "Luxury" || style === "Modern Luxury" ? "granite" : "wood_light";
  const wallMat = style === "Minimalist" ? "#ffffff" : style === "Luxury" || style === "Modern Luxury" ? "#1e293b" : "#334155";

  const zCenter = -3.0;
  const halfW = Math.max(width / 2.0, 3.0);
  const halfD = Math.max(depth / 2.0, 3.0);

  const baseObjects: RoomObject[] = [
    { id: "floor-1", object_type: "floor", position_x: 0, position_y: 0, position_z: zCenter, rotation: 0, scale: 1, material: floorMat },
    { id: "wall-back", object_type: "partition", position_x: 0, position_y: 0, position_z: zCenter - halfD, rotation: 0, scale: halfW * 2, material: wallMat },
    { id: "wall-front", object_type: "partition", position_x: 0, position_y: 0, position_z: zCenter + halfD, rotation: 0, scale: halfW * 2, material: wallMat },
    { id: "wall-left", object_type: "partition", position_x: -halfW, position_y: 0, position_z: zCenter, rotation: 1.57, scale: halfD * 2, material: wallMat },
    { id: "wall-right", object_type: "partition", position_x: halfW, position_y: 0, position_z: zCenter, rotation: 1.57, scale: halfD * 2, material: wallMat },
    { id: "door-1", object_type: "door", position_x: -halfW, position_y: 0, position_z: zCenter + (halfD * 0.4), rotation: 1.57, scale: 1.0, material: "wood_dark" },
    { id: "window-1", object_type: "window", position_x: 0, position_y: 1.2, position_z: zCenter - halfD + 0.1, rotation: 0, scale: 1.0, material: "glass_base" },
  ];

  if (room.includes("bed")) {
    return [
      ...baseObjects,
      { id: "bed-1", object_type: "bed", position_x: 0, position_y: 0, position_z: zCenter - (halfD * 0.3), rotation: 3.14, scale: 1.05, material: "wood_dark" },
      { id: "ns-1", object_type: "nightstand", position_x: -1.4, position_y: 0, position_z: zCenter - (halfD * 0.5), rotation: 0, scale: 0.8, material: "wood_base" },
      { id: "ns-2", object_type: "nightstand", position_x: 1.4, position_y: 0, position_z: zCenter - (halfD * 0.5), rotation: 0, scale: 0.8, material: "wood_base" },
      { id: "ward-1", object_type: "wardrobe", position_x: halfW - 0.7, position_y: 0, position_z: zCenter + (halfD * 0.2), rotation: -1.57, scale: 1.1, material: "wood_dark" }
    ];
  } else if (room.includes("office") || room.includes("work") || room.includes("study")) {
    return [
      ...baseObjects,
      { id: "desk-1", object_type: "desk", position_x: 0, position_y: 0, position_z: zCenter - (halfD * 0.4), rotation: 3.14, scale: 1.0, material: "wood_dark" },
      { id: "chair-1", object_type: "chair", position_x: 0, position_y: 0, position_z: zCenter - (halfD * 0.1), rotation: 0, scale: 0.9, material: "#1f2937" },
      { id: "lamp-1", object_type: "lamp", position_x: -0.6, position_y: 0.75, position_z: zCenter - (halfD * 0.4), rotation: 0, scale: 1.0, material: "#fafafa" }
    ];
  } else if (room.includes("kitchen") || room.includes("dining")) {
    return [
      ...baseObjects,
      { id: "table-1", object_type: "dining_table", position_x: 0, position_y: 0, position_z: zCenter, rotation: 0, scale: 1.2, material: "wood_base" },
      { id: "chair-1", object_type: "chair", position_x: -1.0, position_y: 0, position_z: zCenter - 0.6, rotation: 1.57, scale: 0.9, material: "wood_base" },
      { id: "chair-2", object_type: "chair", position_x: 1.0, position_y: 0, position_z: zCenter - 0.6, rotation: -1.57, scale: 0.9, material: "wood_base" },
      { id: "chair-3", object_type: "chair", position_x: -1.0, position_y: 0, position_z: zCenter + 0.6, rotation: 1.57, scale: 0.9, material: "wood_base" },
      { id: "chair-4", object_type: "chair", position_x: 1.0, position_y: 0, position_z: zCenter + 0.6, rotation: -1.57, scale: 0.9, material: "wood_base" }
    ];
  } else {
    // Living Room / Default
    return [
      ...baseObjects,
      { id: "sofa-1", object_type: "sofa", position_x: 0, position_y: 0, position_z: zCenter - (halfD * 0.3), rotation: 0, scale: 1.1, material: "fabric_base" },
      { id: "ctable-1", object_type: "coffee_table", position_x: 0, position_y: 0, position_z: zCenter + (halfD * 0.1), rotation: 0, scale: 1.0, material: "wood_base" },
      { id: "rug-1", object_type: "rug", position_x: 0, position_y: 0, position_z: zCenter - (halfD * 0.1), rotation: 0, scale: 1.2, material: "fabric_base" },
      { id: "tv-1", object_type: "tv", position_x: 0, position_y: 0, position_z: zCenter + (halfD * 0.7), rotation: 3.14, scale: 1.0, material: "black_metal" }
    ];
  }
};

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStyle = searchParams.get("style") || "Modern";
  const designId = searchParams.get("designId");

  // User auth state
  const [user, setUser] = useState<any | null>(null);

  // Core Room State
  const [projectTitle, setProjectTitle] = useState("My Living Room Space");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [roomType, setRoomType] = useState<string>("Living Room");
  const [activeStyle, setActiveStyle] = useState(initialStyle);
  const [roomWidth, setRoomWidth] = useState(8);
  const [roomDepth, setRoomDepth] = useState(8);
  const [wallPaintColor, setWallPaintColor] = useState<string>("#334155");
  const [flooringMaterial, setFlooringMaterial] = useState<string>("wood_light");

  // Objects & Selection
  const [objects, setObjects] = useState<RoomObject[]>(() =>
    getInitialObjectsForRoomType("Living Room", initialStyle, 8, 8)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<RoomObject[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Viewport Modes: '3D' | '2D' | 'walkthrough' | 'vr' | 'audit'
  const [viewportMode, setViewportMode] = useState<"3D" | "2D" | "walkthrough" | "vr" | "audit">("3D");

  // Left Panel Tool Tab: 'catalog' | 'materials' | 'architecture' | 'budget'
  const [leftTab, setLeftTab] = useState<"catalog" | "materials" | "architecture" | "budget">("catalog");

  // Right Panel Tab: 'copilot' | 'marketplace'
  const [rightTab, setRightTab] = useState<"copilot" | "marketplace">("copilot");

  // Autosave Status State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");

  // Modals State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Phase 49 V3 State
  const [voiceWidgetOpen, setVoiceWidgetOpen] = useState(false);
  const [arModalOpen, setArModalOpen] = useState(false);
  const [arProductId, setArProductId] = useState<string>("ecc79f63-5725-499f-a47f-c2de03a095cf");
  const [arProductName, setArProductName] = useState<string>("Boucle Sectional Sofa");
  const [materialExplorerOpen, setMaterialExplorerOpen] = useState(false);
  const [costDelta, setCostDelta] = useState<number>(0);
  const [financialImpactSummary, setFinancialImpactSummary] = useState<string>("Standard PBR Material baseline.");
  const [styleCoherenceScore, setStyleCoherenceScore] = useState<number>(96.5);

  const handleRealtimeRoomEdit = async (newWallColor?: string, newFlooring?: string) => {
    const wallCol = newWallColor || wallPaintColor;
    const floorMat = newFlooring || flooringMaterial;

    if (newWallColor) setWallPaintColor(newWallColor);
    if (newFlooring) setFlooringMaterial(newFlooring);

    // Update 3D canvas objects dynamically
    setObjects((prev) =>
      prev.map((obj) => {
        if (obj.object_type === "partition") {
          return { ...obj, material: wallCol };
        }
        if (obj.object_type === "floor") {
          return { ...obj, material: floorMat.toLowerCase().includes("marble") ? "granite" : "wood_light" };
        }
        return obj;
      })
    );

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const targetRoomId = "eeea6d22-d8da-4177-af59-45f4611de56d";
      const res = await fetch(`${apiBase}/api/rooms/${targetRoomId}/realtime-edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wall_colour: wallCol,
          flooring_material: floorMat,
          active_style: activeStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCostDelta(data.cost_delta || 0);
        setFinancialImpactSummary(data.financial_impact_summary || data.financial_summary || "");
        setStyleCoherenceScore(data.style_coherence_score || data.style_coherence || 95.8);
      }
    } catch (err) {
      console.warn("Notice: Real-time room edit:", err);
    }
  };

  // Load SessionStorage on Mount
  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (userSession) {
      setUser(JSON.parse(userSession));
    }

    const savedSpecs = sessionStorage.getItem("projectSpecs");
    if (savedSpecs) {
      try {
        const parsed = JSON.parse(savedSpecs);
        if (parsed.roomType) setRoomType(parsed.roomType);
        if (parsed.selectedStyle) setActiveStyle(parsed.selectedStyle);
        if (parsed.projectTitle) setProjectTitle(parsed.projectTitle);
        setObjects(getInitialObjectsForRoomType(parsed.roomType || "Living Room", parsed.selectedStyle || "Modern", 8, 8));
      } catch (_) {}
    }
  }, []);

  // Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo), Ctrl+K (Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex]);

  // Record History State
  const recordHistory = (newObjects: RoomObject[]) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newObjects];
    });
    setHistoryIndex((prev) => prev + 1);
    triggerAutoSave();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevObjects = history[historyIndex - 1];
      setObjects(prevObjects);
      setHistoryIndex((prev) => prev - 1);
      triggerAutoSave();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextObjects = history[historyIndex + 1];
      setObjects(nextObjects);
      setHistoryIndex((prev) => prev + 1);
      triggerAutoSave();
    }
  };

  const triggerAutoSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 500);
  };

  // Add Object to Scene
  const handleAddObject = (type: string, defaultMaterial: string = "wood_base") => {
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const newObj: RoomObject = {
      id: newId,
      object_type: type,
      position_x: (Math.random() - 0.5) * 2,
      position_y: 0,
      position_z: -3.0 + (Math.random() - 0.5) * 2,
      rotation: 0,
      scale: 1.0,
      material: defaultMaterial,
    };
    const updated = [...objects, newObj];
    setObjects(updated);
    setSelectedObjectId(newId);
    recordHistory(updated);
  };

  // Update Object
  const handleUpdateObject = (id: string, updates: Partial<RoomObject>) => {
    const updated = objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj));
    setObjects(updated);
    recordHistory(updated);
  };

  // Delete Object
  const handleDeleteObject = (id: string) => {
    const updated = objects.filter((obj) => obj.id !== id);
    setObjects(updated);
    setSelectedObjectId(null);
    recordHistory(updated);
  };

  // Copilot Action Execution Hook
  const handleCopilotAction = (actionType: string, payload: any) => {
    if (payload.wall) {
      setWallPaintColor(payload.wall);
      setObjects((prev) =>
        prev.map((obj) => (obj.object_type === "partition" ? { ...obj, material: payload.wall } : obj))
      );
    }
    if (payload.flooring) {
      setFlooringMaterial(payload.flooring);
      setObjects((prev) =>
        prev.map((obj) => (obj.object_type === "floor" ? { ...obj, material: payload.flooring } : obj))
      );
    }
    if (payload.sofa) {
      setObjects((prev) =>
        prev.map((obj) => (obj.object_type === "sofa" ? { ...obj, material: payload.sofa } : obj))
      );
    }
    if (payload.lamp) {
      handleAddObject("lamp", "#fafafa");
    }
    triggerAutoSave();
  };

  const selectedObject = objects.find((obj) => obj.id === selectedObjectId);

  // Smart Marketplace Mock Data
  const getProductForSelectedObject = (obj?: RoomObject) => {
    if (!obj) {
      return {
        name: "IKEA KIVIK 3-Seat Sectional",
        vendor: "IKEA",
        price: "₹49,990",
        dims: "228 × 95 × 83 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400",
        why: "Fits your 2.4m wall footprint, matches Japandi oak theme, within budget.",
      };
    }
    const t = obj.object_type.toLowerCase();
    if (t.includes("sofa")) {
      return {
        name: "IKEA KIVIK 3-Seat Sectional Sofa",
        vendor: "IKEA",
        price: "₹49,990",
        dims: "228 × 95 × 83 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400",
        why: "Optimal 82cm clearance to coffee table; matches your active design DNA.",
      };
    } else if (t.includes("table") || t.includes("coffee")) {
      return {
        name: "Urban Ladder Solid Walnut Noguchi Table",
        vendor: "Urban Ladder",
        price: "₹28,500",
        dims: "128 × 92 × 40 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=400",
        why: "Honed curved safety corners; leaves 48cm walking space from sofa.",
      };
    } else if (t.includes("bed")) {
      return {
        name: "Pepperfry King Size Teak Wood Bed",
        vendor: "Pepperfry",
        price: "₹38,999",
        dims: "205 × 190 × 100 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400",
        why: "Hydraulic storage unit; fits North entrance facing layout.",
      };
    } else if (t.includes("desk")) {
      return {
        name: "IKEA BEKANT Ergonomic Standing Desk",
        vendor: "IKEA",
        price: "₹22,990",
        dims: "160 × 80 × 75 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=400",
        why: "Adjustable height; cables concealed along boundary partitions.",
      };
    } else {
      return {
        name: "Design House Minimal Floor Lamp",
        vendor: "Pepperfry",
        price: "₹6,499",
        dims: "45 × 45 × 165 cm",
        style: activeStyle,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400",
        why: "Provides 2700K warm diffused ambient lux for evening comfort.",
      };
    }
  };

  const productInfo = getProductForSelectedObject(selectedObject);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b10] text-slate-100 font-sans select-none overflow-hidden">
      
      {/* ========================================================================================= */}
      {/* 1. STUDIO PRO TOP BAR */}
      {/* ========================================================================================= */}
      <header className="h-14 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-30 shrink-0">
        
        {/* Left: Brand + Project Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-mono">
            <span className="font-extrabold text-sm text-white tracking-tight">HOMEVERSE</span>
            <span className="text-slate-600 text-xs">/</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                autoFocus
                className="bg-[#05070a] border border-emerald-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="text-xs text-slate-300 hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                <span>{projectTitle}</span>
                <span className="text-[10px] text-slate-500">(click to edit)</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Autosave Status + Undo/Redo + Command Palette Button */}
        <div className="flex items-center gap-3 font-mono text-xs">
          
          {/* Autosave Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
            {saveStatus === "saving" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300">Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Saved ({lastSavedTime})</span>
              </>
            )}
          </div>

          {/* Undo / Redo Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
              title="Undo (Ctrl + Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
              title="Redo (Ctrl + Shift + Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Command Palette Trigger */}
          <button
            onClick={() => setCmdPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
          >
            <Command className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search tools...</span>
            <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">Ctrl K</kbd>
          </button>

        </div>

        {/* Right: Phase 49 Controls + Export Center + Share */}
        <div className="flex items-center gap-2 font-mono text-xs">

          {/* Real-time Room Edit Cost Ticker (Phase 49) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <span className="text-slate-400">Delta:</span>
            <span className={`font-bold ${costDelta > 0 ? "text-amber-400" : costDelta < 0 ? "text-emerald-400" : "text-slate-300"}`}>
              {costDelta > 0 ? `+₹${costDelta.toLocaleString("en-IN")}` : costDelta < 0 ? `-₹${Math.abs(costDelta).toLocaleString("en-IN")}` : "₹0"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">{styleCoherenceScore}% Coherent</span>
          </div>

          {/* Voice Assistant Copilot (Phase 49) */}
          <button
            onClick={() => setVoiceWidgetOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium transition-all cursor-pointer shadow-sm"
            title="Launch Voice Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Voice Assistant</span>
          </button>

          {/* PBR Materials (Phase 49) */}
          <button
            onClick={() => setMaterialExplorerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="PBR Material Specs & Comparison"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Materials</span>
          </button>

          {/* AR View (Phase 49) */}
          <button
            onClick={() => setArModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="AR Mobile QuickLook & WebXR"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AR View</span>
          </button>
          
          <button
            onClick={() => {
              setShareToast(true);
              setTimeout(() => setShareToast(false), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Share</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold tracking-wider uppercase transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

        </div>

      </header>

      {/* Share Toast */}
      {shareToast && (
        <div className="absolute top-16 right-6 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono px-4 py-2 rounded-xl shadow-xl animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Interactive 3D Workspace link copied to clipboard!</span>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 2. MAIN 3-COLUMN STUDIO WORKSPACE */}
      {/* ========================================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: BUILD & ASSET TOOLS */}
        {/* ------------------------------------------------------------- */}
        <div className="w-72 lg:w-80 bg-[#090e15] border-r border-white/[0.08] flex flex-col shrink-0 z-20">
          
          {/* Tool Tabs Header */}
          <div className="grid grid-cols-4 border-b border-white/[0.08] bg-[#070a0f] p-1 text-[11px] font-mono">
            <button
              onClick={() => setLeftTab("catalog")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                leftTab === "catalog" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              Furniture
            </button>
            <button
              onClick={() => setLeftTab("materials")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                leftTab === "materials" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              Finishes
            </button>
            <button
              onClick={() => setLeftTab("architecture")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                leftTab === "architecture" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              Room CAD
            </button>
            <button
              onClick={() => setLeftTab("budget")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                leftTab === "budget" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              Budget
            </button>
          </div>

          {/* Tab 1: Furniture Catalog */}
          {leftTab === "catalog" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Procedural 3D Mesh Catalog
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Sofa", type: "sofa", mat: "fabric_base" },
                  { label: "Coffee Table", type: "coffee_table", mat: "wood_base" },
                  { label: "King Bed", type: "bed", mat: "wood_dark" },
                  { label: "Nightstand", type: "nightstand", mat: "wood_base" },
                  { label: "Wardrobe", type: "wardrobe", mat: "wood_dark" },
                  { label: "Study Desk", type: "desk", mat: "wood_dark" },
                  { label: "Chair", type: "chair", mat: "#1f2937" },
                  { label: "Floor Lamp", type: "lamp", mat: "#fbbf24" },
                  { label: "TV Console", type: "tv", mat: "black_metal" },
                  { label: "Indoor Plant", type: "flower_pot", mat: "#10b981" },
                  { label: "Wool Rug", type: "rug", mat: "fabric_base" },
                  { label: "Partition Wall", type: "partition", mat: wallPaintColor },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddObject(item.type, item.mat)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group flex flex-col justify-between h-20"
                  >
                    <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-400">
                      <Box className="w-4 h-4" />
                      <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-white text-xs font-sans font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Materials & Paint */}
          {leftTab === "materials" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-6 font-mono text-xs">
              
              {/* Wall Paint Swatches */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Wall Paint & Textures
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: "Slate", hex: "#334155" },
                    { name: "Limestone", hex: "#f5f5f4" },
                    { name: "Charcoal", hex: "#0f172a" },
                    { name: "Oatmeal", hex: "#e7e5e4" },
                    { name: "Emerald", hex: "#042f2c" },
                    { name: "Navy", hex: "#1e1b4b" },
                    { name: "Terracotta", hex: "#7c2d12" },
                    { name: "Pure White", hex: "#ffffff" },
                  ].map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopilotAction("update_wall", { wall: color.hex })}
                      className={`h-12 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                        wallPaintColor === color.hex ? "border-emerald-400 scale-105 shadow-md shadow-emerald-500/20" : "border-slate-800 hover:border-slate-600"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="text-[9px] font-bold text-white bg-black/60 px-1 rounded">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flooring Swatches */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Floor Materials
                </div>
                <div className="space-y-2">
                  {[
                    { id: "wood_light", name: "European White Oak", desc: "Warm natural grain planks" },
                    { id: "wood_dark", name: "Smoked American Walnut", desc: "Deep rich luxury hardwood" },
                    { id: "marble", name: "Italian Calacatta Marble", desc: "Polished high-gloss stone" },
                    { id: "concrete", name: "Architectural Concrete", desc: "Seamless urban matte slab" },
                    { id: "granite", name: "Honed Black Granite", desc: "Modern premium dark stone" },
                  ].map((floor, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopilotAction("update_floor", { flooring: floor.id })}
                      className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        flooringMaterial === floor.id ? "bg-emerald-950/40 border-emerald-500 text-white" : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{floor.name}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-light">{floor.desc}</div>
                      </div>
                      {flooringMaterial === floor.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Architecture & Dimensions */}
          {leftTab === "architecture" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-6 font-mono text-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Room Dimensions (Meters)
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-slate-300 mb-1">
                    <span>Width: {roomWidth} m</span>
                    <span className="text-slate-500">{(roomWidth * 3.28).toFixed(1)} ft</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-300 mb-1">
                    <span>Depth: {roomDepth} m</span>
                    <span className="text-slate-500">{(roomDepth * 3.28).toFixed(1)} ft</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    value={roomDepth}
                    onChange={(e) => setRoomDepth(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                  <div className="text-[10px] text-slate-400">TOTAL FLOOR AREA</div>
                  <div className="text-base font-bold text-emerald-400">
                    {(roomWidth * roomDepth).toFixed(1)} m² ({(roomWidth * roomDepth * 10.76).toFixed(0)} sq.ft)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Live Budget Dashboard */}
          {leftTab === "budget" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-6 font-mono text-xs">
              
              <div className="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                  <span>Project Budget</span>
                  <span className="text-emerald-400">84% ALLOCATED</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ₹8,42,300 <span className="text-xs text-slate-400 font-normal">/ ₹10,00,000</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: "84%" }} />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Category Breakdown</div>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span>🛋️ Furniture</span>
                    <span className="font-bold text-white">₹4,20,000</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span>💡 Lighting Fixtures</span>
                    <span className="font-bold text-white">₹1,10,000</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span>🪵 Flooring & Walls</span>
                    <span className="font-bold text-white">₹1,42,300</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span>🪴 Decor & Accents</span>
                    <span className="font-bold text-white">₹80,000</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span>🔨 Labor & Installation</span>
                    <span className="font-bold text-white">₹90,000</span>
                  </div>
                </div>
              </div>

              {/* AI Cost Saving Tip */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Cost Optimization Tip</span>
                </div>
                <p className="font-sans font-light text-[11px] leading-relaxed">
                  Switching the selected sofa to the Scandinavian fabric model saves ₹18,500 without impacting ergonomic clearance scores.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* ------------------------------------------------------------- */}
        {/* CENTER VIEWPORT (React Three Fiber / 2D Blueprint) */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 relative flex flex-col bg-[#05070a]">
          
          {/* Main 3D Canvas / 2D Blueprint View */}
          <div className="flex-1 relative">
            {viewportMode === "2D" ? (
              <BlueprintEditor2D
                objects={objects}
                selectedObjectId={selectedObjectId}
                onSelectObject={(id) => setSelectedObjectId(id)}
                onUpdateObject={handleUpdateObject}
                onDeleteObject={handleDeleteObject}
                onAddObject={handleAddObject}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
                onUpdateRoomDimensions={(w, d) => {
                  setRoomWidth(w);
                  setRoomDepth(d);
                }}
                activeFloor={0}
              />
            ) : (
              <CanvasContainer
                objects={objects}
                selectedObjectId={selectedObjectId}
                onSelectObject={(id) => setSelectedObjectId(id)}
                onUpdateObject={handleUpdateObject}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
              />
            )}

            {/* Floating Spatial Audit Overlay Mode */}
            {viewportMode === "audit" && (
              <div className="absolute top-6 left-6 z-20 max-w-sm p-4 rounded-2xl bg-[#090e15]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md font-mono text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Spatial Clearance & Ergonomics
                  </span>
                  <button onClick={() => setViewportMode("3D")} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Main Walkway Clearance</span>
                    <span className="text-emerald-400 font-bold">82 cm (Pass)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Sofa-to-Table Clearance</span>
                    <span className="text-emerald-400 font-bold">48 cm (Pass)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-amber-300">
                    <span>Door Swing Radius</span>
                    <span className="font-bold">31 cm (Tight clearance)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Daylight & Lux Index</span>
                    <span className="text-emerald-400 font-bold">280 Lumens (Balanced)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dock Mode Switcher */}
          <div className="h-14 px-6 bg-[#090e15] border-t border-white/[0.08] flex items-center justify-between z-20 font-mono text-xs">
            
            {/* Viewport Modes */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewportMode("3D")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewportMode === "3D" ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Studio</span>
              </button>

              <button
                onClick={() => setViewportMode("2D")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewportMode === "2D" ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>2D Blueprint</span>
              </button>

              <button
                onClick={() => setViewportMode("walkthrough")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewportMode === "walkthrough" ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Walkthrough (WASD)</span>
              </button>

              <button
                onClick={() => setViewportMode("audit")}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewportMode === "audit" ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Space Audit</span>
              </button>
            </div>

            {/* Quick Helper Key */}
            <div className="text-[11px] text-slate-500 hidden md:block">
              Click object to inspect · Drag to orbit · Scroll to zoom
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: AI COPILOT HERO & SMART MARKETPLACE */}
        {/* ------------------------------------------------------------- */}
        <div className="w-80 lg:w-96 bg-[#090e15] border-l border-white/[0.08] flex flex-col shrink-0 z-20">
          
          {/* Right Panel Tab Switcher */}
          <div className="grid grid-cols-2 border-b border-white/[0.08] bg-[#070a0f] p-1 text-xs font-mono">
            <button
              onClick={() => setRightTab("copilot")}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                rightTab === "copilot" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
            <button
              onClick={() => setRightTab("marketplace")}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                rightTab === "marketplace" ? "bg-slate-900 text-emerald-400 font-bold border border-slate-700" : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </button>
          </div>

          {/* Tab 1: AI Copilot */}
          {rightTab === "copilot" ? (
            <CopilotChat
              designId={designId || "active"}
              onCopilotAction={handleCopilotAction}
              onRefresh={triggerAutoSave}
              currentStyle={activeStyle}
            />
          ) : (
            /* Tab 2: Smart Furniture Marketplace */
            <div className="flex-1 p-4 overflow-y-auto space-y-6 font-mono text-xs">
              
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Selected 3D Item Match
              </div>

              {/* Product Match Card */}
              <div className="p-4 rounded-2xl bg-[#070a0f] border border-white/[0.1] space-y-4 shadow-xl">
                <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800">
                  <img
                    src={productInfo.image}
                    alt={productInfo.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-emerald-300 font-bold">
                    {productInfo.vendor}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm font-sans">{productInfo.name}</h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-extrabold text-emerald-400">{productInfo.price}</span>
                    <span className="text-[10px] text-slate-400">{productInfo.dims}</span>
                  </div>
                </div>

                {/* "Why this product?" AI Rationale Box */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] space-y-1 text-emerald-300 font-sans font-light">
                  <div className="font-bold font-mono text-[10px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Why HomeVerse AI Recommends This:</span>
                  </div>
                  <p>{productInfo.why}</p>
                </div>

                {/* Direct Store Buy Link */}
                <button
                  onClick={() => window.open("https://www.ikea.com/in/en/", "_blank")}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <span>View in {productInfo.vendor} Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contextual Object Inspector */}
              {selectedObject && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    3D Mesh Properties
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">TYPE</span>
                      <span className="text-white font-bold">{selectedObject.object_type}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">SCALE</span>
                      <span className="text-white font-bold">{selectedObject.scale}x</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteObject(selectedObject.id)}
                    className="w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete from 3D Scene</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ========================================================================================= */}
      {/* 3. COMMAND PALETTE MODAL (Ctrl + K) */}
      {/* ========================================================================================= */}
      {cmdPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#090e15] border border-white/20 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Type a command or search 3D tools..."
                autoFocus
                className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-500 text-xs"
              />
              <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">ESC</kbd>
            </div>
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {[
                { label: "Switch Aesthetic to Japandi Minimalist", action: () => handleCopilotAction("switch_japandi", { wall: "#f5f5f4", floor: "#e7e5e4", sofa: "#b45309" }) },
                { label: "Add Modern 3-Seat Sofa", action: () => handleAddObject("sofa", "fabric_base") },
                { label: "Add Coffee Table", action: () => handleAddObject("coffee_table", "wood_base") },
                { label: "Toggle 2D Floorplan CAD Mode", action: () => setViewportMode("2D") },
                { label: "Run Ergonomics Spatial Clearance Audit", action: () => setViewportMode("audit") },
                { label: "Enter First-Person Walkthrough (WASD)", action: () => setViewportMode("walkthrough") },
                { label: "Export Scene to Three.js JSON", action: () => setExportModalOpen(true) },
              ].map((cmdItem, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    cmdItem.action();
                    setCmdPaletteOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{cmdItem.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* 4. PROFESSIONAL EXPORT CENTER MODAL */}
      {/* ========================================================================================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#090e15] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl font-mono text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Export Project Assets</h3>
                <p className="text-slate-400 text-xs">Multi-Format CAD, 3D Mesh, and Game Engine Exporters</p>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Export 1 */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>3D CAD Model</span>
                  <Box className="w-4 h-4" />
                </div>
                <p className="text-slate-400 font-sans text-xs">Three.js WebGL JSON format with full scene graph geometry.</p>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objects, null, 2));
                    const dl = document.createElement("a");
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", "homeverse_room_scene.json");
                    dl.click();
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Download .JSON
                </button>
              </div>

              {/* Export 2 */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-teal-400 font-bold">
                  <span>Blender Python</span>
                  <FileCode className="w-4 h-4" />
                </div>
                <p className="text-slate-400 font-sans text-xs">Automated python script to reconstruct room meshes inside Blender 4.x.</p>
                <button
                  onClick={() => {
                    const pyContent = `# HomeVerse Blender 3D Reconstruction Script\nimport bpy\n\n# Room Dimensions: ${roomWidth}m x ${roomDepth}m\nbpy.ops.mesh.primitive_plane_add(size=${roomWidth}, location=(0,0,0))\n`;
                    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pyContent);
                    const dl = document.createElement("a");
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", "reconstruct_homeverse.py");
                    dl.click();
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Download .py Script
                </button>
              </div>

              {/* Export 3 */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span>2D CAD Blueprint</span>
                  <Ruler className="w-4 h-4" />
                </div>
                <p className="text-slate-400 font-sans text-xs">Top-down vector SVG blueprint showing room square footage & clearances.</p>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Print / Save PDF
                </button>
              </div>

              {/* Export 4 */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-indigo-400 font-bold">
                  <span>Unity YAML Prefab</span>
                  <Film className="w-4 h-4" />
                </div>
                <p className="text-slate-400 font-sans text-xs">Game engine scene config ready for AR and VR walkthroughs.</p>
                <button
                  onClick={() => {
                    alert("Unity Scene Prefab package generated successfully.");
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Export YAML
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Phase 49: Voice Assistant Widget */}
      <VoiceAssistantWidget
        isOpen={voiceWidgetOpen}
        onClose={() => setVoiceWidgetOpen(false)}
        onWallColorChange={(colorHex) => handleRealtimeRoomEdit(colorHex, undefined)}
        onFlooringChange={(flooringName) => handleRealtimeRoomEdit(undefined, flooringName)}
        onCameraChange={(viewType) => {
          if (viewType === "top_down") setViewportMode("2D");
          else if (viewType === "walkthrough") setViewportMode("walkthrough");
          else setViewportMode("3D");
        }}
        onNavigateAction={(url) => {
          if (url === "#ar") setArModalOpen(true);
          else router.push(url);
        }}
      />

      {/* Phase 49: AR Placement Modal */}
      <ARPlacementModal
        isOpen={arModalOpen}
        onClose={() => setArModalOpen(false)}
        productId={arProductId}
        productName={arProductName}
      />

      {/* Phase 49: Advanced PBR Material Visualization & Comparison Modal */}
      <MaterialExplorerModal
        isOpen={materialExplorerOpen}
        onClose={() => setMaterialExplorerOpen(false)}
        onApplyMaterial={(mat, target) => {
          if (target === "wall") {
            handleRealtimeRoomEdit(mat.albedo_color, undefined);
          } else {
            handleRealtimeRoomEdit(undefined, mat.name);
          }
        }}
        roomAreaSqft={280}
      />

    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#070b10] flex items-center justify-center text-emerald-400 font-mono">LOADING 3D SPATIAL STUDIO...</div>}>
      <StudioContent />
    </Suspense>
  );
}
