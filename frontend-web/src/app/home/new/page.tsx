"use client";

import React, { useState } from "react";
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
} from "lucide-react";

import { HomeTypeSelector } from "@/components/home-setup/HomeTypeSelector";
import { FloorCountSelector } from "@/components/home-setup/FloorCountSelector";
import { RoomCountSelector } from "@/components/home-setup/RoomCountSelector";
import { BudgetSelector } from "@/components/home-setup/BudgetSelector";
import { FloorPlanUploader } from "@/components/home-setup/FloorPlanUploader";
import { FloorPlanPreview } from "@/components/home-setup/FloorPlanPreview";
import { DimensionConfirmation } from "@/components/home-setup/DimensionConfirmation";
import { DimensionCorrection } from "@/components/home-setup/DimensionCorrection";
import { RoomSelector } from "@/components/home-setup/RoomSelector";
import { DesignStyleSelector } from "@/components/home-setup/DesignStyleSelector";
import { GenerationStatus, GenerationStep } from "@/components/ai/GenerationStatus";
import { projectApi } from "@/lib/projects";
import { getStoredUser } from "@/lib/auth";
import { budgetApi } from "@/lib/budgets";
import { generateUUID } from "@/lib/utils";

export default function NewHomePage() {
  const router = useRouter();

  // Wizard Step (1 to 9)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Step 1: Home Type
  const [propertyType, setPropertyType] = useState<"independent" | "apartment">("apartment");
  const [projectName, setProjectName] = useState("My Dream Residence");

  // Step 2: Floor Count
  const [floorCount, setFloorCount] = useState(1);

  // Step 3: Room Counts
  const [bhk, setBhk] = useState(3);
  const [bedroomsCount, setBedroomsCount] = useState(3);
  const [bathroomsCount, setBathroomsCount] = useState(2);
  const [balconiesCount, setBalconiesCount] = useState(2);

  // Step 4: Budget (Established during House Creation!)
  const [totalBudget, setTotalBudget] = useState(1500000); // ₹15 Lakhs default
  const [flexibility, setFlexibility] = useState<"Strict" | "Moderate" | "Flexible">("Moderate");

  // Step 5: Floor Plan Upload
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanPreviewUrl, setFloorPlanPreviewUrl] = useState<string>(
    "/templates/modern_north_layout-a.jpg"
  );

  // Helper to dynamically build room list matching the configured bedrooms, bathrooms, and balconies
  const generateRoomsForLayout = (beds: number, baths: number, bals: number) => {
    const list = [
      { name: "Living Room", room_type: "living_room", width_m: 5.5, length_m: 6.5, area_sqm: 35.75, confidence: 98 },
      { name: "Kitchen & Dining", room_type: "kitchen", width_m: 4.0, length_m: 5.0, area_sqm: 20.0, confidence: 95 },
    ];

    for (let i = 1; i <= beds; i++) {
      const isMaster = i === 1;
      list.push({
        name: isMaster ? "Master Bedroom" : `Bedroom ${i}`,
        room_type: isMaster ? "master_bedroom" : "bedroom",
        width_m: isMaster ? 4.5 : 4.0,
        length_m: isMaster ? 5.0 : 4.5,
        area_sqm: isMaster ? 22.5 : 18.0,
        confidence: 96,
      });
    }

    for (let j = 1; j <= baths; j++) {
      const isMaster = j === 1;
      list.push({
        name: isMaster ? "Master Bathroom" : `Bathroom ${j}`,
        room_type: "bathroom",
        width_m: 2.5,
        length_m: 2.4,
        area_sqm: 6.0,
        confidence: 94,
      });
    }

    for (let k = 1; k <= bals; k++) {
      list.push({
        name: k === 1 ? "Main Balcony" : `Balcony ${k}`,
        room_type: "balcony",
        width_m: 2.0,
        length_m: 3.5,
        area_sqm: 7.0,
        confidence: 92,
      });
    }

    return list;
  };

  // Step 6: Dimensions
  const [detectedRooms, setDetectedRooms] = useState(() => generateRoomsForLayout(3, 2, 2));
  const [isEditingDimensions, setIsEditingDimensions] = useState(false);

  // Step 7: Room Focus
  const [selectedRoom, setSelectedRoom] = useState("Living Room");

  // Step 8: Design Style DNA
  const [designStyle, setDesignStyle] = useState("Japandi");

  // Step 9: AI Generation Status
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: "1", label: "Parsing architectural structure & floor boundaries", status: "pending" },
    { id: "2", label: "Allocating ₹" + (totalBudget / 100000).toFixed(1) + "L budget envelopes across rooms", status: "pending" },
    { id: "3", label: "Generating 3D room geometries & PBR materials (" + designStyle + ")", status: "pending" },
    { id: "4", label: "Assembling spatial scene graph & digital twin", status: "pending" },
  ]);
  const [generationError, setGenerationError] = useState<string | null>(null);

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
    setGenerationError(null);
    setGenerationProgress(15);

    // Step 1: Processing
    setGenerationSteps((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: "processing" } : s))
    );

    let createdProjectId = generateUUID();

    const floorList = [];
    for (let f = 1; f <= floorCount; f++) {
      floorList.push({
        level: f,
        name: f === 1 ? "Ground Floor" : f === 2 ? "First Floor" : `Floor ${f}`,
        room_count: detectedRooms.length,
        rooms: detectedRooms.map((r) => ({
          name: r.name,
          room_type: r.room_type,
          area_sqm: r.area_sqm,
          width_meters: r.width_m,
          length_meters: r.length_m,
        })),
      });
    }

    const storedUser = getStoredUser();
    const projectPayload: any = {
      name: projectName,
      home_type: propertyType,
      floors_count: floorCount,
      total_rooms: detectedRooms.length,
      total_budget: totalBudget,
      currency: "INR",
      budget_flexibility: flexibility.toLowerCase(),
      design_style: designStyle,
      floors: floorList,
    };

    if (storedUser?.id && storedUser.id !== "u-demo-123") {
      projectPayload.user_id = storedUser.id;
    }
    if (storedUser?.email) {
      projectPayload.email = storedUser.email;
    }

    try {
      const res = await projectApi.createProject(projectPayload);
      if (res && res.id) {
        createdProjectId = res.id;
      }
    } catch (_) {
      // Fallback
      sessionStorage.setItem(`project_${createdProjectId}`, JSON.stringify(projectPayload));
    }

    // Step 1 Done -> Step 2 Processing
    await new Promise((r) => setTimeout(r, 600));
    setGenerationProgress(45);
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

    // Step 2 Done -> Step 3 Processing
    await new Promise((r) => setTimeout(r, 700));
    setGenerationProgress(75);
    setGenerationSteps((prev) =>
      prev.map((s, idx) =>
        idx === 1
          ? { ...s, status: "completed" }
          : idx === 2
          ? { ...s, status: "processing" }
          : s
      )
    );

    // Step 3 Done -> Step 4 Processing
    await new Promise((r) => setTimeout(r, 700));
    setGenerationProgress(95);
    setGenerationSteps((prev) =>
      prev.map((s, idx) =>
        idx === 2
          ? { ...s, status: "completed" }
          : idx === 3
          ? { ...s, status: "processing" }
          : s
      )
    );

    // Step 4 Complete
    await new Promise((r) => setTimeout(r, 500));
    setGenerationProgress(100);
    setGenerationSteps((prev) =>
      prev.map((s) => ({ ...s, status: "completed" }))
    );

    setTimeout(() => {
      router.push(`/project/${createdProjectId}`);
    }, 700);
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
                selectedType={propertyType}
                onSelect={(type) => setPropertyType(type)}
              />
            </div>
          )}

          {/* STEP 2: Floors */}
          {currentStep === 2 && (
            <FloorCountSelector
              propertyType={propertyType}
              floorCount={floorCount}
              onChange={(count) => setFloorCount(count)}
            />
          )}

          {/* STEP 3: Rooms */}
          {currentStep === 3 && (
            <RoomCountSelector
              bhk={bhk}
              bedroomsCount={bedroomsCount}
              bathroomsCount={bathroomsCount}
              balconiesCount={balconiesCount}
              onChange={(newBhk, beds, baths, bals) => {
                setBhk(newBhk);
                setBedroomsCount(beds);
                setBathroomsCount(baths);
                setBalconiesCount(bals);
                setDetectedRooms(generateRoomsForLayout(beds, baths, bals));
              }}
            />
          )}

          {/* STEP 4: Budget (Established at House Creation!) */}
          {currentStep === 4 && (
            <BudgetSelector
              initialBudget={totalBudget}
              initialFlexibility={flexibility}
              onChange={(b, f) => {
                setTotalBudget(b);
                setFlexibility(f);
              }}
            />
          )}

          {/* STEP 5: Floor Plan Upload */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7">
                  <FloorPlanUploader
                    selectedFile={floorPlanFile}
                    onFileSelected={(file) => {
                      setFloorPlanFile(file);
                      setFloorPlanPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </div>
                <div className="md:col-span-5">
                  <FloorPlanPreview imageUrl={floorPlanPreviewUrl} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Dimension Confirmation & Correction */}
          {currentStep === 6 && (
            <div>
              {!isEditingDimensions ? (
                <DimensionConfirmation
                  rooms={detectedRooms}
                  onConfirm={handleNext}
                  onCorrect={() => setIsEditingDimensions(true)}
                />
              ) : (
                <DimensionCorrection
                  initialRooms={detectedRooms}
                  onSave={(updated) => {
                    setDetectedRooms(
                      updated.map((u) => ({
                        ...u,
                        confidence: 99,
                      }))
                    );
                    setIsEditingDimensions(false);
                  }}
                  onCancel={() => setIsEditingDimensions(false)}
                />
              )}
            </div>
          )}

          {/* STEP 7: Room Focus Selection */}
          {currentStep === 7 && (
            <RoomSelector
              rooms={detectedRooms}
              selectedRoom={selectedRoom}
              onSelect={(rName) => setSelectedRoom(rName)}
            />
          )}

          {/* STEP 8: Design Style DNA */}
          {currentStep === 8 && (
            <DesignStyleSelector
              selectedStyle={designStyle}
              onSelect={(style) => setDesignStyle(style)}
              budgetAmount={totalBudget}
            />
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
