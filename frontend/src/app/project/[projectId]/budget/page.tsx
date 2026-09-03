"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { Budget } from "@/types";

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const budget: Budget = {
    id: "b1",
    project_id: projectId,
    total_budget: 1200000,
    allocated_budget: 850000,
    spent_amount: 320000,
    remaining_amount: 880000,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Budget & Cost Planning</h1>
          <p className="text-sm text-gray-500">Track and optimize room expenses and material costs.</p>
        </div>

        <BudgetOverview budget={budget} />
      </div>
    </div>
  );
}
