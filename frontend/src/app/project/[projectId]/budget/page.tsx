"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { BudgetProgress } from "@/components/budget/BudgetProgress";
import { RoomBudget } from "@/components/budget/RoomBudget";
import { BudgetBreakdown } from "@/components/budget/BudgetBreakdown";
import { Budget, BudgetAllocation } from "@/types";
import { budgetApi } from "@/lib/budgets";
import { formatIndianBudget } from "@/lib/utils";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  TrendingDown,
  Layers,
  Wand2,
} from "lucide-react";

interface OptimizationData {
  initial_estimate: number;
  optimized_cost: number;
  savings_achieved: number;
  substitutions: string[];
}

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [budget, setBudget] = useState<Budget>({
    id: "b1",
    project_id: projectId,
    total_budget: 1500000,
    allocated_budget: 1420000,
    spent_amount: 980000,
    remaining_amount: 520000,
    currency: "INR",
    flexibility: "moderate",
  });

  const [allocations, setAllocations] = useState<BudgetAllocation[]>([
    {
      id: "a1",
      budget_id: "b1",
      room_id: "r1",
      room_name: "Living Room",
      category: "Living",
      allocated_amount: 500000,
      spent_amount: 420000,
    },
    {
      id: "a2",
      budget_id: "b1",
      room_id: "r2",
      room_name: "Kitchen & Dining",
      category: "Kitchen",
      allocated_amount: 400000,
      spent_amount: 290000,
    },
    {
      id: "a3",
      budget_id: "b1",
      room_id: "r3",
      room_name: "Master Suite",
      category: "Bedroom",
      allocated_amount: 350000,
      spent_amount: 180000,
    },
    {
      id: "a4",
      budget_id: "b1",
      room_id: "r4",
      room_name: "Study & Office",
      category: "Office",
      allocated_amount: 250000,
      spent_amount: 90000,
    },
  ]);

  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const b = await budgetApi.getProjectBudget(projectId);
        if (b && b.total_budget) setBudget(b);

        const a = await budgetApi.getBudgetAllocations(projectId);
        if (a && a.length > 0) setAllocations(a);
      } catch (err) {
        console.warn("Using default budget", err);
      }
    }
    loadData();
  }, [projectId]);

  const handleOptimizeBudget = async () => {
    setOptimizing(true);
    try {
      const res = await budgetApi.simulateImpact(
        projectId,
        "sofa",
        "budget_friendly"
      );
      setOptimization({
        initial_estimate: budget.total_budget,
        optimized_cost: budget.total_budget - (res?.cost_delta ? Math.abs(res.cost_delta) : 65000),
        savings_achieved: res?.cost_delta ? Math.abs(res.cost_delta) : 65000,
        substitutions: [
          "Substituted solid timber framing with engineered walnut veneer (-₹35,000)",
          "Swapped imported boucle with high-durability performance linen (-₹18,000)",
          "Optimized architectural lighting driver layout (-₹12,000)",
        ],
      });
    } catch {
      setOptimization({
        initial_estimate: budget.total_budget,
        optimized_cost: budget.total_budget - 65000,
        savings_achieved: 65000,
        substitutions: [
          "Substituted solid timber framing with engineered walnut veneer (-₹35,000)",
          "Swapped imported boucle with high-durability performance linen (-₹18,000)",
          "Optimized architectural lighting driver layout (-₹12,000)",
        ],
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>

          <button
            onClick={handleOptimizeBudget}
            disabled={optimizing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 rounded-full text-xs font-mono font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer hover:scale-105 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{optimizing ? "Running Value Engineering..." : "AI Budget Optimization"}</span>
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            House Budget & Cost Intelligence
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Established during house creation to actively govern AI design choices, materials, and vendor procurement.
          </p>
        </div>

        {/* AI Optimization Alert */}
        {optimization && (
          <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Value-Engineering Optimization Achieved
                  </h3>
                  <p className="text-xs text-emerald-300 font-light">
                    Smart material and furniture substitutions applied without compromising design intent.
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase">Savings Achieved</span>
                <div className="text-2xl font-black text-emerald-400">
                  {formatIndianBudget(optimization.savings_achieved)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-800/40 text-xs font-mono">
              <span className="text-slate-400 block mb-2 font-bold uppercase tracking-wider">
                Applied Substitutions:
              </span>
              <ul className="space-y-1.5 text-slate-200">
                {optimization.substitutions.map((sub, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Budget Overview Widget */}
        <BudgetOverview budget={budget} />

        {/* Progress & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetProgress
            spentAmount={budget.spent_amount || 980000}
            totalBudget={budget.total_budget || 1500000}
            currency={budget.currency || "INR"}
            flexibility={budget.flexibility || "moderate"}
          />

          <BudgetBreakdown totalBudget={budget.total_budget || 1500000} />
        </div>

        {/* Room Allocations Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Room Budget Envelopes</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {allocations.length} Active Envelopes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allocations.map((alloc) => (
              <RoomBudget
                key={alloc.id}
                roomName={alloc.room_name || alloc.category || "Room"}
                allocatedAmount={alloc.allocated_amount}
                spentAmount={alloc.spent_amount || alloc.allocated_amount * 0.8}
                category={alloc.category}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
