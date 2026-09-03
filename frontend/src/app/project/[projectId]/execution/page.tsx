"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { TaskItem } from "@/components/execution/TaskItem";
import { ExecutionTask } from "@/types";

const SAMPLE_TASKS: ExecutionTask[] = [
  { id: "t1", project_id: "p1", name: "Wall Priming & Base Coat", status: "completed", estimated_cost: 15000 },
  { id: "t2", project_id: "p1", name: "Electrical Rewiring & Accent Points", status: "in_progress", estimated_cost: 22000 },
  { id: "t3", project_id: "p1", name: "Hardwood Flooring Installation", status: "todo", estimated_cost: 45000 },
];

export default function ProjectExecutionPage() {
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
          <div>
            <h1 className="text-2xl font-bold">Execution & Milestone Tracker</h1>
            <p className="text-sm text-gray-500">Track on-site progress, contractors, and schedule delivery.</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
            + New Task
          </button>
        </div>

        <div className="space-y-3">
          {SAMPLE_TASKS.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
