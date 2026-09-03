"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { INTERIOR_STYLES } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("My New Home");
  const [propertyType, setPropertyType] = useState("apartment");
  const [bhk, setBhk] = useState(3);
  const [area, setArea] = useState(1200);
  const [budget, setBudget] = useState(800000);
  const [selectedStyle, setSelectedStyle] = useState("modern");

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Step {step} of {totalSteps}
          </span>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Project Basics</h2>
              <p className="text-sm text-gray-500 mb-6">What type of space are you planning to design?</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                  >
                    <option value="apartment">Apartment / Flat</option>
                    <option value="villa">Villa / Duplex</option>
                    <option value="independent_house">Independent House</option>
                    <option value="commercial">Commercial / Studio</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Dimensions & Layout</h2>
              <p className="text-sm text-gray-500 mb-6">Provide room count and carpet area.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">BHK Configuration</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bhk}
                    onChange={(e) => setBhk(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Approx Carpet Area (sq. ft)</label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Target Budget</h2>
              <p className="text-sm text-gray-500 mb-6">Set your target interior expenditure cap.</p>

              <div>
                <label className="block text-xs font-medium mb-1">Total Budget (INR)</label>
                <input
                  type="number"
                  step={50000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm bg-transparent"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Interior Style Preference</h2>
              <p className="text-sm text-gray-500 mb-6">Select your primary visual aesthetic.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTERIOR_STYLES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStyle(st.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedStyle === st.id
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-gray-200 dark:border-zinc-800"
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{st.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100 dark:border-zinc-800">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium"
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {step === totalSteps ? "Create Project" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
