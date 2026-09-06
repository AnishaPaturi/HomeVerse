"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useProject } from "@/hooks/useProject";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, loading } = useProject(projectId);

  const navItems = [
    { label: "Rooms", href: `/project/${projectId}/rooms`, desc: "Dimensions & floor plans" },
    { label: "Designs", href: `/project/${projectId}/designs`, desc: "AI renders & styles" },
    { label: "Budget", href: `/project/${projectId}/budget`, desc: "Allocations & expenses" },
    { label: "Shopping", href: `/project/${projectId}/shopping`, desc: "Item lists & product links" },
    { label: "Execution", href: `/project/${projectId}/execution`, desc: "Tasks & progress" },
    { label: "Digital Home Book", href: `/project/${projectId}/home-book`, desc: "Dossier & completion certificate" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-indigo-600 hover:underline mb-2 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{project?.name || "Project Overview"}</h1>
          <p className="text-sm text-gray-500">Project ID: {projectId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 transition-colors shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{item.label}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
