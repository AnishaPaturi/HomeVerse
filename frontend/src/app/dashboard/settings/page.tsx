"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function SettingsDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Account & Platform Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Configure design preferences, units, and notifications.</p>
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-4">
          <div>
            <label className="text-sm font-medium">Default Measurement Unit</label>
            <p className="text-xs text-gray-500">Feet / Inches (Imperial) or Meters / Centimeters (Metric)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
