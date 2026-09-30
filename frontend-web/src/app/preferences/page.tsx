"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { fetchApi } from "@/lib/api";

interface ReferenceImage {
  id: string;
  title: string;
  style: string;
  image_url: string;
  colours: string[];
  wood_tone: string;
  materials: string[];
  vibe: string;
}

interface StyleProfile {
  primary_style: string;
  secondary_style: string;
  wood_preference: string;
  colour_preference: string[];
  material_preferences: string[];
  lifestyle: Record<string, any>;
  confidence_score: number;
}

export default function PreferencesPage() {
  const [activeTab, setActiveTab] = useState<"discovery" | "questionnaire">("discovery");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reactions, setReactions] = useState<{ image_id: string; reaction: string }[]>([]);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    family_size: "3-4",
    pets: false,
    children: true,
    work_from_home: "hybrid",
    entertainment: "frequent",
    storage_requirements: "high",
    maintenance_preference: "low_maintenance",
  });

  useEffect(() => {
    // Load reference catalog
    fetchApi<ReferenceImage[]>("/api/preferences/reference-images")
      .then((data) => {
        if (data && data.length > 0) {
          setReferenceImages(data);
        }
      })
      .catch((err) => console.error("Failed to load reference images:", err));

    // Load initial user preferences
    fetchApi<StyleProfile>("/api/preferences")
      .then((data) => {
        if (data) {
          setStyleProfile(data);
        }
      })
      .catch((err) => console.error("Failed to load current preferences:", err));
  }, []);

  const handleReaction = async (reaction: "like" | "dislike" | "skip") => {
    if (!referenceImages[currentIndex]) return;
    const currentId = referenceImages[currentIndex].id;
    const nextReactions = [...reactions.filter((r) => r.image_id !== currentId), { image_id: currentId, reaction }];
    setReactions(nextReactions);

    if (currentIndex < referenceImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    // Trigger real-time calculation
    calculateProfile(nextReactions, questionnaire);
  };

  const calculateProfile = async (
    reacs = reactions,
    quest = questionnaire
  ) => {
    setLoading(true);
    try {
      const res = await fetchApi<StyleProfile>("/api/preferences/calculate-style", {
        method: "POST",
        body: JSON.stringify({
          reactions: reacs,
          questionnaire: quest,
        }),
      });
      if (res) {
        setStyleProfile(res);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Calculation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentImage = referenceImages[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Design Preference & Style Engine</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Discover your aesthetic profile and configure lifestyle requirements for AI generation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-200 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("discovery")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "discovery"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                  : "text-gray-600 dark:text-zinc-400"
              }`}
            >
              Visual Discovery
            </button>
            <button
              onClick={() => setActiveTab("questionnaire")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "questionnaire"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm"
                  : "text-gray-600 dark:text-zinc-400"
              }`}
            >
              Lifestyle Questionnaire
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Swiper or Questionnaire */}
          <div className="lg:col-span-7">
            {activeTab === "discovery" ? (
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
                    Image {currentIndex + 1} of {referenceImages.length}
                  </span>
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Reset Deck
                  </button>
                </div>

                {currentImage ? (
                  <div className="space-y-5">
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-800">
                      <img
                        src={currentImage.image_url}
                        alt={currentImage.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
                          {currentImage.style.replace("_", " ")}
                        </span>
                        <h3 className="text-xl font-bold">{currentImage.title}</h3>
                        <p className="text-xs text-zinc-300 mt-1">{currentImage.vibe}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-gray-500">Palette:</span>
                      {currentImage.colours.map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium"
                        >
                          {col.replace("_", " ")}
                        </span>
                      ))}
                    </div>

                    {/* Like / Dislike / Skip Action Bar */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => handleReaction("dislike")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-950 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-sm transition-all"
                      >
                        <span>👎</span> DISLIKE
                      </button>
                      <button
                        onClick={() => handleReaction("skip")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all"
                      >
                        <span>⏭️</span> SKIP
                      </button>
                      <button
                        onClick={() => handleReaction("like")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all"
                      >
                        <span>❤️</span> LIKE
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-500">Deck complete! Review your computed profile on the right.</p>
                    <button
                      onClick={() => setCurrentIndex(0)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                    >
                      Restart Discovery
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Questionnaire Tab */
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Lifestyle Questionnaire</h3>
                  <p className="text-xs text-gray-500">
                    Define human-centric parameters so the AI designs spaces tailored to your daily routine.
                  </p>
                </div>

                {/* Family Size */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                    Family Size & Cohabitants
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Single", "Couple", "3-4", "5+ Multi-gen"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuestionnaire({ ...questionnaire, family_size: val })}
                        className={`py-2 rounded-lg border text-xs font-medium ${
                          questionnaire.family_size === val
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                            : "border-gray-200 dark:border-zinc-800"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pets & Children */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionnaire.pets}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, pets: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <span className="text-xs font-medium">Has Pets (Scratch Protection)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionnaire.children}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, children: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <span className="text-xs font-medium">Young Children (Rounded edges)</span>
                  </label>
                </div>

                {/* WFH */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                    Work From Home Setup
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Full-time", "Hybrid", "Rarely / None"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuestionnaire({ ...questionnaire, work_from_home: val })}
                        className={`py-2 rounded-lg border text-xs font-medium ${
                          questionnaire.work_from_home === val
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                            : "border-gray-200 dark:border-zinc-800"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entertainment */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                    Hosting & Entertaining
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Frequent (10+ guests)", "Occasional Dinners", "Quiet Retreat"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuestionnaire({ ...questionnaire, entertainment: val })}
                        className={`py-2 rounded-lg border text-xs font-medium ${
                          questionnaire.entertainment === val
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-600"
                            : "border-gray-200 dark:border-zinc-800"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Storage & Maintenance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                      Storage Requirements
                    </label>
                    <select
                      value={questionnaire.storage_requirements}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, storage_requirements: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs bg-transparent"
                    >
                      <option value="minimal">Minimalist / Concealed</option>
                      <option value="moderate">Moderate Wardrobes</option>
                      <option value="high">Floor-to-Ceiling High Volume</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                      Maintenance Preference
                    </label>
                    <select
                      value={questionnaire.maintenance_preference}
                      onChange={(e) => setQuestionnaire({ ...questionnaire, maintenance_preference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs bg-transparent"
                    >
                      <option value="low_maintenance">Low Maintenance / Wipe Clean</option>
                      <option value="medium">Standard Care</option>
                      <option value="artisanal">High Craft / Raw Woods & Patina</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => calculateProfile(reactions, questionnaire)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Update & Recalculate Profile
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Quantified Computed Profile */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="font-bold text-lg">Computed Style Profile</h3>
                  <span className="text-xs text-gray-500">Algorithmically Derived</span>
                </div>
                {styleProfile && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    {Math.round(styleProfile.confidence_score * 100)}% Match
                  </span>
                )}
              </div>

              {styleProfile ? (
                <div className="space-y-4">
                  {/* Primary & Secondary Styles */}
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400">Primary Style</span>
                    <p className="text-xl font-extrabold capitalize text-indigo-600 dark:text-indigo-400">
                      {styleProfile.primary_style.replace("_", " ")}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400">Secondary Accent Style</span>
                    <p className="text-base font-semibold capitalize text-gray-800 dark:text-zinc-200">
                      {styleProfile.secondary_style.replace("_", " ")}
                    </p>
                  </div>

                  {/* Wood Preference */}
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400">Wood Density</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-medium capitalize text-amber-700 dark:text-amber-400">
                        {styleProfile.wood_preference} Wood Content
                      </span>
                    </div>
                  </div>

                  {/* Colour Palette */}
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400">Colour Palette</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {styleProfile.colour_preference.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        >
                          {c.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400">Tactile Materials</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {styleProfile.material_preferences.map((m) => (
                        <span
                          key={m}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                        >
                          {m.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {savedSuccess && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg text-center font-medium">
                      ✓ Profile synchronized with AI generator!
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                    <Link
                      href="/studio"
                      className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs text-center transition-colors"
                    >
                      Generate Room Concepts in Studio &rarr;
                    </Link>
                    <Link
                      href="/onboarding"
                      className="block w-full py-2 text-center text-xs text-gray-500 hover:underline"
                    >
                      Configure New Project with this Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  Swipe through the reference images to generate your style profile.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
