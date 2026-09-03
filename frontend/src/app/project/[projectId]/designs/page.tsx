"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DesignCard } from "@/components/designs/DesignCard";
import { Design } from "@/types";

const SAMPLE_DESIGNS: Design[] = [
  { id: "d1", name: "Modern Minimalist Living", style: "Minimalist", estimated_cost: 85000 },
  { id: "d2", name: "Warm Contemporary Bedroom", style: "Warm Contemporary", estimated_cost: 65000 },
];

export default function ProjectDesignsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AI Room Designs</h1>
          <Link
            href="/studio"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            Open 3D Studio
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_DESIGNS.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      </div>
    </div>
  );
}
