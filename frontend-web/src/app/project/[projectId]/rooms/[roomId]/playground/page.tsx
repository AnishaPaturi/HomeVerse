"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Sun,
  ChevronLeft,
  ChevronRight,
  SplitSquareVertical,
  Sliders,
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
import { RealRoomPhotoHUD } from "@/components/playground/RealRoomPhotoHUD";
import {
  UnifiedSceneState,
  ActionProposal,
  getStylePreset,
} from "@/lib/playgroundOrchestrator";

import { formatIndianBudget } from "@/lib/utils";
import { roomApi } from "@/lib/rooms";
import { budgetApi } from "@/lib/budgets";
import { getStoredHomeCreationDraft } from "@/lib/questionnaireStorage";
import {
  getStoredProject,
  getStoredProjectRooms,
  getStoredProjectAllocations,
  updateStoredRoom,
  StoredRoomPhoto,
} from "@/lib/projectStorage";
import { getDefaultFurnitureForRoom, RoomObject } from "@/lib/defaultRoomDesigns";

function RoomPlaygroundContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const roomId = params.roomId as string;

  const tabQuery = (searchParams.get("tab") || searchParams.get("view")) as "3d" | "2d" | "renders" | null;
  const [activeTab, setActiveTab] = useState<"3d" | "2d" | "renders">(() => {
    if (tabQuery === "2d" || tabQuery === "3d" || tabQuery === "renders") {
      return tabQuery;
    }
    return "3d";
  });

  useEffect(() => {
    const tab = (searchParams.get("tab") || searchParams.get("view")) as "3d" | "2d" | "renders" | null;
    if (tab === "2d" || tab === "3d" || tab === "renders") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);

  // Room identification & custom name
  const [currentRoomId, setCurrentRoomId] = useState<string>(roomId);
  const [roomName, setRoomName] = useState<string>("Room");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState("");

  // CAD Room Dimensions
  const [roomDimensions, setRoomDimensions] = useState({
    width: 5.5,
    length: 6.5,
    areaSqm: 35.75,
    areaSqft: 385,
  });

  // Project Style DNA
  const [designStyle, setDesignStyle] = useState<string>("Japandi");

  // Designed furniture objects for fully designed room experience
  const [roomObjects, setRoomObjects] = useState<RoomObject[]>(() => {
    return getDefaultFurnitureForRoom(
      "Room",
      "bedroom",
      5.5,
      6.5,
      "Japandi"
    );
  });

  useEffect(() => {
    setRoomObjects((prev) => {
      if (prev.length > 0) return prev;
      return getDefaultFurnitureForRoom(
        roomName,
        "bedroom",
        roomDimensions.width,
        roomDimensions.length,
        designStyle
      );
    });
  }, [roomName, roomDimensions.width, roomDimensions.length, designStyle]);

  // Floor Info
  const [floorName, setFloorName] = useState("Ground Floor");

  // Room Photos from Intake Step (Step 10)
  const [roomPhotos, setRoomPhotos] = useState<StoredRoomPhoto[]>([
    {
      id: "ref-intake-1",
      url: "/rooms/empty-room.png",
      source: "intake",
      label: "Step 10 Intake Photo (Default Reference)",
      timestamp: "Step 10 Baseline",
    },
  ]);

  // Step 10 Real Room Photo Reflection & Projection State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showPhotoOnWall, setShowPhotoOnWall] = useState(true);
  const [showPhotoOnFloor, setShowPhotoOnFloor] = useState(true);
  const [photoOpacity, setPhotoOpacity] = useState(0.85);
  const [compareMode, setCompareMode] = useState<"hidden" | "pip" | "split">("pip");

  const activePhoto = roomPhotos[activePhotoIdx] || roomPhotos[0];
  const activePhotoUrl = activePhoto?.url || null;

  // 3D Viewport Lighting Preset
  const [lightingPreset, setLightingPreset] = useState<"warm" | "neutral" | "luxury">("warm");

  // Financial OS Guardrails
  const [roomBudget, setRoomBudget] = useState<number>(350000);
  const [spentAmount, setSpentAmount] = useState<number>(315000);
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

  // Shared AI Orchestrator: Unified Scene State (Single Source of Truth)
  const [sharedSceneState, setSharedSceneState] = useState<UnifiedSceneState>(() => {
    const defaultPreset = getStylePreset("Japandi");
    return {
      style: "Japandi",
      walls: {
        color: defaultPreset.wallColor,
        material: defaultPreset.wallMaterial,
        name: defaultPreset.wallName,
      },
      flooring: {
        material: defaultPreset.floorMaterial,
        name: defaultPreset.floorName,
        costDelta: defaultPreset.floorCostDelta,
      },
      lighting: {
        preset: defaultPreset.lightingPreset,
        intensity: 0.8,
      },
      camera: {
        view: "3d",
      },
      budget: {
        totalBudget: 350000,
        spentAmount: 315000,
        remaining: 35000,
        currency: "INR",
      },
      actionHistory: [],
    };
  });

  const [externalSpeechEvent, setExternalSpeechEvent] = useState<{
    id: string;
    text: string;
    source?: "copilot" | "system";
  } | null>(null);

  const [incomingProposalTrigger, setIncomingProposalTrigger] = useState<{
    prompt: string;
    proposal: ActionProposal;
    timestamp: number;
  } | null>(null);

  // Load and synchronize authentic data from local storage & backend
  useEffect(() => {
    async function loadData() {
      try {
        const proj = getStoredProject(projectId);
        const resolvedStyle = proj?.design_style || "Japandi";
        if (proj) {
          if (proj.design_style) setDesignStyle(proj.design_style);
          if (proj.budget_flexibility) setBudgetFlexibility(proj.budget_flexibility);
          if (proj.room_photos && proj.room_photos.length > 0) {
            setRoomPhotos(proj.room_photos);
          } else {
            const draft = getStoredHomeCreationDraft();
            if (draft?.roomPhotos && draft.roomPhotos.length > 0) {
              setRoomPhotos(draft.roomPhotos);
            }
          }
        }

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

          if (matched.objects && matched.objects.length > 0) {
            setRoomObjects(matched.objects);
          } else {
            setRoomObjects(
              getDefaultFurnitureForRoom(
                matched.name,
                "bedroom",
                w,
                l,
                resolvedStyle
              )
            );
          }

          // Floor information
          if (matched.floor_id?.includes("2") || matched.floor_id?.includes("f-2")) {
            setFloorName("Level 2 • First Floor");
          } else {
            setFloorName("Level 1 • Ground Floor");
          }
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

        const preset = getStylePreset(resolvedStyle);
        const finalAlloc = match?.allocated_amount || 350000;
        const finalSpent = match?.spent_amount ?? Math.round(finalAlloc * 0.9);
        setSharedSceneState((prev) => ({
          ...prev,
          style: preset.name,
          walls: { color: preset.wallColor, material: preset.wallMaterial, name: preset.wallName },
          flooring: { material: preset.floorMaterial, name: preset.floorName, costDelta: preset.floorCostDelta },
          lighting: { preset: preset.lightingPreset, intensity: 0.8 },
          budget: {
            totalBudget: finalAlloc,
            spentAmount: finalSpent,
            remaining: finalAlloc - finalSpent,
            currency: "INR",
          },
        }));
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

  // Shared AI Orchestrator: Immediate Action Dispatcher (AURA / Live 3D Scene Controls)
  const handleApplyImmediateAction = (
    actionType: string,
    payload: any,
    summary: string,
    source: "aura" | "user" | "copilot" = "aura"
  ) => {
    if (actionType === "apply_instant_style") {
      const preset = getStylePreset(payload.styleName);
      setDesignStyle(preset.name);
      setLightingPreset(preset.lightingPreset);

      // Mutate room objects (walls, floor, furniture accents)
      setRoomObjects((prev) => {
        return prev.map((o) => {
          if (o.object_type === "wall") return { ...o, material: preset.wallColor };
          if (o.object_type === "floor") return { ...o, material: preset.floorMaterial };
          if (o.object_type.includes("sofa") || o.object_type.includes("chair")) {
            return { ...o, material: preset.furnitureMaterial };
          }
          return o;
        });
      });

      const updatedSpent = spentAmount + preset.floorCostDelta;
      setSpentAmount(updatedSpent);

      setDeltaNotification({
        amount: preset.floorCostDelta,
        description: `Switched room to ${preset.name} style`,
        newTotal: updatedSpent,
      });

      setSharedSceneState((prev) => ({
        ...prev,
        style: preset.name,
        walls: { color: preset.wallColor, material: preset.wallMaterial, name: preset.wallName },
        flooring: { material: preset.floorMaterial, name: preset.floorName, costDelta: preset.floorCostDelta },
        lighting: { preset: preset.lightingPreset, intensity: 0.8 },
        budget: {
          ...prev.budget,
          spentAmount: updatedSpent,
          remaining: prev.budget.totalBudget - updatedSpent,
        },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source,
          actionType,
          summary,
          deltaAmount: preset.floorCostDelta,
        },
        actionHistory: [
          ...prev.actionHistory,
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            source,
            actionType,
            summary,
            deltaAmount: preset.floorCostDelta,
          },
        ],
      }));
    } else if (actionType === "change_wall_color") {
      const hex = payload.color_hex;
      const name = payload.color_name || "Custom Wall Color";
      setRoomObjects((prev) => {
        const wall = prev.find((o) => o.object_type === "wall");
        if (wall) {
          return prev.map((o) => (o.id === wall.id ? { ...o, material: hex } : o));
        }
        return prev;
      });
      setSharedSceneState((prev) => ({
        ...prev,
        walls: { ...prev.walls, color: hex, name },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source,
          actionType,
          summary,
        },
      }));
    } else if (actionType === "change_flooring") {
      const mat = payload.flooring_material || payload.floorMat || "wood_light";
      const costDelta = payload.cost_impact || 0;
      setRoomObjects((prev) => {
        const floor = prev.find((o) => o.object_type === "floor");
        if (floor) {
          return prev.map((o) => (o.id === floor.id ? { ...o, material: mat } : o));
        }
        return prev;
      });
      const updatedSpent = spentAmount + costDelta;
      setSpentAmount(updatedSpent);
      if (costDelta !== 0) {
        setDeltaNotification({
          amount: costDelta,
          description: `Swapped flooring to ${mat}`,
          newTotal: updatedSpent,
        });
      }
      setSharedSceneState((prev) => ({
        ...prev,
        flooring: { ...prev.flooring, material: mat, name: mat, costDelta },
        budget: {
          ...prev.budget,
          spentAmount: updatedSpent,
          remaining: prev.budget.totalBudget - updatedSpent,
        },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source,
          actionType,
          summary,
          deltaAmount: costDelta,
        },
      }));
    } else if (actionType === "change_lighting") {
      const preset = payload.lighting_preset || "warm";
      setLightingPreset(preset);
      setSharedSceneState((prev) => ({
        ...prev,
        lighting: { ...prev.lighting, preset },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source,
          actionType,
          summary,
        },
      }));
    } else if (actionType === "switch_camera_view") {
      if (payload.view_type === "top_down") {
        setActiveTab("2d");
      } else {
        setActiveTab("3d");
      }
      setSharedSceneState((prev) => ({
        ...prev,
        camera: { view: payload.view_type === "top_down" ? "2d" : "3d" },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source,
          actionType,
          summary,
        },
      }));
    }
  };

  // Shared AI Orchestrator: Proposal Application (AI Design Copilot -> User Approval -> AURA Voice Announcement)
  const handleApplyProposal = (proposal: ActionProposal) => {
    const actionType = proposal.actionType;
    const payload = proposal.payload;
    const delta = proposal.costImpact?.delta ?? 0;

    if (actionType === "reduce_budget_15" || actionType === "reduce_budget") {
      const saving = Math.abs(delta) || Math.abs(payload?.delta) || 35000;
      const updatedSpent = Math.max(spentAmount - saving, 50000);
      setSpentAmount(updatedSpent);

      if (payload?.wallColor) {
        setRoomObjects((prev) =>
          prev.map((o) => (o.object_type === "wall" ? { ...o, material: payload.wallColor } : o))
        );
      }
      if (payload?.floorMaterial) {
        setRoomObjects((prev) =>
          prev.map((o) => (o.object_type === "floor" ? { ...o, material: payload.floorMaterial } : o))
        );
      }

      setDeltaNotification({
        amount: -saving,
        description: `15% ${sharedSceneState.style} Budget Optimization applied`,
        newTotal: updatedSpent,
      });

      setSharedSceneState((prev) => ({
        ...prev,
        budget: {
          ...prev.budget,
          spentAmount: updatedSpent,
          remaining: prev.budget.totalBudget - updatedSpent,
        },
        lastAction: {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "copilot",
          actionType,
          summary: `15% budget reduction applied (-₹${saving.toLocaleString("en-IN")})`,
          deltaAmount: -saving,
        },
        actionHistory: [
          ...prev.actionHistory,
          {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            source: "copilot",
            actionType,
            summary: `15% budget reduction applied (-₹${saving.toLocaleString("en-IN")})`,
            deltaAmount: -saving,
          },
        ],
      }));

      // Trigger AURA Voice Announcement via Web Speech Synthesis
      setExternalSpeechEvent({
        id: Date.now().toString(),
        text: `Your updated ${sharedSceneState.style} design has been applied. The estimated cost has decreased by 15%.`,
        source: "copilot",
      });
    } else if (actionType === "apply_style") {
      handleApplyImmediateAction(
        "apply_instant_style",
        payload,
        `Copilot applied ${payload.styleName} transformation`,
        "copilot"
      );
      setExternalSpeechEvent({
        id: Date.now().toString(),
        text: `Your ${payload.styleName} architectural proposal has been applied to the 3D scene.`,
        source: "copilot",
      });
    } else if (actionType === "align_photos") {
      setShowPhotoOnWall(true);
      setShowPhotoOnFloor(true);
      setLightingPreset("warm");
      setDeltaNotification({
        amount: 0,
        description: "Step 10 Real Room Photo Alignment applied",
        newTotal: spentAmount,
      });
      setExternalSpeechEvent({
        id: Date.now().toString(),
        text: "Step 10 real room photo calibration has been applied to your 3D digital twin.",
        source: "copilot",
      });
    } else {
      const updatedSpent = spentAmount + delta;
      setSpentAmount(updatedSpent);
      setDeltaNotification({
        amount: delta,
        description: proposal.title,
        newTotal: updatedSpent,
      });
      setExternalSpeechEvent({
        id: Date.now().toString(),
        text: `Your spatial proposal "${proposal.title}" has been applied.`,
        source: "copilot",
      });
    }
  };

  // Backward-compatible handleCopilotAction
  const handleCopilotAction = (actionType: string, payload: any) => {
    if (actionType === "ignored_command" || actionType === "voice_cmd_ignored" || !actionType) {
      return;
    }
    handleApplyProposal({
      id: Date.now().toString(),
      title: payload?.title || "Spatial Update",
      changes: ["Updated 3D digital twin"],
      applied: true,
      actionType,
      payload,
      costImpact: {
        before: spentAmount,
        after: spentAmount + (payload?.delta || 0),
        delta: payload?.delta || 0,
      },
    });
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
                  <span
                    suppressHydrationWarning
                    className="font-mono text-xs font-bold text-white uppercase tracking-wider"
                  >
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

              <span
                suppressHydrationWarning
                className="hidden xl:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400"
              >
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
            <span suppressHydrationWarning>{designStyle} DNA</span>
          </div>

          {/* CAD Dimensions Button / Modal Trigger */}
          <button
            onClick={() => setIsDimensionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
            title="Adjust CAD Room Dimensions"
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span suppressHydrationWarning>
              {roomDimensions.width}m × {roomDimensions.length}m ({roomDimensions.areaSqm} m²)
            </span>
          </button>
        </div>

        {/* Live Budget Guardrail Tracker */}
        <div className="hidden 2xl:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Allocated:</span>
            <span suppressHydrationWarning className="text-white font-bold">{formatIndianBudget(roomBudget)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Cost:</span>
            <span suppressHydrationWarning className={`font-bold ${isOverBudget ? "text-rose-400" : "text-emerald-400"}`}>
              {formatIndianBudget(spentAmount)}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Remaining:</span>
            <span suppressHydrationWarning className={`font-bold ${isOverBudget ? "text-rose-400" : "text-teal-400"}`}>
              {formatIndianBudget(remaining)}
            </span>
          </div>
          <span suppressHydrationWarning className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 uppercase">
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

          {/* 3D Lighting Presets Switcher */}
          {activeTab === "3d" && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Lighting:</span>
              {(["warm", "neutral", "luxury"] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLightingPreset(preset)}
                  className={`px-2 py-0.5 rounded capitalize transition-all cursor-pointer ${
                    lightingPreset === preset
                      ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Intake Photos Reference & Projection Indicator */}
          <button
            onClick={() => {
              if (compareMode === "hidden") {
                setCompareMode("pip");
              } else {
                setIsPhotosDrawerOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-xs font-mono text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm group"
            title="Inspect & Toggle Step 10 Real-Room Intake Photos"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold">Step 10 Twin ({roomPhotos.length})</span>
            <span className={`w-2 h-2 rounded-full ${showPhotoOnWall || showPhotoOnFloor ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
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
        <div className="flex-1 relative h-full flex flex-col overflow-hidden">
          {compareMode === "split" && activeTab !== "renders" ? (
            <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950">
              {/* Left Panel: Real-World Step 10 Photo Viewer */}
              <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-emerald-500/30 bg-[#070b10] flex flex-col relative select-none">
                {/* Real-World Header */}
                <div className="h-10 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-10 shrink-0">
                  <div className="flex items-center gap-2 font-mono text-xs text-white">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold uppercase tracking-wider text-[11px]">
                      Real-World As-Built (Step 10 Intake)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {activePhotoIdx + 1} / {roomPhotos.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {roomPhotos.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : roomPhotos.length - 1))}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          title="Previous photo angle"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActivePhotoIdx((prev) => (prev < roomPhotos.length - 1 ? prev + 1 : 0))}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          title="Next photo angle"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setCompareMode("pip")}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold cursor-pointer"
                    >
                      Exit Split
                    </button>
                  </div>
                </div>

                {/* Photo Frame */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activePhotoUrl || "/rooms/empty-room.png"}
                    alt={activePhoto?.label || "Step 10 Photo"}
                    className="max-h-full max-w-full object-contain rounded-xl border border-white/10 shadow-2xl"
                  />
                  <div className="absolute bottom-5 left-5 right-5 p-2.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="font-bold text-white truncate pr-2">
                      {activePhoto?.label || `${roomName} Real Capture`}
                    </span>
                    <span className="text-emerald-400 text-[10px] uppercase font-bold shrink-0">
                      Step 10 • {activePhoto?.source || "capture"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Panel: 3D CAD or 2D Blueprint */}
              <div className="w-full lg:w-1/2 h-1/2 lg:h-full relative flex flex-col">
                <div className="h-10 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-10 shrink-0">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Box className="w-3.5 h-3.5" />
                    <span>Digital Twin ({activeTab === "3d" ? "3D CAD" : "2D Blueprint"})</span>
                  </span>
                </div>
                <div className="flex-1 relative">
                  {activeTab === "3d" ? (
                    <CanvasContainer
                      objects={roomObjects}
                      selectedObjectId={selectedObject?.id || null}
                      roomWidth={roomDimensions.width}
                      roomDepth={roomDimensions.length}
                      lightingPreset={lightingPreset}
                      backgroundImageUrl={showPhotoOnFloor ? activePhotoUrl : null}
                      wallPhotoUrl={showPhotoOnWall ? activePhotoUrl : null}
                      photoOpacity={photoOpacity}
                      showPhotoOnWall={showPhotoOnWall}
                      showPhotoOnFloor={showPhotoOnFloor}
                      onSelectObject={(objId: any) => {
                        if (!objId) {
                          setSelectedObject(null);
                          return;
                        }
                        const found = typeof objId === "string" ? roomObjects.find((o) => o.id === objId) : objId;
                        setSelectedObject(found || null);
                      }}
                      onUpdateObject={(id, updates) => {
                        setRoomObjects((prev) => {
                          const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
                          updateStoredRoom(projectId, currentRoomId, { objects: updated });
                          return updated;
                        });
                        if (selectedObject?.id === id) {
                          setSelectedObject((prev: any) => (prev ? { ...prev, ...updates } : null));
                        }
                      }}
                      onCopilotAction={handleCopilotAction}
                    />
                  ) : (
                    <BlueprintEditor2D
                      objects={roomObjects}
                      roomWidth={roomDimensions.width}
                      roomDepth={roomDimensions.length}
                      backgroundImageUrl={activePhotoUrl}
                      photoOpacity={photoOpacity}
                      showPhotoBackdrop={showPhotoOnFloor}
                      onUpdateRoomDimensions={handleUpdateDimensions}
                      onObjectSelect={(obj) => setSelectedObject(obj)}
                      onUpdateObject={(id, updates) => {
                        setRoomObjects((prev) => {
                          const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
                          updateStoredRoom(projectId, currentRoomId, { objects: updated });
                          return updated;
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {activeTab === "3d" ? (
                <CanvasContainer
                  objects={roomObjects}
                  selectedObjectId={selectedObject?.id || null}
                  roomWidth={roomDimensions.width}
                  roomDepth={roomDimensions.length}
                  lightingPreset={lightingPreset}
                  backgroundImageUrl={showPhotoOnFloor ? activePhotoUrl : null}
                  wallPhotoUrl={showPhotoOnWall ? activePhotoUrl : null}
                  photoOpacity={photoOpacity}
                  showPhotoOnWall={showPhotoOnWall}
                  showPhotoOnFloor={showPhotoOnFloor}
                  onSelectObject={(objId: any) => {
                    if (!objId) {
                      setSelectedObject(null);
                      return;
                    }
                    const found = typeof objId === "string" ? roomObjects.find((o) => o.id === objId) : objId;
                    setSelectedObject(found || null);
                  }}
                  onUpdateObject={(id, updates) => {
                    setRoomObjects((prev) => {
                      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
                      updateStoredRoom(projectId, currentRoomId, { objects: updated });
                      return updated;
                    });
                    if (selectedObject?.id === id) {
                      setSelectedObject((prev: any) => (prev ? { ...prev, ...updates } : null));
                    }
                  }}
                  onCopilotAction={handleCopilotAction}
                />
              ) : activeTab === "2d" ? (
                <BlueprintEditor2D
                  objects={roomObjects}
                  roomWidth={roomDimensions.width}
                  roomDepth={roomDimensions.length}
                  backgroundImageUrl={activePhotoUrl}
                  photoOpacity={photoOpacity}
                  showPhotoBackdrop={showPhotoOnFloor}
                  onUpdateRoomDimensions={handleUpdateDimensions}
                  onObjectSelect={(obj) => setSelectedObject(obj)}
                  onUpdateObject={(id, updates) => {
                    setRoomObjects((prev) => {
                      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
                      updateStoredRoom(projectId, currentRoomId, { objects: updated });
                      return updated;
                    });
                  }}
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

              {/* Floating Real-Room Photo HUD (PIP & In-Scene Projection Controls) */}
              {activeTab !== "renders" && roomPhotos.length > 0 && (
                <RealRoomPhotoHUD
                  photos={roomPhotos}
                  activePhotoIndex={activePhotoIdx}
                  onSelectPhotoIndex={(idx) => setActivePhotoIdx(idx)}
                  showPhotoOnWall={showPhotoOnWall}
                  onTogglePhotoOnWall={(show) => setShowPhotoOnWall(show)}
                  showPhotoOnFloor={showPhotoOnFloor}
                  onTogglePhotoOnFloor={(show) => setShowPhotoOnFloor(show)}
                  photoOpacity={photoOpacity}
                  onChangePhotoOpacity={(opacity) => setPhotoOpacity(opacity)}
                  compareMode={compareMode}
                  onSetCompareMode={(mode) => setCompareMode(mode)}
                  onOpenDrawer={() => setIsPhotosDrawerOpen(true)}
                  roomName={roomName}
                />
              )}
            </div>
          )}

          {/* Floating AURA Voice Copilot (Hands & Voice Engine) */}
          {activeTab !== "renders" && (
            <div className="absolute bottom-6 left-20 z-30">
              <VoiceAssistantWidget
                sharedSceneState={sharedSceneState}
                onApplyImmediateAction={handleApplyImmediateAction}
                onTriggerProposalRequest={(prompt, proposal) => {
                  setIncomingProposalTrigger({
                    prompt,
                    proposal,
                    timestamp: Date.now(),
                  });
                }}
                externalSpeechEvent={externalSpeechEvent}
                onWallColorChange={(hex, name) => {
                  handleApplyImmediateAction("change_wall_color", { color_hex: hex, color_name: name }, `Changed wall color to ${name}`);
                }}
                onFlooringChange={(material, costDelta) => {
                  handleApplyImmediateAction("change_flooring", { flooring_material: material, cost_impact: costDelta }, `Swapped flooring to ${material}`);
                }}
                onCameraChange={(viewType) => {
                  handleApplyImmediateAction("switch_camera_view", { view_type: viewType }, `Oriented camera to ${viewType}`);
                }}
                onLightingChange={(preset) => {
                  handleApplyImmediateAction("change_lighting", { lighting_preset: preset }, `Switched lighting to ${preset}`);
                }}
                onVoiceCommand={(_cmd, isRelevant, actionType, payload) => {
                  if (!isRelevant || actionType === "ignored_command") {
                    return;
                  }
                }}
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
                  roomWidth={roomDimensions.width}
                  roomDepth={roomDimensions.length}
                  onUpdateObject={(id, updates) => {
                    setRoomObjects((prev) => {
                      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
                      updateStoredRoom(projectId, currentRoomId, { objects: updated });
                      return updated;
                    });
                    if (selectedObject?.id === id) {
                      setSelectedObject((prev: any) => (prev ? { ...prev, ...updates } : null));
                    }
                  }}
                  onDeleteObject={(id) => {
                    setRoomObjects((prev) => {
                      const updated = prev.filter((o) => o.id !== id);
                      updateStoredRoom(projectId, currentRoomId, { objects: updated });
                      return updated;
                    });
                    setSelectedObject(null);
                  }}
                  onUpdate={(updated) => setSelectedObject(updated)}
                />
              </div>
            </div>
          ) : (
            <CopilotChat
              designId={currentRoomId}
              currentStyle={designStyle}
              onCopilotAction={handleCopilotAction}
              roomPhotosCount={roomPhotos.length}
              sharedSceneState={sharedSceneState}
              onApplyProposal={handleApplyProposal}
              incomingProposalTrigger={incomingProposalTrigger}
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

export default function RoomPlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#070b10] flex items-center justify-center font-mono text-emerald-400">
          Loading Room Playground...
        </div>
      }
    >
      <RoomPlaygroundContent />
    </Suspense>
  );
}
