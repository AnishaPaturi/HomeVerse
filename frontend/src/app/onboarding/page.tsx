"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { INTERIOR_STYLES } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { Project } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Property Type & Name
  const [projectName, setProjectName] = useState("My New Home");
  const [propertyType, setPropertyType] = useState("apartment");

  // Step 2: BHK
  const [bhk, setBhk] = useState(3);

  // Step 3: Area
  const [area, setArea] = useState(1200);

  // Step 4: Floor Plan
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanUrl, setFloorPlanUrl] = useState("");

  // Step 5: Budget
  const [budget, setBudget] = useState(800000);
  const [currency, setCurrency] = useState("INR");

  // Step 6: Lifestyle
  const [lifestyle, setLifestyle] = useState({
    wfh: true,
    hasPets: false,
    hasChildren: false,
    entertainsGuests: true,
    highStorage: true,
  });

  // Step 7: Design Preferences
  const [selectedStyle, setSelectedStyle] = useState("warm_contemporary");
  const [colorTone, setColorTone] = useState("Neutral & Warm (Beige, Walnut, Cream)");

  const handleCreateProject = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: projectName,
        property_type: propertyType,
        bhk: bhk,
        area_sqft: area,
        budget: budget,
        currency: currency,
        floor_plan_url: floorPlanUrl,
        lifestyle: lifestyle,
        preferences: {
          style: selectedStyle,
          colorTone: colorTone,
        },
      };

      const res = await fetchApi<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && res.id) {
        router.push(`/project/${res.id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Project creation failed:", err);
      setError(err.message || "Failed to create project");
      // Fallback redirect
      setTimeout(() => router.push("/dashboard"), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>
              {step === 1 && "Property Type"}
              {step === 2 && "BHK Configuration"}
              {step === 3 && "Carpet Area"}
              {step === 4 && "Floor Plan Upload"}
              {step === 5 && "Budget Planning"}
              {step === 6 && "Lifestyle Assessment"}
              {step === 7 && "Design Preferences"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          {/* Step 1: Property Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 1: Property Type</h2>
              <p className="text-sm text-gray-500">Name your interior project and select property structure.</p>

              <div>
                <label className="block text-xs font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                  placeholder="Skyline Horizon 3BHK"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Property Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "apartment", label: "Apartment / Flat" },
                    { id: "villa", label: "Villa / Duplex" },
                    { id: "independent_house", label: "Independent House" },
                    { id: "commercial", label: "Studio / Office" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPropertyType(p.id)}
                      className={`p-3 rounded-lg border text-sm font-medium text-left ${
                        propertyType === p.id
                          ? "border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400"
                          : "border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: BHK */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 2: Room Count (BHK)</h2>
              <p className="text-sm text-gray-500">Select bedroom and hall configuration.</p>

              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBhk(count)}
                    className={`py-4 rounded-xl border text-center font-bold ${
                      bhk === count
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                        : "border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {count} BHK
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Area */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 3: Approximate Carpet Area</h2>
              <p className="text-sm text-gray-500">Estimate square footage for material & cost calculations.</p>

              <div>
                <label className="block text-xs font-medium mb-1">Area (sq. ft)</label>
                <input
                  type="number"
                  min={200}
                  max={20000}
                  step={50}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>

              <div className="flex gap-2">
                {[800, 1100, 1450, 1850, 2400].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setArea(preset)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    {preset} sqft
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Floor Plan */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 4: Floor Plan & Blueprints</h2>
              <p className="text-sm text-gray-500">Upload builder layout, architectural drawing, or photo (Optional).</p>

              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center">
                <input
                  type="file"
                  id="floorPlanUpload"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFloorPlanFile(e.target.files[0]);
                      setFloorPlanUrl("/static/uploads/" + e.target.files[0].name);
                    }
                  }}
                />
                <label htmlFor="floorPlanUpload" className="cursor-pointer">
                  <div className="text-sm font-medium text-indigo-600 hover:underline">
                    {floorPlanFile ? floorPlanFile.name : "Click to select a file or drag & drop here"}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, PDF up to 25MB</p>
                </label>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Skip for now &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Budget */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 5: Define Target Budget</h2>
              <p className="text-sm text-gray-500">Set maximum expenditure for furniture, materials, and labor.</p>

              <div className="flex gap-3">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>

                <input
                  type="number"
                  step={50000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>

              <div className="flex gap-2">
                {[500000, 800000, 1200000, 1800000, 2500000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs"
                  >
                    ₹{(b / 100000).toFixed(1)}L
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Lifestyle */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 6: Lifestyle & Usage</h2>
              <p className="text-sm text-gray-500">Help the AI optimize ergonomics, storage, and material durability.</p>

              <div className="space-y-3">
                {[
                  { key: "wfh", label: "Work from Home Needs", desc: "Dedicated desk, acoustic isolation, accent backdrops" },
                  { key: "hasPets", label: "Pets in the Home", desc: "Scratch-resistant fabrics, low-pile rugs, easy-clean finishes" },
                  { key: "hasChildren", label: "Young Children", desc: "Rounded furniture corners, non-toxic coatings, stain protection" },
                  { key: "entertainsGuests", label: "Frequent Entertaining", desc: "Expandable seating, bar units, mood lighting" },
                  { key: "highStorage", label: "High Storage Capacity", desc: "Floor-to-ceiling wardrobes, hydraulic bed boxes" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  >
                    <input
                      type="checkbox"
                      checked={(lifestyle as any)[item.key]}
                      onChange={(e) =>
                        setLifestyle({ ...lifestyle, [item.key]: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 text-indigo-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Design Preferences */}
          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Step 7: Preferred Style & Palette</h2>
              <p className="text-sm text-gray-500">Select your preferred architectural aesthetic.</p>

              <div className="grid grid-cols-2 gap-3">
                {INTERIOR_STYLES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedStyle === st.id
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{st.label}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Controls */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium"
              >
                Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating Project..." : step === totalSteps ? "Finish & Launch Project" : "Next Step"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
