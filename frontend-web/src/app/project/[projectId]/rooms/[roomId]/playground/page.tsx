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
} from "lucide-react";

import CanvasContainer from "@/components/playground/CanvasContainer";
import ObjectPropertiesPanel from "@/components/playground/ObjectPropertiesPanel";
import CopilotChat from "@/components/playground/CopilotChat";
import BlueprintEditor2D from "@/components/playground/BlueprintEditor2D";
import MaterialExplorerModal from "@/components/playground/MaterialExplorerModal";
import ARPlacementModal from "@/components/playground/ARPlacementModal";
import VRPanoramaModal from "@/components/playground/VRPanoramaModal";
import VoiceAssistantWidget from "@/components/playground/VoiceAssistantWidget";
import { formatIndianBudget } from "@/lib/utils";
import { roomApi } from "@/lib/rooms";
import { budgetApi } from "@/lib/budgets";
import {
  getStoredProject,
  getStoredProjectRooms,
  getStoredProjectAllocations,
} from "@/lib/projectStorage";

export default function RoomPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const roomId = params.roomId as string;

  const [activeTab, setActiveTab] = useState<"3d" | "2d">("3d");
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [roomName, setRoomName] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRooms = getStoredProjectRooms(projectId);
      const matched = storedRooms.find((r) => r.id === roomId || r.name === roomId);
      if (matched) return matched.name;
    }
    return "Room";
  });
  const [roomBudget, setRoomBudget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const allocations = getStoredProjectAllocations(projectId);
      const matched = allocations.find((a) => a.room_id === roomId);
      if (matched && typeof matched.allocated_amount === "number") return matched.allocated_amount;
    }
    return 350000;
  });
  const [spentAmount, setSpentAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const allocations = getStoredProjectAllocations(projectId);
      const matched = allocations.find((a) => a.room_id === roomId);
      if (matched && typeof matched.spent_amount === "number") return matched.spent_amount;
    }
    return 315000;
  });
  const [budgetFlexibility, setBudgetFlexibility] = useState("Moderate");

  // Modals
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

  useEffect(() => {
    async function loadData() {
      try {
        const roomData = await roomApi.getRoom(roomId);
        if (roomData) setRoomName(roomData.name);
        else {
          const storedRooms = getStoredProjectRooms(projectId);
          const matched = storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
          if (matched) setRoomName(matched.name);
        }

        const budgetData = await budgetApi.getProjectBudget(projectId);
        if (budgetData) {
          setBudgetFlexibility(budgetData.flexibility || "Moderate");
        } else {
          const proj = getStoredProject(projectId);
          if (proj) setBudgetFlexibility(proj.budget_flexibility || "Moderate");
        }

        const allocations = await budgetApi.getBudgetAllocations(projectId);
        const match = allocations.find((a) => a.room_id === roomId);
        if (match) {
          setRoomBudget(match.allocated_amount || 350000);
          setSpentAmount(match.spent_amount ?? Math.round((match.allocated_amount || 350000) * 0.9));
        } else {
          const storedAllocs = getStoredProjectAllocations(projectId);
          const storedMatch = storedAllocs.find((a) => a.room_id === roomId) || storedAllocs[0];
          if (storedMatch) {
            setRoomBudget(storedMatch.allocated_amount || 350000);
            setSpentAmount(storedMatch.spent_amount ?? Math.round((storedMatch.allocated_amount || 350000) * 0.9));
          }
        }
      } catch (_) {
        const storedRooms = getStoredProjectRooms(projectId);
        const matched = storedRooms.find((r) => r.id === roomId || r.name === roomId) || storedRooms[0];
        if (matched) setRoomName(matched.name);

        const proj = getStoredProject(projectId);
        if (proj) setBudgetFlexibility(proj.budget_flexibility || "Moderate");

        const storedAllocs = getStoredProjectAllocations(projectId);
        const storedMatch = storedAllocs.find((a) => a.room_id === roomId) || storedAllocs[0];
        if (storedMatch) {
          setRoomBudget(storedMatch.allocated_amount || 350000);
          setSpentAmount(storedMatch.spent_amount ?? Math.round((storedMatch.allocated_amount || 350000) * 0.9));
        }
      }
    }
    loadData();
  }, [projectId, roomId]);

  // Handle AI Copilot Action & Budget Delta calculation
  const handleCopilotAction = (actionType: string, payload: any) => {
    // Calculate cost delta based on prompt
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

    // Auto dismiss after 8 seconds
    setTimeout(() => {
      setDeltaNotification(null);
    }, 8000);
  };

  const remaining = roomBudget - spentAmount;
  const isOverBudget = remaining < 0;

  return (
    <div className="h-screen w-screen bg-[#070b10] text-slate-100 font-sans flex flex-col overflow-hidden select-none">
      {/* Top Floating Header */}
      <header className="h-14 px-4 bg-[#090e15] border-b border-white/[0.08] flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}/rooms/${roomId}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
            title="Back to Room Details"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                {roomName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                PLAYGROUND
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Live Three.js CAD Viewport
            </div>
          </div>
        </div>

        {/* Live Budget Guardrail Tracker */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Room Allocated:</span>
            <span className="text-white font-bold">{formatIndianBudget(roomBudget)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Current Cost:</span>
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
          <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab("3d")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "3d" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setActiveTab("2d")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "2d" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              2D Plan
            </button>
          </div>

          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <span>Materials</span>
          </button>

          <button
            onClick={() => setIsARModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          >
            <span>AR</span>
          </button>

          <Link
            href={`/project/${projectId}/walkthrough`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
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
            <div className={`p-1 rounded-md ${deltaNotification.amount >= 0 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
              {deltaNotification.amount >= 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-white">{deltaNotification.description}: </span>
              <span className={deltaNotification.amount >= 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                {deltaNotification.amount >= 0 ? `+₹${deltaNotification.amount.toLocaleString()}` : `-₹${Math.abs(deltaNotification.amount).toLocaleString()}`}
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

      {/* Main Workspace Split: Canvas | Properties Panel | Copilot Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center: 3D Viewport or 2D Blueprint */}
        <div className="flex-1 relative h-full">
          {activeTab === "3d" ? (
            <CanvasContainer
              onSelectObject={(obj) => setSelectedObject(obj)}
              onCopilotAction={handleCopilotAction}
            />
          ) : (
            <BlueprintEditor2D
              onObjectSelect={(obj) => setSelectedObject(obj)}
            />
          )}

          {/* Floating Voice Assistant Widget */}
          <div className="absolute bottom-6 left-6 z-20">
            <VoiceAssistantWidget
              onVoiceCommand={(cmd) => handleCopilotAction("voice_cmd", { prompt: cmd })}
            />
          </div>
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
              designId={roomId}
              onCopilotAction={handleCopilotAction}
            />
          )}
        </div>
      </div>

      {/* Modals */}
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

      {isARModalOpen && (
        <ARPlacementModal
          isOpen={isARModalOpen}
          onClose={() => setIsARModalOpen(false)}
        />
      )}

      {isVRModalOpen && (
        <VRPanoramaModal
          isOpen={isVRModalOpen}
          onClose={() => setIsVRModalOpen(false)}
        />
      )}
    </div>
  );
}
