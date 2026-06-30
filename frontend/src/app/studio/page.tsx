"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play, FileText, Download, Plus, Sparkles, Layers, Box, Search, Sliders, ShoppingBag, Image as ImageIcon } from "lucide-react";
import CanvasContainer from "@/components/studio/CanvasContainer";
import BlueprintEditor2D from "@/components/studio/BlueprintEditor2D";
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

const getInitialObjectsForRoomType = (roomType: string, style: string): RoomObject[] => {
  const room = roomType.toLowerCase();
  const floorMat = style === "Luxury" ? "granite" : "wood_light";
  const wallMat = style === "Minimalist" ? "#ffffff" : style === "Luxury" ? "#1e293b" : "#f1f5f9";
  
  const baseObjects = [
    { id: "floor-1", object_type: "floor", position_x: 0, position_y: 0, position_z: 0, rotation: 0, scale: 1, material: floorMat },
    { id: "wall-1", object_type: "wall", position_x: 0, position_y: 1.5, position_z: -4, rotation: 0, scale: 1, material: wallMat }
  ];

  if (room.includes("bed")) {
    return [
      ...baseObjects,
      { id: "bed-1", object_type: "bed", position_x: 0, position_y: 0, position_z: -2.5, rotation: 3.14, scale: 1.05, material: "leather_brown" },
      { id: "chair-1", object_type: "chair", position_x: 1.2, position_y: 0, position_z: -1.8, rotation: 1.57, scale: 0.9, material: "#334155" },
      { id: "lamp-1", object_type: "lamp", position_x: -1.2, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.0, material: "#fbbf24" }
    ];
  } else if (room.includes("office") || room.includes("work") || room.includes("study")) {
    return [
      ...baseObjects,
      { id: "desk-1", object_type: "desk", position_x: 0, position_y: 0, position_z: -2.2, rotation: 3.14, scale: 1.0, material: "wood_dark" },
      { id: "chair-1", object_type: "chair", position_x: 0, position_y: 0, position_z: -1.5, rotation: 0, scale: 0.9, material: "#1f2937" },
      { id: "lamp-1", object_type: "lamp", position_x: -0.5, position_y: 0.75, position_z: -2.2, rotation: 0, scale: 1.0, material: "#fafafa" }
    ];
  } else if (room.includes("kitchen") || room.includes("dining")) {
    return [
      ...baseObjects,
      { id: "desk-1", object_type: "desk", position_x: 0, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.1, material: "marble" },
      { id: "chair-1", object_type: "chair", position_x: -0.8, position_y: 0, position_z: -2.5, rotation: -1.57, scale: 0.9, material: "wood_light" },
      { id: "chair-2", object_type: "chair", position_x: 0.8, position_y: 0, position_z: -2.5, rotation: 1.57, scale: 0.9, material: "wood_light" }
    ];
  } else {
    // Default to Living Room
    return [
      ...baseObjects,
      { id: "sofa-1", object_type: "sofa", position_x: 0, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.0, material: "#cbd5e1" },
      { id: "coffee-table-1", object_type: "coffee_table", position_x: 0, position_y: 0, position_z: -1.2, rotation: 0, scale: 1.0, material: "#78350f" },
      { id: "lamp-1", object_type: "lamp", position_x: -1.5, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.0, material: "#fbbf24" }
    ];
  }
};

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStyle = searchParams.get("style") || "Modern";

  const [user, setUser] = useState<any | null>(null);
  const designId = searchParams.get("designId");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const [roomType, setRoomType] = useState<string>("Living Room");
  const [roomWidth, setRoomWidth] = useState(10);
  const [roomDepth, setRoomDepth] = useState(10);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(0);

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
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
        let currentObjects = [];
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
          setHasLoadedFromDb(true);
          currentObjects = mappedObjects;
        }

        // Fetch project details to load the user's actual room photo as background
        if (designData && designData.project_id) {
          setProjectId(designData.project_id);
          try {
            const projRes = await fetch(`http://localhost:8080/api/projects/${designData.project_id}`);
            if (projRes.ok) {
              const projectData = await projRes.json();
              if (projectData && projectData.structural_analysis) {
                try {
                  const struct = JSON.parse(projectData.structural_analysis);
                  if (struct.room_width) setRoomWidth(Number(struct.room_width));
                  if (struct.room_depth) setRoomDepth(Number(struct.room_depth));
                } catch (e) {
                  console.warn("Failed to parse structural analysis dimensions:", e);
                }
              }
              if (projectData && projectData.thumbnail) {
                if (!projectData.thumbnail.includes("unsplash.com")) {
                  setBgImageUrl(projectData.thumbnail);
                }
              }
              if (projectData && projectData.room_type) {
                setRoomType(projectData.room_type);
                if (currentObjects.length === 0) {
                  const initialObjs = getInitialObjectsForRoomType(projectData.room_type, initialStyle);
                  setObjects(initialObjs);
                  
                  // Save them to database so they persist
                  try {
                    const savedObjs: RoomObject[] = [];
                    for (const obj of initialObjs) {
                      const resSave = await fetch(`http://localhost:8080/api/designs/${designId}/objects`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          object_type: obj.object_type,
                          position_x: obj.position_x,
                          position_y: obj.position_y,
                          position_z: obj.position_z,
                          rotation: obj.rotation,
                          scale: obj.scale,
                          material: obj.material
                        })
                      });
                      if (resSave.ok) {
                        const savedData = await resSave.json();
                        savedObjs.push({
                          id: savedData.id,
                          object_type: savedData.object_type,
                          position_x: savedData.position_x,
                          position_y: savedData.position_y,
                          position_z: savedData.position_z,
                          rotation: savedData.rotation,
                          scale: savedData.scale,
                          material: savedData.material
                        });
                      }
                    }
                    if (savedObjs.length > 0) {
                      setObjects(savedObjs);
                      setHasLoadedFromDb(true);
                    }
                  } catch (saveErr) {
                    console.warn("Failed to automatically save initial room objects to database:", saveErr);
                  }
                }
              }
            }
          } catch (projErr) {
            console.warn("Failed to load project details for background image:", projErr);
          }
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
  const [activeLeftTab, setActiveLeftTab] = useState<"library" | "recommendations" | "imgTo3D">("library");
  const [recommendQuery, setRecommendQuery] = useState(initialStyle);
  const [recommendLimit, setRecommendLimit] = useState(5);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  // Image-to-3D states
  const [imgTo3DFile, setImgTo3DFile] = useState<string | null>(null);
  const [imgTo3DStatus, setImgTo3DStatus] = useState<"idle" | "uploaded" | "processing" | "completed">("idle");
  const [imgTo3DProgress, setImgTo3DProgress] = useState<number>(0);
  const [imgTo3DLogs, setImgTo3DLogs] = useState<string[]>([]);
  const [detectedCategory, setDetectedCategory] = useState<"sofa" | "coffee_table" | "desk" | "chair" | "bed" | "lamp">("chair");
  const [detectedMaterial, setDetectedMaterial] = useState<string>("#5c4033");

  // Auto-apply starting style presets only if we haven't loaded objects from database
  useEffect(() => {
    if (initialStyle && !hasLoadedFromDb) {
      applyStylePreset(initialStyle);
      setRecommendQuery(initialStyle);
    }
  }, [initialStyle, hasLoadedFromDb]);

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
  const mapCategoryTo3DType = (category: string): "sofa" | "coffee_table" | "desk" | "chair" | "bed" | "lamp" => {
    const cat = category.toLowerCase();
    if (cat === "sofa") return "sofa";
    if (cat === "table" || cat === "coffee_table") return "coffee_table";
    if (cat === "desk") return "desk";
    if (cat === "chair") return "chair";
    if (cat === "bed") return "bed";
    if (cat === "lighting" || cat === "lamp") return "lamp";
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

  const handleUpdateRoomDimensions = async (width: number, depth: number) => {
    setRoomWidth(width);
    setRoomDepth(depth);

    const activeProjId = projectId || sessionStorage.getItem("homeverse_project_id");
    if (!activeProjId) return;

    try {
      // Fetch current project to preserve other structural_analysis properties
      const projRes = await fetch(`http://localhost:8080/api/projects/${activeProjId}`);
      let currentStruct: any = {};
      if (projRes.ok) {
        const projectData = await projRes.json();
        if (projectData.structural_analysis) {
          try {
            currentStruct = JSON.parse(projectData.structural_analysis);
          } catch (e) {}
        }
      }

      currentStruct.room_width = width;
      currentStruct.room_depth = depth;

      await fetch(`http://localhost:8080/api/projects/${activeProjId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          structural_analysis: JSON.stringify(currentStruct)
        })
      });
    } catch (err) {
      console.warn("Failed to sync room dimensions to backend:", err);
    }
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

  const handleStartImgTo3D = () => {
    setImgTo3DStatus("processing");
    setImgTo3DProgress(0);
    setImgTo3DLogs(["Loading silhouette segmentation module...", "Analyzing depth boundaries..."]);

    const processInterval = setInterval(() => {
      setImgTo3DProgress((prev) => {
        const next = prev + 10;
        
        if (next === 20) {
          setImgTo3DLogs((l) => [...l, "Generating occupancy network grid..."]);
        } else if (next === 40) {
          setImgTo3DLogs((l) => [...l, "Tracing contour points: 2,408 vertices extracted..."]);
        } else if (next === 60) {
          setImgTo3DLogs((l) => [...l, "Fitting basic primitives to mesh structure..."]);
        } else if (next === 80) {
          setImgTo3DLogs((l) => [...l, "Synthesizing material textures & normal mapping..."]);
        } else if (next === 90) {
          setImgTo3DLogs((l) => [...l, "Smoothing mesh normals & finalizing format..."]);
        }

        if (next >= 100) {
          clearInterval(processInterval);
          setImgTo3DStatus("completed");
          setImgTo3DLogs((l) => [...l, "3D Object generation successful! Ready to place in scene."]);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleStartImgTo3D = () => {
    setImgTo3DStatus("processing");
    setImgTo3DProgress(0);
    setImgTo3DLogs(["Loading silhouette segmentation module...", "Analyzing depth boundaries..."]);

    const processInterval = setInterval(() => {
      setImgTo3DProgress((prev) => {
        const next = prev + 10;
        
        if (next === 20) {
          setImgTo3DLogs((l) => [...l, "Generating occupancy network grid..."]);
        } else if (next === 40) {
          setImgTo3DLogs((l) => [...l, "Tracing contour points: 2,408 vertices extracted..."]);
        } else if (next === 60) {
          setImgTo3DLogs((l) => [...l, "Fitting basic primitives to mesh structure..."]);
        } else if (next === 80) {
          setImgTo3DLogs((l) => [...l, "Synthesizing material textures & normal mapping..."]);
        } else if (next === 90) {
          setImgTo3DLogs((l) => [...l, "Smoothing mesh normals & finalizing format..."]);
        }

        if (next >= 100) {
          clearInterval(processInterval);
          setImgTo3DStatus("completed");
          setImgTo3DLogs((l) => [...l, "3D Object generation successful! Ready to place in scene."]);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  // Add object from asset catalog or recommender
  const handleAddObject = async (
    type: "sofa" | "coffee_table" | "desk" | "chair" | "bed" | "lamp" | "partition",
    customMaterial?: string,
    customScale?: number,
    customY?: number
  ) => {
    const defaultMat = type === "sofa" 
      ? "#ec4899" 
      : type === "desk" 
        ? "#4b5563" 
        : type === "coffee_table" 
          ? "#f59e0b" 
          : type === "chair" 
            ? "#475569" 
            : type === "bed" 
              ? "#1e3a8a" 
              : type === "lamp"
                ? "#eab308"
                : "#e2e8f0";
    const newObjLocal: RoomObject = {
      id: `temp-${Date.now()}`,
      object_type: type,
      position_x: (Math.random() - 0.5) * 3,
      position_y: customY ?? (activeFloor * 3.0),
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
      const wall = objects.find((o) => o.object_type === "wall");
      if (wall) {
        handleUpdateObject(wall.id, payload);
      } else {
        setObjects((prev) =>
          prev.map((o) => (o.object_type === "wall" ? { ...o, ...payload } : o))
        );
      }
    } else if (actionType === "update_floor") {
      const floor = objects.find((o) => o.object_type === "floor");
      if (floor) {
        handleUpdateObject(floor.id, payload);
      } else {
        setObjects((prev) =>
          prev.map((o) => (o.object_type === "floor" ? { ...o, ...payload } : o))
        );
      }
    } else if (actionType === "update_sofa") {
      const sofa = objects.find((o) => o.object_type === "sofa");
      if (sofa) {
        handleUpdateObject(sofa.id, payload);
      } else {
        setObjects((prev) =>
          prev.map((o) => (o.object_type === "sofa" ? { ...o, ...payload } : o))
        );
      }
    } else if (actionType === "add_object") {
      handleAddObject(payload.object_type, payload.material, payload.scale);
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
            onClick={() => router.push("/upload")}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Room Selection"
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
              <span className="text-[9px] px-2 py-0.5 bg-green-950/40 text-green-400 border border-green-900/60 rounded-full font-semibold flex items-center gap-1 font-mono uppercase">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" /> Synced to Database
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Interactive 3D Editor Sandbox</p>
          </div>
        </div>

        {/* Exporter Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sessionStorage.removeItem("homeverse_upload_step");
              sessionStorage.removeItem("homeverse_generated_designs");
              sessionStorage.removeItem("homeverse_selected_style");
              sessionStorage.removeItem("homeverse_uploaded_file_url");
              sessionStorage.removeItem("homeverse_file_type");
              sessionStorage.removeItem("homeverse_project_title");
              sessionStorage.removeItem("homeverse_room_type");
              sessionStorage.removeItem("homeverse_file_name");
              sessionStorage.removeItem("homeverse_project_id");
              router.push("/upload");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer mr-1"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" /> Upload Another Image
          </button>

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
                  sessionStorage.removeItem("user");
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
          <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveLeftTab("library")}
              className={`flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "library"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setActiveLeftTab("recommendations")}
              className={`flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "recommendations"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Shop
            </button>
            <button
              onClick={() => setActiveLeftTab("imgTo3D")}
              className={`flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "imgTo3D"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Img-to-3D
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

                    <button
                      onClick={() => handleAddObject("chair")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-purple-950/20 border border-purple-900/40 rounded-lg text-purple-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Chair</p>
                        <span className="text-[10px] text-slate-500 font-normal">Ergonomic or accent chair</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("bed")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-indigo-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Bed</p>
                        <span className="text-[10px] text-slate-500 font-normal">Queen/King bed frame</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("lamp")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-yellow-950/20 border border-yellow-900/40 rounded-lg text-yellow-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Lamp</p>
                        <span className="text-[10px] text-slate-500 font-normal">Floor or desk lamp</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("partition")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Partition Wall</p>
                        <span className="text-[10px] text-slate-500 font-normal">Dividing partition wall</span>
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
                          {item.tier && (
                            <span className={`absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              item.tier === "budget" 
                                ? "bg-emerald-950/90 text-emerald-400 border border-emerald-800/50" 
                                : "bg-amber-950/90 text-amber-400 border border-amber-800/50"
                            }`}>
                              {item.tier === "budget" ? "Budget Friendly" : "Premium Pick"}
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 text-[9px] bg-slate-950/80 border border-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            {item.price}
                          </span>
                        </div>

                        {/* Title and Category */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-[11px] text-slate-200 line-clamp-1">{item.name}</h4>
                        <div className="flex gap-2.5">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-slate-800/80"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                            <p className="text-[10px] text-slate-400 capitalize">{item.category} • {item.style}</p>
                            <p className="text-[10px] font-mono text-blue-400 font-bold mt-0.5">{item.price}</p>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                          {item.description}
                        </p>

                        {/* Action: Add to scene & Shop link */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAddObject(
                              mapCategoryTo3DType(item.category),
                              mapProductToMaterial(item.name),
                              item.category === "Chair" ? 0.65 : item.category === "Lighting" ? 0.8 : 1.0
                            )}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-650 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                          {item.product_url && (
                            <a
                              href={item.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700/60"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Shop
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeLeftTab === "imgTo3D" && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-3">Image-to-3D Object Scan</span>
                  
                  {imgTo3DStatus === "idle" && (
                    <div className="space-y-4">
                      <div className="border border-dashed border-slate-805 rounded-xl p-4 text-center text-slate-400 text-xs">
                        <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-550" />
                        <p>Upload a photo of furniture</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">We will extract the silhouette and style preset</p>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-550 block font-mono">Or select a preset item:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setImgTo3DFile("https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=200");
                              setDetectedCategory("chair");
                              setDetectedMaterial("#b45309");
                              setImgTo3DStatus("uploaded");
                              setImgTo3DLogs(["Retro accent chair photo loaded."]);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg text-[9px] text-slate-350 cursor-pointer"
                          >
                            <img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=150" alt="Chair" className="w-full h-10 object-cover rounded mb-1" />
                            Oak Chair
                          </button>
                          <button
                            onClick={() => {
                              setImgTo3DFile("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=200");
                              setDetectedCategory("sofa");
                              setDetectedMaterial("#0f766e");
                              setImgTo3DStatus("uploaded");
                              setImgTo3DLogs(["Classic velvet sofa photo loaded."]);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg text-[9px] text-slate-350 cursor-pointer"
                          >
                            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150" alt="Sofa" className="w-full h-10 object-cover rounded mb-1" />
                            Velvet Sofa
                          </button>
                          <button
                            onClick={() => {
                              setImgTo3DFile("https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=200");
                              setDetectedCategory("desk");
                              setDetectedMaterial("#374151");
                              setImgTo3DStatus("uploaded");
                              setImgTo3DLogs(["Industrial study desk photo loaded."]);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-1.5 rounded-lg text-[9px] text-slate-350 cursor-pointer"
                          >
                            <img src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=150" alt="Desk" className="w-full h-10 object-cover rounded mb-1" />
                            Slate Desk
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(imgTo3DStatus === "uploaded" || imgTo3DStatus === "processing" || imgTo3DStatus === "completed") && (
                    <div className="space-y-4 font-sans">
                      {/* Viewfinder frame */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col justify-center items-center">
                        {imgTo3DFile && (
                          <img src={imgTo3DFile} alt="Target" className="w-full h-full object-cover opacity-60" />
                        )}
                        
                        {imgTo3DStatus === "processing" && (
                          <div className="absolute inset-0 bg-slate-950/50 flex flex-col justify-center items-center text-center p-3 select-none">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-[10px] font-mono text-blue-400 font-bold">RECONSTRUCTING MESH... {imgTo3DProgress}%</p>
                          </div>
                        )}

                        {imgTo3DStatus === "completed" && (
                          <div className="absolute inset-0 bg-slate-950/85 flex flex-col justify-center items-center text-center p-3 select-none">
                            <div className="w-8 h-8 bg-green-500/20 border border-green-550 text-green-400 rounded-full flex items-center justify-center font-bold text-sm mb-2">✓</div>
                            <p className="text-[10px] font-mono text-green-400 font-bold">RECONSTRUCTION COMPLETE</p>
                            <p className="text-[8px] text-slate-400 capitalize mt-0.5">Asset Type: {detectedCategory}</p>
                          </div>
                        )}
                      </div>

                      {/* Diagnostic Logs HUD */}
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[8px] text-slate-450 space-y-0.5">
                        {imgTo3DLogs.slice(-2).map((log, idx) => (
                          <p key={idx} className={log.includes("successful") ? "text-green-400" : ""}>{log}</p>
                        ))}
                      </div>

                      {/* Controls */}
                      {imgTo3DStatus === "uploaded" && (
                        <button
                          onClick={handleStartImgTo3D}
                          className="w-full bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Reconstruct 3D Mesh
                        </button>
                      )}

                      {imgTo3DStatus === "completed" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setImgTo3DStatus("idle");
                              setImgTo3DFile(null);
                            }}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              handleAddObject(detectedCategory, detectedMaterial, 1.0);
                              setImgTo3DStatus("idle");
                              setImgTo3DFile(null);
                            }}
                            className="flex-2 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 animate-bounce"
                          >
                            Add Object to Scene
                          </button>
                        </div>
                      )}
                    </div>
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

        {/* Center: Dual Canvas view switcher */}
        <main className="flex-1 p-4 bg-slate-950 flex flex-col min-w-0 gap-3">
          {/* View mode toggle header */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 backdrop-blur-md gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Perspective:</span>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                  <button
                    onClick={() => setViewMode("2D")}
                    className={`text-xs px-3.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
                      viewMode === "2D"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    2D Floor Plan
                  </button>
                  <button
                    onClick={() => setViewMode("3D")}
                    className={`text-xs px-3.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
                      viewMode === "3D"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    3D Staging
                  </button>
                </div>
              </div>

              {/* Floor Level Selector */}
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Floor Level:</span>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                  <button
                    onClick={() => setActiveFloor(0)}
                    className={`text-xs px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                      activeFloor === 0
                        ? "bg-indigo-650 text-white shadow-sm font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Ground
                  </button>
                  <button
                    onClick={() => setActiveFloor(1)}
                    className={`text-xs px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                      activeFloor === 1
                        ? "bg-indigo-650 text-white shadow-sm font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Floor 1
                  </button>
                  <button
                    onClick={() => setActiveFloor(2)}
                    className={`text-xs px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                      activeFloor === 2
                        ? "bg-indigo-650 text-white shadow-sm font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Floor 2
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 font-medium">
              Dimensions: <span className="font-mono text-slate-350 font-bold">{roomWidth.toFixed(1)}m × {roomDepth.toFixed(1)}m</span>
            </div>
          </div>

          <div className="flex-1 relative min-h-[400px]">
            {viewMode === "2D" ? (
              <BlueprintEditor2D
                objects={objects}
                selectedObjectId={selectedObjectId}
                onSelectObject={setSelectedObjectId}
                onUpdateObject={handleUpdateObject}
                onDeleteObject={handleDeleteObject}
                onAddObject={handleAddObject}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
                onUpdateRoomDimensions={handleUpdateRoomDimensions}
                activeFloor={activeFloor}
              />
            ) : (
              <CanvasContainer
                objects={objects}
                selectedObjectId={selectedObjectId}
                onSelectObject={setSelectedObjectId}
                backgroundImageUrl={bgImageUrl}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
                activeFloor={activeFloor}
              />
            )}
          </div>
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
