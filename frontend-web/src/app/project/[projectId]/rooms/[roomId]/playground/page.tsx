"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Layers,
  Box,
  Eye,
  DollarSign,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  Compass,
  Ruler,
  Pencil,
  Check,
  X,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

import CanvasContainer from "@/components/playground/CanvasContainer";
import ObjectPropertiesPanel from "@/components/playground/ObjectPropertiesPanel";
import CopilotChat from "@/components/playground/CopilotChat";
import BlueprintEditor2D from "@/components/playground/BlueprintEditor2D";
import MaterialExplorerModal from "@/components/playground/MaterialExplorerModal";
import ARPlacementModal from "@/components/playground/ARPlacementModal";
import VRPanoramaModal from "@/components/playground/VRPanoramaModal";
import VoiceAssistantWidget from "@/components/playground/VoiceAssistantWidget";
import RoomPhotosDrawer from "@/components/playground/RoomPhotosDrawer";
import RoomRendersViewer from "@/components/playground/RoomRendersViewer";
import DimensionEditModal from "@/components/playground/DimensionEditModal";

import { formatIndianBudget } from "@/lib/utils";
import { roomApi } from "@/lib/rooms";
import { budgetApi } from "@/lib/budgets";
import {
  getStoredProject,
  getStoredProjectRooms,
  getStoredProjectAllocations,
  updateStoredRoom,
  StoredRoomPhoto,
} from "@/lib/projectStorage";

