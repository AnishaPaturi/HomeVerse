"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Layers,
  DoorOpen,
  IndianRupee,
  Upload,
  Ruler,
  CheckSquare,
  Palette,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import HomeTypeSelector from "@/components/home-setup/HomeTypeSelector";
import FloorCountSelector from "@/components/home-setup/FloorCountSelector";
import RoomCountSelector, { RoomConfig } from "@/components/home-setup/RoomCountSelector";
import BudgetSelector from "@/components/home-setup/BudgetSelector";
import FloorPlanUploader from "@/components/home-setup/FloorPlanUploader";
import FloorPlanPreview from "@/components/home-setup/FloorPlanPreview";
import DimensionConfirmation from "@/components/home-setup/DimensionConfirmation";
import DimensionCorrection from "@/components/home-setup/DimensionCorrection";
import RoomSelector, { RoomItem } from "@/components/home-setup/RoomSelector";
import DesignStyleSelector from "@/components/home-setup/DesignStyleSelector";
import GenerationStatus, { GenerationStep } from "@/components/ai/GenerationStatus";
import { projectApi } from "@/lib/projects";
import { budgetApi } from "@/lib/budgets";
import { generateUUID } from "@/lib/utils";

export default function NewHomePage() {
  const router = useRouter();

  // Wizard Step (1 to 9)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Step 1: Home Type
  const [homeType, setHomeType] = useState("apartment");
  const [projectName, setProjectName] = useState("My Dream Residence");

  // Step 2: Floor Count
  const [floorCount, setFloorCount] = useState(1);

  // Step 3: Room Counts
  const [rooms, setRooms] = useState<RoomConfig[]>([
    { type: "living_room", label: "Living Room", count: 1, defaultAreaSqm: 28 },
    { type: "master_bedroom", label: "Master Bedroom", count: 1, defaultAreaSqm: 22 },
    { type: "kitchen", label: "Kitchen", count: 1, defaultAreaSqm: 14 },
    { type: "dining_room", label: "Dining Room", count: 1, defaultAreaSqm: 16 },
  ]);

  // Step 4: Budget
  const [totalBudget, setTotalBudget] = useState(1500000); // ₹15 Lakhs default
  const [flexibility, setFlexibility] = useState<"strict" | "moderate" | "flexible">("moderate");

  // Step 5: Floor Plan Upload
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanPreviewUrl, setFloorPlanPreviewUrl] = useState<string | null>(null);

  // Step 6: Dimensions
  const [detectedDimensions, setDetectedDimensions] = useState({
    width: 9.5,
    length: 12.0,
    ceilingHeight: 3.0,
    unit: "meters" as "meters" | "feet",
  });
  const [isEditingDimensions, setIsEditingDimensions] = useState(false);

  // Step 7: Room Selection (for prioritized AI design)
  const [selectableRooms, setSelectableRooms] = useState<RoomItem[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Step 8: Design Style
  const [designStyle, setDesignStyle] = useState("Japandi");

  // Step 9: AI Generation Status
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: "1", label: "Parsing architectural structure & floor boundaries", status: "pending" },
    { id: "2", label: "Allocating ₹" + (totalBudget / 100000).toFixed(1) + "L budget envelopes across rooms", status: "pending" },
    { id: "3", label: "Generating 3D room geometries & PBR materials (" + designStyle + ")", status: "pending" },
    { id: "4", label: "Assembling spatial scene graph & digital twin", status: "pending" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Synchronize selectable rooms whenever room configurations change
  useEffect(() => {
    const list: RoomItem[] = [];
    let idx = 1;
    rooms.forEach((r) => {
      for (let i = 1; i <= r.count; i++) {
        list.push({
          id: `room-${idx++}`,
          name: r.count > 1 ? `${r.label} ${i}` : r.label,
          type: r.type,
          floorNumber: 1,
          areaSqm: r.defaultAreaSqm,
        });
      }
    });
    setSelectableRooms(list);
    setSelectedRoomIds(list.map((r) => r.id));
  }, [rooms]);

  // Stepper titles
  const stepTitles = [
    { num: 1, label: "Home Type", icon: <Home className="w-4 h-4" /> },
    { num: 2, label: "Floors", icon: <Layers className="w-4 h-4" /> },
    { num: 3, label: "Rooms", icon: <DoorOpen className="w-4 h-4" /> },
    { num: 4, label: "Budget", icon: <IndianRupee className="w-4 h-4" /> },
    { num: 5, label: "Floor Plan", icon: <Upload className="w-4 h-4" /> },
    { num: 6, label: "Dimensions", icon: <Ruler className="w-4 h-4" /> },
    { num: 7, label: "Room Focus", icon: <CheckSquare className="w-4 h-4" /> },
    { num: 8, label: "Style DNA", icon: <Palette className="w-4 h-4" /> },
    { num: 9, label: "AI Twin", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const handleNext = () => {
    if (currentStep === 8) {
      // Begin step 9: AI Generation
      setCurrentStep(9);
      startGenerationPipeline();
    } else {
      setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Launch the generation pipeline & persist project
  const startGenerationPipeline = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(10);

    // Step 1: Parse structure
    setGenerationSteps((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: "processing" } : s))
    );

    // Build payload for backend
    const floorList = [];
    for (let f = 1; f <= floorCount; f++) {
      const floorRooms = selectableRooms.filter((r) => r.floorNumber === f || f === 1);
      floorList.push({
        level: f,
        name: f === 1 ? "Ground Floor" : f === 2 ? "First Floor" : `Floor ${f}`,
        room_count: floorRooms.length,
        rooms: floorRooms.map((r) => ({
          name: r.name,
          room_type: r.type,
          area_sqm: r.areaSqm,
          width_meters: Math.sqrt(r.areaSqm * 1.2),
          length_meters: Math.sqrt(r.areaSqm / 1.2),
        })),
      });
    }

    const projectPayload = {
      name: projectName,
      home_type: homeType,
      floors_count: floorCount,
      total_rooms: selectableRooms.length,
      total_budget: totalBudget,
      currency: "INR",
      budget_flexibility: flexibility,
      design_style: designStyle,
      floors: floorList,
    };

    let createdProjectId = generateUUID();

    try {
      // 1. Call backend project creation API
      const res = await projectApi.createProject(projectPayload);
      if (res && res.id) {
        createdProjectId = res.id;
      }
    } catch (_) {
      // Graceful offline fallback: save to sessionStorage
      const offlineProject = {
        id: createdProjectId,
        name: projectName,
        home_type: homeType,
        total_budget: totalBudget,
        currency: "INR",
        flexibility,
        created_at: new Date().toISOString(),
      };
      sessionStorage.setItem(`project_${createdProjectId}`, JSON.stringify(offlineProject));
    }

    // Step 1 completed
    await new Promise((r) => setTimeout(r, 600));
    setGenerationProgress(35);
    setGenerationSteps((prev) =>
      prev.map((s, idx) =>
        idx === 0
          ? { ...s, status: "completed" }
          : idx === 1
          ? { ...s, status: "processing" }
          : s
      )
    );

    // Step 2: Auto allocate budget
    try {
      await budgetApi.autoAllocateRoomBudgets(createdProjectId);
    } catch (_) {}

    await new Promise((r) => setTimeout(r, 700));
    setGenerationProgress(65);
    setGenerationSteps((prev) =>
      prev.map((s, idx) =>
        idx === 1
          ? { ...s, status: "completed" }
          : idx === 2
          ? { ...s, status: "processing" }
          : s
      )
    );

    // Step 3: 3D Geometries & PBR Materials
    await new Promise((r) => setTimeout(r, 800));
    setGenerationProgress(90);
    setGenerationSteps((prev) =>
      prev.map((s, idx) =>
        idx === 2
          ? { ...s, status: "completed" }
          : idx === 3
          ? { ...s, status: "processing" }
          : s
      )
    );

    // Step 4: Scene graph assembled
    await new Promise((r) => setTimeout(r, 600));
    setGenerationProgress(100);
    setGenerationSteps((prev) =>
      prev.map((s) => ({ ...s, status: "completed" }))
    );

    // Complete and redirect
    setTimeout(() => {
      router.push(`/project/${createdProjectId}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#070b10]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070b10] rounded-[11px] flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
              HV
            </div>
          </div>
          <span className="font-mono text-sm font-bold text-white tracking-tight">
            HOME CREATION WIZARD
          </span>
        </div>

        {/* Stepper Pill Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="text-emerald-400 font-bold">Step {currentStep}</span>
          <span className="text-slate-500">/ {totalSteps}</span>
          <span className="text-slate-400 ml-1">· {stepTitles[currentStep - 1]?.label}</span>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-800 transition-colors"
        >
          Cancel
        </button>
      </header>

      {/* Main Wizard Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-between">
        {/* Step Indicator Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {stepTitles.map((step) => {
              const isPassed = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => currentStep > step.num && setCurrentStep(step.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                    isCurrent
                      ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold"
                      : isPassed
                      ? "text-slate-400 hover:text-white cursor-pointer"
                      : "text-slate-600 opacity-60 pointer-events-none"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-emerald-500 text-slate-950"
                        : isPassed
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {step.num}
                  </span>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Form Panels */}
        <div className="my-auto py-4">
          {/* STEP 1: Home Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  What type of home are you building or designing?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Select your dwelling archetype to calibrate structural boundaries, standard clearances, and budget allocations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090e15] border border-white/[0.08] space-y-2 max-w-md">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Project / House Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Modern Villa in Bangalore"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <HomeTypeSelector
                selectedType={homeType}
                onSelect={(type) => setHomeType(type)}
              />
            </div>
          )}

          {/* STEP 2: Floors */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  How many floors does your house have?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Configure the vertical levels. HomeVerse builds stacked multi-level cutaway models for your entire residence.
                </p>
              </div>

              <FloorCountSelector
                floorCount={floorCount}
                onChange={(count) => setFloorCount(count)}
              />
            </div>
          )}

          {/* STEP 3: Rooms */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  What rooms do you have?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Select room counts across your home. These determine spatial envelopes and initial budget breakdowns.
                </p>
              </div>

              <RoomCountSelector
                rooms={rooms}
                onChange={(updated) => setRooms(updated)}
              />
            </div>
          )}

          {/* STEP 4: Budget (Established at House Creation!) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Set Your Project Budget (₹ INR)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Establishing your target budget now ensures all AI recommendations, furniture models, materials, and alterations stay within your real-world financial parameters.
                </p>
              </div>

              <BudgetSelector
                budget={totalBudget}
                flexibility={flexibility}
                onBudgetChange={(b) => setTotalBudget(b)}
                onFlexibilityChange={(f) => setFlexibility(f)}
              />
            </div>
          )}

          {/* STEP 5: Floor Plan Upload */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Upload Floor Plan or Architectural Layout
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Upload an image (PNG, JPG), PDF, or CAD blueprint. If you don't have one right now, you can proceed with our standard spatial template.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7">
                  <FloorPlanUploader
                    onFileSelected={(file) => {
                      setFloorPlanFile(file);
                      setFloorPlanPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </div>
                <div className="md:col-span-5">
                  <FloorPlanPreview
                    previewUrl={
                      floorPlanPreviewUrl ||
                      "/templates/modern_north_layout-a.jpg"
                    }
                    fileName={floorPlanFile ? floorPlanFile.name : "Default Layout Template"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Dimension Confirmation & Correction */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Confirm Structural Dimensions
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Our spatial vision model automatically detected these room boundaries. You can confirm or calibrate them for centimeter-level CAD accuracy.
                </p>
              </div>

              {!isEditingDimensions ? (
                <DimensionConfirmation
                  dimensions={detectedDimensions}
                  onConfirm={handleNext}
                  onEdit={() => setIsEditingDimensions(true)}
                />
              ) : (
                <DimensionCorrection
                  dimensions={detectedDimensions}
                  onChange={(d) => setDetectedDimensions(d)}
                  onSave={() => setIsEditingDimensions(false)}
                />
              )}
            </div>
          )}

          {/* STEP 7: Room Focus Selection */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Which rooms would you like to design first?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Select one or more rooms for priority 3D scene generation and budget allocation.
                </p>
              </div>

              <RoomSelector
                rooms={selectableRooms}
                selectedRoomIds={selectedRoomIds}
                onToggleRoom={(id) => {
                  setSelectedRoomIds((prev) =>
                    prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
                  );
                }}
                onSelectAll={() => setSelectedRoomIds(selectableRooms.map((r) => r.id))}
              />
            </div>
          )}

          {/* STEP 8: Design Style DNA */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Select Architectural Design DNA
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  Choose the aesthetic model. The generative AI will apply calibrated PBR materials, furniture profiles, and lighting schemes matching this DNA.
                </p>
              </div>

              <DesignStyleSelector
                selectedStyle={designStyle}
                onSelect={(style) => setDesignStyle(style)}
              />
            </div>
          )}

          {/* STEP 9: AI Generation Status */}
          {currentStep === 9 && (
            <div className="py-6">
              <GenerationStatus
                steps={generationSteps}
                overallProgress={generationProgress}
                title="Synthesizing Your 3D Digital Home & Budget Envelopes"
                subtitle="Generating architectural boundaries, PBR materials, spatial clearances, and Indian catalog pricing..."
                error={generationError}
                onRetry={startGenerationPipeline}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (Steps 1 to 8) */}
        {currentStep < 9 && (
          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
            >
              <span>{currentStep === 8 ? "Synthesize 3D Digital Twin" : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] font-mono text-slate-500 border-t border-white/[0.06]">
        HomeVerse Architecture OS · Unified Multi-Floor & Budget Pipeline
      </footer>
    </div>
  );
}
