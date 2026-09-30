"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function ProjectsDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">All Projects</h1>
        <p className="text-sm text-gray-500">Filter and organize your home interior projects.</p>
      </div>
    </div>
  );
}
