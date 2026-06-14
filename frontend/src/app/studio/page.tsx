"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play, FileText, Download, Plus, Sparkles, Layers, Box, Search, Sliders, ShoppingBag } from "lucide-react";
import CanvasContainer from "@/components/studio/CanvasContainer";
import ObjectPropertiesPanel from "@/components/studio/ObjectPropertiesPanel";
import CopilotChat from "@/components/studio/CopilotChat";

interface RoomObject {
  id: string;
  object_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation: number;
  scale: number;
  material: string;
}

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStyle = searchParams.get("style") || "Modern";

  const [user, setUser] = useState<any | null>(null);
  const designId = searchParams.get("designId");

  useEffect(() => {
    const userSession = localStorage.getItem("user");
    if (userSession) {
      setUser(JSON.parse(userSession));
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadDesignObjects = async () => {
    if (!designId) return;
    try {
      const res = await fetch(`http://localhost:8080/api/designs/${designId}`);
      if (res.ok) {
        const designData = await res.json();
        if (designData && designData.objects && designData.objects.length > 0) {
          const mappedObjects = designData.objects.map((obj: any) => ({
            id: obj.id,
            object_type: obj.object_type,
            position_x: obj.position_x,
            position_y: obj.position_y,
            position_z: obj.position_z,
            rotation: obj.rotation,
            scale: obj.scale,
            material: obj.material
          }));
          setObjects(mappedObjects);
        }
      }
    } catch (err) {
      console.warn("Failed to load design from backend:", err);
    }
  };

  useEffect(() => {
    if (designId) {
      loadDesignObjects();
    }
  }, [designId]);

  // Initial mock room setup
  const [objects, setObjects] = useState<RoomObject[]>([
    {
      id: "floor-1",
      object_type: "floor",
      position_x: 0,
      position_y: 0,
      position_z: 0,
      rotation: 0,
      scale: 1,
      material: "wood_light",
    },
    {
      id: "wall-1",
      object_type: "wall",
      position_x: 0,
      position_y: 1.5,
      position_z: -4,
      rotation: 0,
      scale: 1,
      material: "#f1f5f9",
    },
    {
      id: "sofa-1",
      object_type: "sofa",
      position_x: 0,
      position_y: 0,
      position_z: -2,
      rotation: 0,
      scale: 1,
      material: "#a78bfa", // Purple cushion fabric
    },
    {
      id: "coffee-table-1",
      object_type: "coffee_table",
      position_x: 0,
      position_y: 0,
      position_z: -0.5,
      rotation: 0,
      scale: 1.1,
      material: "#78350f", // Dark wood legs/top
    },
  ]);

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [walkthroughMode, setWalkthroughMode] = useState(false);

  // AI Recommendations tab states
  const [activeLeftTab, setActiveLeftTab] = useState<"library" | "recommendations">("library");
  const [recommendQuery, setRecommendQuery] = useState(initialStyle);
  const [recommendLimit, setRecommendLimit] = useState(5);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  // Auto-apply starting style presets
  useEffect(() => {
    if (initialStyle) {
      applyStylePreset(initialStyle);
      setRecommendQuery(initialStyle);
    }
  }, [initialStyle]);

  // Fetch recommendations from backend
  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendError(null);
    try {
      const response = await fetch("http://localhost:8080/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: recommendQuery,
          top_n: recommendLimit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const dataStr = await response.json();
      const parsedData = JSON.parse(dataStr);
      setRecommendations(parsedData);
    } catch (err: any) {
      console.error(err);
      setRecommendError("Could not load recommendations. Ensure the backend server is running.");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Trigger recommendations fetch when initialStyle changes or when entering studio
  useEffect(() => {
    fetchRecommendations();
  }, [initialStyle]);

  // Helpers to map recommendations to 3D representation
  const mapCategoryTo3DType = (category: string): "sofa" | "coffee_table" | "desk" => {
    const cat = category.toLowerCase();
    if (cat === "sofa" || cat === "chair") return "sofa";
    if (cat === "table") return "coffee_table";
    return "desk";
  };

  const mapProductToMaterial = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes("leather") || name.includes("eames")) return "#b45309"; // brown leather
    if (name.includes("velvet") || name.includes("chesterfield")) return "#0d9488"; // teal velvet
    if (name.includes("concrete")) return "#64748b"; // concrete slate
    if (name.includes("stockholm") || name.includes("grey")) return "#cbd5e1"; // grey fabric
    if (name.includes("linen") || name.includes("white") || name.includes("calacatta")) return "#f8fafc"; // off-white/marble
    if (name.includes("oak") || name.includes("wishbone") || name.includes("paper")) return "#f5f5dc"; // wood light/cream
    if (name.includes("walnut") || name.includes("noguchi")) return "#78350f"; // dark wood
    if (name.includes("metal") || name.includes("black")) return "#334155"; // steel/charcoal
    return "#a78bfa"; // default lavender cushion
  };

  const applyStylePreset = (style: string) => {
    setObjects((prev) =>
      prev.map((obj) => {
        if (obj.object_type === "wall") {
          switch (style) {
            case "Minimalist": return { ...obj, material: "#fafafa" };
            case "Scandinavian": return { ...obj, material: "#e2e8f0" };
            case "Japandi": return { ...obj, material: "#faf7f2" };
            case "Luxury": return { ...obj, material: "#1e293b" }; // Dark theme luxury
            default: return { ...obj, material: "#f1f5f9" };
          }
        }
        if (obj.object_type === "floor") {
          switch (style) {
            case "Minimalist": return { ...obj, material: "marble" };
            case "Scandinavian": return { ...obj, material: "wood_light" };
            case "Japandi": return { ...obj, material: "wood_light" };
            case "Luxury": return { ...obj, material: "granite" };
            default: return { ...obj, material: "wood_light" };
          }
        }
        if (obj.object_type === "sofa") {
          switch (style) {
            case "Minimalist": return { ...obj, material: "#ffffff" };
            case "Scandinavian": return { ...obj, material: "#cbd5e1" };
            case "Japandi": return { ...obj, material: "#d1bc8a" };
            case "Luxury": return { ...obj, material: "#b45309" }; // leather
            default: return { ...obj, material: "#a78bfa" };
          }
        }
        return obj;
      })
    );
  };

  const handleUpdateObject = async (id: string, updates: Partial<RoomObject>) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );

    if (designId && !id.startsWith("temp-") && id.includes("-")) {
      try {
        await fetch(`http://localhost:8080/api/designs/objects/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.warn("Failed to sync object update to backend:", err);
      }
    }
  };

  const handleDeleteObject = async (id: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }

    if (designId && !id.startsWith("temp-") && id.includes("-")) {
      try {
        await fetch(`http://localhost:8080/api/designs/objects/${id}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.warn("Failed to delete object on backend:", err);
      }
    }
  };

  // Add object from asset catalog or recommender
  const handleAddObject = async (type: "sofa" | "coffee_table" | "desk", customMaterial?: string, customScale?: number) => {
    const defaultMat = type === "sofa" ? "#ec4899" : type === "desk" ? "#4b5563" : "#f59e0b";
    const newObjLocal: RoomObject = {
      id: `temp-${Date.now()}`,
      object_type: type,
      position_x: (Math.random() - 0.5) * 3,
      position_y: 0,
      position_z: (Math.random() - 0.5) * 2 - 1.5,
      rotation: 0,
      scale: customScale ?? 1.0,
      material: customMaterial ?? defaultMat,
    };
    setObjects((prev) => [...prev, newObjLocal]);
    setSelectedObjectId(newObjLocal.id);

    if (designId) {
      try {
        const res = await fetch(`http://localhost:8080/api/designs/${designId}/objects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            object_type: type,
            position_x: newObjLocal.position_x,
            position_y: newObjLocal.position_y,
            position_z: newObjLocal.position_z,
            rotation: newObjLocal.rotation,
            scale: newObjLocal.scale,
            material: newObjLocal.material
          })
        });

        if (res.ok) {
          const savedObj = await res.json();
          setObjects((prev) =>
            prev.map((o) => (o.id === newObjLocal.id ? { ...o, id: savedObj.id } : o))
          );
          setSelectedObjectId(savedObj.id);
        }
      } catch (err) {
        console.warn("Failed to save object to backend:", err);
      }
    }
  };

  // Process triggers from the AI Copilot chat
  const handleCopilotAction = (actionType: string, payload: any) => {
    if (actionType === "update_wall") {
      setObjects((prev) =>
        prev.map((o) => (o.object_type === "wall" ? { ...o, ...payload } : o))
      );
    } else if (actionType === "update_floor") {
      setObjects((prev) =>
        prev.map((o) => (o.object_type === "floor" ? { ...o, ...payload } : o))
      );
    } else if (actionType === "update_sofa") {
      setObjects((prev) =>
        prev.map((o) => (o.object_type === "sofa" ? { ...o, ...payload } : o))
      );
    } else if (actionType === "add_object") {
      const newObj: RoomObject = {
        id: `${payload.object_type}-${Date.now()}`,
        object_type: payload.object_type,
        position_x: 1.5,
        position_y: 0,
        position_z: -1.5,
        rotation: 0,
        scale: 1,
        material: payload.material,
      };
      setObjects((prev) => [...prev, newObj]);
      setSelectedObjectId(newObj.id);
    }
  };

  const getSelectedObject = () => {
    return objects.find((o) => o.id === selectedObjectId) || null;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Upper Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-[1px] bg-slate-800" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-200">Design Studio</h1>
              <span className="text-[10px] px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-800/60 rounded-full font-mono capitalize">
                Style: {initialStyle}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Interactive 3D Editor Sandbox</p>
          </div>
        </div>

        {/* Exporter Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert("Simulating Video game walkthrough walkmode controls... Use Orbit Controls to drag around!")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" /> Enter Walkthrough
          </button>

          <button
            onClick={() => alert("Design Proposal exported to PDF (Dummy file generated).")}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Download Proposal PDF"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert("High-fidelity 4K Realistic Render is generating in background... check back shortly!")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer glow-btn mr-1"
          >
            <Download className="w-3.5 h-3.5" /> Export Render
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3.5 ml-1.5">
              <div 
                onClick={() => router.push("/profile")}
                className="w-8 h-8 rounded-full bg-indigo-650 hover:bg-indigo-500 border border-indigo-500/50 hover:border-indigo-400 flex items-center justify-center font-bold text-xs cursor-pointer select-none text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                title={`View Profile: ${user.name} (${user.email}) - Plan: ${user.plan}`}
              >
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  router.push("/login");
                }}
                className="text-[10px] font-bold hover:text-white text-slate-400 border border-slate-850 bg-slate-950 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar: Object catalog */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950/90 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto">
          {/* Sidebar Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveLeftTab("library")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "library"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Library
            </button>
            <button
              onClick={() => setActiveLeftTab("recommendations")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "recommendations"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Products
            </button>
          </div>

          <div className="flex-1 space-y-4 min-h-0">
            {activeLeftTab === "library" ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-3">Asset Library</span>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddObject("sofa")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-pink-950/20 border border-pink-900/40 rounded-lg text-pink-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Sofa</p>
                        <span className="text-[10px] text-slate-500 font-normal">Standard 3-seater</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("coffee_table")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Coffee Table</p>
                        <span className="text-[10px] text-slate-500 font-normal">Wood or glass frame</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("desk")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-blue-950/20 border border-blue-900/40 rounded-lg text-blue-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Desk</p>
                        <span className="text-[10px] text-slate-500 font-normal">Nordic working desk</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col h-full">
                {/* Search query form */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">AI Product Recommender</span>
                  
                  {/* Search query input */}
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={recommendQuery}
                        onChange={(e) => setRecommendQuery(e.target.value)}
                        placeholder="e.g. Modern, Sofa..."
                        className="w-full py-1.5 pl-2.5 pr-7 text-xs bg-slate-900 border border-slate-850 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => e.key === "Enter" && fetchRecommendations()}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2" />
                    </div>
                    
                    <button
                      onClick={fetchRecommendations}
                      disabled={loadingRecommendations}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Go
                    </button>
                  </div>

                  {/* Limit control */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /> Max Results</span>
                    <select
                      value={recommendLimit}
                      onChange={(e) => setRecommendLimit(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-slate-300 focus:outline-none"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                </div>

                {/* Recommendations list / loading / errors */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
                  {loadingRecommendations ? (
                    <div className="py-10 text-center space-y-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-500">Searching recommendations...</p>
                    </div>
                  ) : recommendError ? (
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-center">
                      <p className="text-[10px] text-red-400">{recommendError}</p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="py-6 text-center text-slate-500">
                      <p className="text-[11px]">No products found matching "{recommendQuery}".</p>
                    </div>
                  ) : (
                    recommendations.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2 group transition-all"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800/50">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 border border-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            {item.price}
                          </span>
                        </div>

                        {/* Title and Category */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-[11px] text-slate-200 line-clamp-1">{item.name}</h4>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider">{item.style} • {item.category}</span>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {/* Action: Add to scene */}
                        <button
                          onClick={() => handleAddObject(
                            mapCategoryTo3DType(item.category),
                            mapProductToMaterial(item.name),
                            item.category === "Chair" ? 0.65 : 1.0
                          )}
                          className="w-full flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-slate-700/60"
                        >
                          <Plus className="w-3 h-3" /> Add to Room
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-900 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Room Info</span>
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-mono text-slate-200">{objects.length - 2}</span>
              </div>
              <div className="flex justify-between">
                <span>Wall Finish:</span>
                <span
                  className="font-mono text-slate-200"
                  style={{ color: objects.find((o) => o.object_type === "wall")?.material }}
                >
                  {objects.find((o) => o.object_type === "wall")?.material}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Flooring:</span>
                <span className="font-mono text-slate-200 capitalize">
                  {objects.find((o) => o.object_type === "floor")?.material.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Three.js viewport */}
        <main className="flex-1 p-4 bg-slate-950 flex flex-col min-w-0">
          <CanvasContainer
            objects={objects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        </main>

        {/* Right Tab Stack: Properties & Copilot Chat */}
        <aside className="w-80 border-l border-slate-800 bg-slate-950/90 flex flex-col p-4 gap-4 shrink-0 overflow-y-auto">
          {/* Object properties config */}
          <div className="h-1/2 min-h-[300px]">
            <ObjectPropertiesPanel
              selectedObject={getSelectedObject()}
              onUpdateObject={handleUpdateObject}
              onDeleteObject={handleDeleteObject}
            />
          </div>

          {/* Copilot Chat controller */}
          <div className="flex-1 min-h-[300px]">
            <Suspense fallback={<div className="text-xs text-slate-500 animate-pulse">Loading Chat...</div>}>
              <CopilotChat 
                designId={designId || "mvp-design-token"} 
                onCopilotAction={handleCopilotAction} 
                onRefresh={loadDesignObjects} 
              />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Initializing 3D Design Studio...</p>
          </div>
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
