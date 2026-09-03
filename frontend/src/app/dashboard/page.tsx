"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Project } from "@/types";

const DEMO_PROJECTS: Project[] = [
  {
    id: "p1-demo",
    user_id: "u1",
    name: "Skyline Residency 3BHK",
    property_type: "apartment",
    bhk: 3,
    area_sqft: 1650,
    budget: 1200000,
    currency: "INR",
  },
  {
    id: "p2-demo",
    user_id: "u1",
    name: "Palm Grove Villa",
    property_type: "villa",
    bhk: 4,
    area_sqft: 2800,
    budget: 2500000,
    currency: "INR",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Manage your interior design spaces, budgets, and generated designs.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Create New Project
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_PROJECTS.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      </main>
    </div>
  );
}
