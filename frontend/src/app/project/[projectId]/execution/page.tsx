"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { TaskItem } from "@/components/execution/TaskItem";
import { ExecutionTask } from "@/types";
import { completeProject } from "@/lib/api";
import { CheckCircle2, Award, ArrowRight } from "lucide-react";

const SAMPLE_TASKS: ExecutionTask[] = [
  { id: "t1", project_id: "p1", name: "Wall Priming & Base Coat", status: "completed", estimated_cost: 15000 },
  { id: "t2", project_id: "p1", name: "Electrical Rewiring & Accent Points", status: "completed", estimated_cost: 22000 },
  { id: "t3", project_id: "p1", name: "Hardwood Flooring Installation", status: "completed", estimated_cost: 45000 },
  { id: "t4", project_id: "p1", name: "Custom Millwork & Storage Joinery", status: "completed", estimated_cost: 120000 },
  { id: "t5", project_id: "p1", name: "Furniture Placement & Styling", status: "completed", estimated_cost: 223000 },
  { id: "t6", project_id: "p1", name: "Final Handoff & Quality Audit", status: "completed", estimated_cost: 8000 },
];

export default function ProjectExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [completing, setCompleting] = useState(false);

  const handleCompleteHome = async () => {
    try {
      setCompleting(true);
      await completeProject(projectId);
      router.push(`/project/${projectId}/home-book`);
    } catch (err) {
      console.error("Failed to complete project", err);
      // Fallback redirect directly
      router.push(`/project/${projectId}/home-book`);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Execution & Milestone Tracker</h1>
            <p className="text-sm text-gray-500">Track on-site progress, contractors, and schedule delivery.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCompleteHome}
              disabled={completing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-semibold shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? "Finalizing Home..." : "Complete Home & Generate Book"}
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium">
              + New Task
            </button>
          </div>
        </div>

        {/* Home Completion Prompt Banner */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                All Milestones Ready for Handover
              </h3>
              <p className="text-xs text-gray-600 dark:text-zinc-300">
                Phase 46 Final Step: Mark project as completed to compile your official Digital Home Book dossier.
              </p>
            </div>
          </div>
          <Link
            href={`/project/${projectId}/home-book`}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>View Digital Home Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
