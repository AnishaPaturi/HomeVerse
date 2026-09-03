"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ShoppingTable } from "@/components/shopping/ShoppingTable";
import { ShoppingItem } from "@/types";

const SAMPLE_ITEMS: ShoppingItem[] = [
  { id: "s1", project_id: "p1", name: "3-Seater L-Shape Fabric Sofa", quantity: 1, estimated_cost: 35000, status: "pending" },
  { id: "s2", project_id: "p1", name: "Solid Wood Coffee Table", quantity: 1, estimated_cost: 12000, status: "pending" },
  { id: "s3", project_id: "p1", name: "Modern Minimalist Floor Lamp", quantity: 2, estimated_cost: 6000, status: "ordered" },
];

export default function ProjectShoppingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/project/${projectId}`} className="text-xs text-indigo-600 hover:underline mb-4 block">
          &larr; Back to Project
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Shopping & Procurement List</h1>
          <p className="text-sm text-gray-500">Auto-generated item specifications, brands, and merchant links.</p>
        </div>

        <ShoppingTable items={SAMPLE_ITEMS} />
      </div>
    </div>
  );
}
