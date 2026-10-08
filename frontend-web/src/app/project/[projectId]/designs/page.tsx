"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DesignCard } from "@/components/designs/DesignCard";
import { WhatIfModal } from "@/components/designs/WhatIfModal";
import { Design } from "@/types";
import {
  getStoredProject,
  getStoredProjectRooms,
  getStoredProjectDesigns,
} from "@/lib/projectStorage";
import { Sparkles, Plus, ArrowLeft, Camera, Layers, Wand2 } from "lucide-react";

export default function ProjectDesignsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [proj, setProj] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getStoredProject(projectId);
    }
    return null;
  });

  const [designs, setDesigns] = useState<Design[]>(() => {
    if (typeof window !== "undefined") {
      const storedDesigns = getStoredProjectDesigns(projectId);
      if (storedDesigns.length > 0) return storedDesigns;
    }
    return [
      {
        id: "d1",
        name: "Japandi Master Bedroom (Perspective 1)",
        style: "Japandi",
        estimated_cost: 145000,
        image_url: "/rooms/master-bed-room-1.png",
        status: "generated",
      },
      {
        id: "d2",
        name: "Japandi Master Bedroom (Perspective 2)",
        style: "Japandi",
        estimated_cost: 165000,
        image_url: "/rooms/master-bed-room-2.png",
        status: "generated",
      },
      {
        id: "d3",
        name: "Japandi Living Room",
        style: "Japandi",
        estimated_cost: 185000,
        image_url: "/styles/japandi.png",
        status: "generated",
      },
    ];
  });
  const [selectedDesignForWhatIf, setSelectedDesignForWhatIf] = useState<Design | null>(null);

  const handleDesignUpdated = (updatedDesign: Design) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === updatedDesign.id ? updatedDesign : d))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href={`/project/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Project Dashboard
        </Link>

        {/* Header with Title & Studio Link */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Room Designs</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Explore generative room concepts, 3D layouts, and instant &ldquo;What If?&rdquo; cost simulations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDesignForWhatIf(designs[0])}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              &ldquo;What If?&rdquo; Simulator
            </button>
            <Link
              href={`/project/${projectId}/walkthrough`}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition"
            >
              Open 3D Walkthrough
            </Link>
          </div>
        </div>

        {/* What-If Feature Highlight Banner */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-pink-950/10 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Phase 24: Interactive &ldquo;What If?&rdquo; Mode Enabled
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Ask questions like &ldquo;What if I reduce the budget by ₹1 lakh?&rdquo;, &ldquo;What if I want more storage?&rdquo;, or &ldquo;What if I add a work desk?&rdquo;. The AI adapts Design, Furniture, Materials, and Cost without rebuilding the project.
            </p>
          </div>
          <button
            onClick={() => setSelectedDesignForWhatIf(designs[0])}
            className="shrink-0 px-3.5 py-1.5 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:shadow-sm transition"
          >
            Launch on Selected Room &rarr;
          </button>
        </div>

        {/* User's Original Intake Photos (Before) */}
        {proj?.room_photos && proj.room_photos.length > 0 && (
          <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Original Intake Photos ({proj.target_room || proj.primary_room || "Room"})
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                BEFORE STATE · {proj.room_photos.length} Photo(s)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {proj.room_photos.map((p: any, pIdx: number) => (
                <div key={p.id || pIdx} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    <img src={p.url} alt={p.name || `Photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 text-center bg-white dark:bg-zinc-900">
                    <span className="text-[11px] font-mono text-gray-600 dark:text-zinc-400 block truncate">
                      {p.label || `Angle ${pIdx + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Header for AI Concepts */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              AI Synthesized 3D Concepts ({proj?.design_style || "Japandi"} Style)
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">
            {designs.length} Photorealistic Renders
          </span>
        </div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onWhatIf={(d) => setSelectedDesignForWhatIf(d)}
            />
          ))}
        </div>
      </div>

      {/* What If Modal */}
      {selectedDesignForWhatIf && (
        <WhatIfModal
          design={selectedDesignForWhatIf}
          isOpen={!!selectedDesignForWhatIf}
          onClose={() => setSelectedDesignForWhatIf(null)}
          onDesignUpdated={handleDesignUpdated}
        />
      )}
    </div>
  );
}