export default function RoomPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const roomId = params.roomId as string;

  const [activeTab, setActiveTab] = useState<"3d" | "2d" | "renders">("3d");
  const [selectedObject, setSelectedObject] = useState<any | null>(null);

  // Room identification & custom name
  const [currentRoomId, setCurrentRoomId] = useState<string>(roomId);
  const [roomName, setRoomName] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRooms = getStoredProjectRooms(projectId);
      const matched = storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
      if (matched) return matched.name;
    }
    return "Room";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState("");

  // CAD Room Dimensions
  const [roomDimensions, setRoomDimensions] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRooms = getStoredProjectRooms(projectId);
      const matched = storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
      if (matched) {
        const w = matched.width_meters ?? 5.5;
        const l = matched.length_meters ?? 6.5;
        const sqm = matched.area_sqm ?? Number((w * l).toFixed(2));
        return {
          width: w,
          length: l,
          areaSqm: sqm,
          areaSqft: Math.round(sqm * 10.7639),
        };
      }
    }
    return { width: 5.5, length: 6.5, areaSqm: 35.75, areaSqft: 385 };
  });

  // Project Style DNA
  const [designStyle, setDesignStyle] = useState(() => {
    if (typeof window !== "undefined") {
      const proj = getStoredProject(projectId);
      if (proj && proj.design_style) return proj.design_style;
    }
    return "Japandi";
  });

  // Floor Info
  const [floorName, setFloorName] = useState("Ground Floor");

  // Room Photos from Intake Step
  const [roomPhotos, setRoomPhotos] = useState<StoredRoomPhoto[]>(() => {
    if (typeof window !== "undefined") {
      const proj = getStoredProject(projectId);
      if (proj && proj.room_photos) return proj.room_photos;
    }
    return [];
  });

  // Financial OS Guardrails
  const [roomBudget, setRoomBudget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const allocations = getStoredProjectAllocations(projectId);
      const matched =
        allocations.find((a) => a.room_id === roomId || a.room_name === roomName) ||
        allocations[0];
      if (matched && typeof matched.allocated_amount === "number") return matched.allocated_amount;
    }
    return 350000;
  });
  const [spentAmount, setSpentAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const allocations = getStoredProjectAllocations(projectId);
      const matched =
        allocations.find((a) => a.room_id === roomId || a.room_name === roomName) ||
        allocations[0];
      if (matched && typeof matched.spent_amount === "number") return matched.spent_amount;
    }
    return 315000;
  });
  const [budgetFlexibility, setBudgetFlexibility] = useState("Moderate");

  // Modals & Panels
  const [isDimensionModalOpen, setIsDimensionModalOpen] = useState(false);
  const [isPhotosDrawerOpen, setIsPhotosDrawerOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isVRModalOpen, setIsVRModalOpen] = useState(false);

  // Budget Delta Alert State (e.g. "+₹35,000" notification)
  const [deltaNotification, setDeltaNotification] = useState<{
    amount: number;
    description: string;
    newTotal: number;
    cheaperAlt?: string;
  } | null>(null);

  // Load and synchronize authentic data from local storage & backend
  useEffect(() => {
    async function loadData() {
      try {
        const storedRooms = getStoredProjectRooms(projectId);
        const matched =
          storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
        if (matched) {
          setRoomName(matched.name);
          setCurrentRoomId(matched.id || roomId);
          const w = matched.width_meters ?? 5.5;
          const l = matched.length_meters ?? 6.5;
          const sqm = matched.area_sqm ?? Number((w * l).toFixed(2));
          setRoomDimensions({
            width: w,
            length: l,
            areaSqm: sqm,
            areaSqft: Math.round(sqm * 10.7639),
          });

          // Floor information
          if (matched.floor_id?.includes("2") || matched.floor_id?.includes("f-2")) {
            setFloorName("Level 2 • First Floor");
          } else {
            setFloorName("Level 1 • Ground Floor");
          }
        }

        const proj = getStoredProject(projectId);
        if (proj) {
          if (proj.design_style) setDesignStyle(proj.design_style);
          if (proj.budget_flexibility) setBudgetFlexibility(proj.budget_flexibility);
          if (proj.room_photos) setRoomPhotos(proj.room_photos);
        }

        const allocations = await budgetApi.getBudgetAllocations(projectId).catch(() => []);
        const match =
          allocations.find((a) => a.room_id === roomId || a.room_name === matched?.name) ||
          allocations[0];
        if (match) {
          setRoomBudget(match.allocated_amount || 350000);
          setSpentAmount(
            match.spent_amount ?? Math.round((match.allocated_amount || 350000) * 0.9)
          );
        } else {
          const storedAllocs = getStoredProjectAllocations(projectId);
          const storedMatch =
            storedAllocs.find((a) => a.room_id === roomId || a.room_name === matched?.name) ||
            storedAllocs[0];
          if (storedMatch) {
            setRoomBudget(storedMatch.allocated_amount || 350000);
            setSpentAmount(
              storedMatch.spent_amount ?? Math.round((storedMatch.allocated_amount || 350000) * 0.9)
            );
          }
        }

        const budgetData = await budgetApi.getProjectBudget(projectId).catch(() => null);
        if (budgetData?.flexibility) {
          setBudgetFlexibility(budgetData.flexibility);
        }
      } catch (_) {
        // Fallback from storage
        const storedRooms = getStoredProjectRooms(projectId);
        const matched =
          storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
        if (matched) {
          setRoomName(matched.name);
          setCurrentRoomId(matched.id || roomId);
        }
      }
    }
    loadData();
  }, [projectId, roomId]);

  // Handle Room Renaming with two-way persistence
  const handleSaveRename = async () => {
    if (!editedRoomName.trim()) {
      setIsEditingName(false);
      return;
    }
    const newName = editedRoomName.trim();
    setRoomName(newName);
    setIsEditingName(false);

    // Persist to storage
    updateStoredRoom(projectId, currentRoomId, {
      custom_name: newName,
      name: newName,
    });

    // Attempt backend sync
    try {
      await roomApi.updateRoom(currentRoomId, { name: newName });
    } catch (err) {
      console.warn("Backend room rename skipped or offline, stored locally:", err);
    }
  };

  // Handle Room CAD Dimensions update
  const handleUpdateDimensions = (newWidth: number, newLength: number) => {
    const w = Number(newWidth.toFixed(2));
    const l = Number(newLength.toFixed(2));
    const sqm = Number((w * l).toFixed(2));
    const sqft = Math.round(sqm * 10.7639);

    setRoomDimensions({
      width: w,
      length: l,
      areaSqm: sqm,
      areaSqft: sqft,
    });

    // Persist to project storage
    updateStoredRoom(projectId, currentRoomId, {
      width_meters: w,
      length_meters: l,
      area_sqm: sqm,
    });
  };

  // Handle AI Copilot Action & Budget Delta calculation
  const handleCopilotAction = (actionType: string, payload: any) => {
    let delta = 0;
    let desc = "";
    let alt = undefined;

    if (actionType === "make_cozy" || payload?.sofa) {
      delta = 18500;
      desc = "Upgraded to Italian Bouclé Seating & Warm LED Track";
      alt = "Consider standard woven linen to save ₹12,000";
    } else if (actionType === "add_wood") {
      delta = 24000;
      desc = "Natural White Oak Parquet & Handcrafted Walnut Table";
      alt = "Consider engineered veneer oak to save ₹16,000";
    } else if (actionType === "reduce_budget") {
      delta = -18500;
      desc = "Switched to IKEA LINANÄS durable fabric";
    } else if (actionType === "update_material") {
      delta = 12000;
      desc = `Synchronized ${designStyle} PBR architectural surface`;
    } else {
      delta = 8500;
      desc = "Custom spatial reconfiguration";
    }

    const updatedSpent = spentAmount + delta;
    setSpentAmount(updatedSpent);

    setDeltaNotification({
      amount: delta,
      description: desc,
      newTotal: updatedSpent,
      cheaperAlt: alt,
    });

    setTimeout(() => {
      setDeltaNotification(null);
    }, 8000);
  };

  const remaining = roomBudget - spentAmount;
  const isOverBudget = remaining < 0;

  return (
    <div className="h-screen w-screen bg-[#070b10] text-slate-100 font-sans flex flex-col overflow-hidden select-none">
      {/* Top Floating Header */}
      <header className="h-14 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-30 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}/rooms/${roomId}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
            title="Back to Room Details"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
          </Link>

          {/* Room Name with Inline Edit */}
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedRoomName}
                    onChange={(e) => setEditedRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 border border-emerald-500 rounded-lg text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="p-1 rounded-md bg-emerald-500 text-slate-950 cursor-pointer"
                    title="Save"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1 rounded-md bg-slate-800 text-slate-400 cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    {roomName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedRoomName(roomName);
                      setIsEditingName(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-emerald-400 p-0.5 rounded text-slate-400 transition-opacity cursor-pointer"
                    title="Rename room"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                PLAYGROUND
              </span>

              <span className="hidden xl:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {floorName}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>Parametric Three.js CAD Viewport</span>
            </div>
          </div>
        </div>

        {/* Style DNA & CAD Dimensions Badges */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Style DNA Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{designStyle} DNA</span>
          </div>

          {/* CAD Dimensions Button / Modal Trigger */}
          <button
            onClick={() => setIsDimensionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
            title="Adjust CAD Room Dimensions"
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {roomDimensions.width}m × {roomDimensions.length}m ({roomDimensions.areaSqm} m²)
            </span>
          </button>
        </div>

        {/* Live Budget Guardrail Tracker */}
        <div className="hidden 2xl:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Allocated:</span>
            <span className="text-white font-bold">{formatIndianBudget(roomBudget)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Cost:</span>
            <span className={`font-bold ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`}>
              {formatIndianBudget(spentAmount)}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Remaining:</span>
            <span className={`font-bold ${isOverBudget ? "text-rose-400" : "text-teal-400"}`}>
              {formatIndianBudget(remaining)}
            </span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 uppercase">
            {budgetFlexibility}
          </span>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex items-center gap-2">
          {/* Main View Mode: 3D / 2D / AI Renders */}
          <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "3d"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D View</span>
            </button>
            <button
              onClick={() => setActiveTab("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "2d"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Plan</span>
            </button>
            <button
              onClick={() => setActiveTab("renders")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "renders"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300" />
              <span>AI Renders</span>
            </button>
          </div>

          {/* Intake Photos Reference Drawer Trigger */}
          <button
            onClick={() => setIsPhotosDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Inspect captured intake room photos"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Photos ({roomPhotos.length})</span>
          </button>

          {/* Materials Modal Trigger */}
          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Materials</span>
          </button>

          {/* AR Trigger */}
          <button
            onClick={() => setIsARModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>AR</span>
          </button>

          {/* Walkthrough Link */}
          <Link
            href={`/project/${projectId}/walkthrough`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Whole House Walkthrough"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </header>

      {/* Budget Delta Notification Banner */}
      {deltaNotification && (
        <div className="bg-[#090e15] border-b border-emerald-500/40 px-6 py-2.5 flex items-center justify-between text-xs font-mono text-slate-200 z-20 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div
              className={`p-1 rounded-md ${
                deltaNotification.amount >= 0
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {deltaNotification.amount >= 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="font-bold text-white">{deltaNotification.description}: </span>
              <span
                className={
                  deltaNotification.amount >= 0
                    ? "text-amber-400 font-bold"
                    : "text-emerald-400 font-bold"
                }
              >
                {deltaNotification.amount >= 0
                  ? `+₹${deltaNotification.amount.toLocaleString()}`
                  : `-₹${Math.abs(deltaNotification.amount).toLocaleString()}`}
              </span>
              <span className="text-slate-400 ml-2">
                (New Room Total: {formatIndianBudget(deltaNotification.newTotal)})
              </span>
              {deltaNotification.cheaperAlt && (
                <span className="text-emerald-400 ml-3 italic">
                  💡 {deltaNotification.cheaperAlt}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setDeltaNotification(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Split: Center Viewport | Properties Panel | Copilot Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center: 3D Viewport OR 2D Blueprint OR Photorealistic AI Renders */}
        <div className="flex-1 relative h-full">
          {activeTab === "3d" ? (
            <CanvasContainer
              roomWidth={roomDimensions.width}
              roomDepth={roomDimensions.length}
              onSelectObject={(obj) => setSelectedObject(obj)}
              onCopilotAction={handleCopilotAction}
            />
          ) : activeTab === "2d" ? (
            <BlueprintEditor2D
              roomWidth={roomDimensions.width}
              roomDepth={roomDimensions.length}
              onUpdateRoomDimensions={handleUpdateDimensions}
              onObjectSelect={(obj) => setSelectedObject(obj)}
            />
          ) : (
            <RoomRendersViewer
              roomName={roomName}
              designStyle={designStyle}
              roomWidth={roomDimensions.width}
              roomDepth={roomDimensions.length}
              roomBudget={roomBudget}
              intakePhotos={roomPhotos}
              onApplyPaletteTo3D={(mat) =>
                handleCopilotAction("update_material", { material: mat })
              }
              onSwitchTo3D={() => setActiveTab("3d")}
            />
          )}

          {/* Floating Voice Assistant Widget (in 3D/2D views) */}
          {activeTab !== "renders" && (
            <div className="absolute bottom-6 left-6 z-20">
              <VoiceAssistantWidget
                onVoiceCommand={(cmd) => handleCopilotAction("voice_cmd", { prompt: cmd })}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Copilot Chat & Object Properties */}
        <div className="w-80 md:w-96 h-full flex flex-col border-l border-white/[0.08] bg-[#090e15] z-10 shrink-0">
          {selectedObject ? (
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-white/[0.08] flex items-center justify-between bg-[#070b10]">
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Properties Inspector
                </span>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ObjectPropertiesPanel
                  selectedObject={selectedObject}
                  onUpdate={(updated) => setSelectedObject(updated)}
                />
              </div>
            </div>
          ) : (
            <CopilotChat
              designId={currentRoomId}
              currentStyle={designStyle}
              onCopilotAction={handleCopilotAction}
            />
          )}
        </div>
      </div>

      {/* Parametric Dimension Adjuster Modal */}
      {isDimensionModalOpen && (
        <DimensionEditModal
          isOpen={isDimensionModalOpen}
          onClose={() => setIsDimensionModalOpen(false)}
          roomName={roomName}
          initialWidth={roomDimensions.width}
          initialLength={roomDimensions.length}
          onSave={handleUpdateDimensions}
        />
      )}

      {/* Intake Room Photos Reference Slide-over Drawer */}
      <RoomPhotosDrawer
        isOpen={isPhotosDrawerOpen}
        onClose={() => setIsPhotosDrawerOpen(false)}
        projectId={projectId}
        roomName={roomName}
        photos={roomPhotos}
        onPhotosUpdate={(updated) => setRoomPhotos(updated)}
      />

      {/* Material Modal */}
      {isMaterialModalOpen && (
        <MaterialExplorerModal
          isOpen={isMaterialModalOpen}
          onClose={() => setIsMaterialModalOpen(false)}
          onSelectMaterial={(mat) => {
            setIsMaterialModalOpen(false);
            handleCopilotAction("update_material", { material: mat });
          }}
        />
      )}

      {/* AR Modal */}
      {isARModalOpen && (
        <ARPlacementModal
          isOpen={isARModalOpen}
          onClose={() => setIsARModalOpen(false)}
        />
      )}

      {/* VR Modal */}
      {isVRModalOpen && (
        <VRPanoramaModal
          isOpen={isVRModalOpen}
          onClose={() => setIsVRModalOpen(false)}
        />
      )}
    </div>
  );
}
