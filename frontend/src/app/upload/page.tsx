"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CanvasContainer from "@/components/studio/CanvasContainer";
import { 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Check, 
  Layers, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  LogOut,
  User,
  Home,
  DollarSign
} from "lucide-react";

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (_) {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getFurnishedTemplateObjects = (
  roomType: string,
  style: string,
  facing: string,
  roomWidth: number,
  roomDepth: number
) => {
  const objects: any[] = [];
  const baseColor = (style === "Luxury" || style === "Modern Luxury") ? "#1e293b" : style === "Minimalist" ? "#f8fafc" : "#cbd5e1";
  const accentColor = (style === "Luxury" || style === "Modern Luxury") ? "#b45309" : style === "Japandi" ? "#0f766e" : "#3b82f6";

  // Center coordinates
  const cx = 0;
  const cz = 0;

  // Let's place furniture based on room type
  if (roomType === "Living Room") {
    // Sofa, Coffee Table, TV Console, AC, Rug, Plant Box
    if (facing === "North") {
      objects.push(
        { object_type: "sofa", material: accentColor, position_x: cx, position_y: 0, position_z: roomDepth / 2 - 0.8, rotation: 0, scale: 1.0 },
        { object_type: "coffee_table", material: "#d97706", position_x: cx, position_y: 0, position_z: roomDepth / 2 - 1.8, rotation: 0, scale: 1.0 },
        { object_type: "tv", material: "#1e293b", position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 0.3, rotation: Math.PI, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: cx, position_y: 2.2, position_z: -roomDepth / 2 + 0.1, rotation: Math.PI, scale: 1.0 },
        { object_type: "rug", material: "#e2e8f0", position_x: cx, position_y: 0.01, position_z: roomDepth / 2 - 1.8, rotation: 0, scale: 1.2 },
        { object_type: "flower_pot", material: "#10b981", position_x: -roomWidth / 2 + 0.6, position_y: 0, position_z: -roomDepth / 2 + 0.6, rotation: 0, scale: 1.0 }
      );
    } else if (facing === "East") {
      objects.push(
        { object_type: "sofa", material: accentColor, position_x: -roomWidth / 2 + 0.8, position_y: 0, position_z: cz, rotation: Math.PI / 2, scale: 1.0 },
        { object_type: "coffee_table", material: "#d97706", position_x: -roomWidth / 2 + 1.8, position_y: 0, position_z: cz, rotation: Math.PI / 2, scale: 1.0 },
        { object_type: "tv", material: "#1e293b", position_x: roomWidth / 2 - 0.3, position_y: 0, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: roomWidth / 2 - 0.1, position_y: 2.2, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 },
        { object_type: "rug", material: "#e2e8f0", position_x: -roomWidth / 2 + 1.8, position_y: 0.01, position_z: cz, rotation: Math.PI / 2, scale: 1.2 },
        { object_type: "flower_pot", material: "#10b981", position_x: -roomWidth / 2 + 0.6, position_y: 0, position_z: -roomDepth / 2 + 0.6, rotation: 0, scale: 1.0 }
      );
    } else if (facing === "West") {
      objects.push(
        { object_type: "sofa", material: accentColor, position_x: roomWidth / 2 - 0.8, position_y: 0, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 },
        { object_type: "coffee_table", material: "#d97706", position_x: roomWidth / 2 - 1.8, position_y: 0, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 },
        { object_type: "tv", material: "#1e293b", position_x: -roomWidth / 2 + 0.3, position_y: 0, position_z: cz, rotation: Math.PI / 2, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: -roomWidth / 2 + 0.1, position_y: 2.2, position_z: cz, rotation: Math.PI / 2, scale: 1.0 },
        { object_type: "rug", material: "#e2e8f0", position_x: roomWidth / 2 - 1.8, position_y: 0.01, position_z: cz, rotation: -Math.PI / 2, scale: 1.2 },
        { object_type: "flower_pot", material: "#10b981", position_x: roomWidth / 2 - 0.6, position_y: 0, position_z: roomDepth / 2 - 0.6, rotation: 0, scale: 1.0 }
      );
    } else { // South
      objects.push(
        { object_type: "sofa", material: accentColor, position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 0.8, rotation: Math.PI, scale: 1.0 },
        { object_type: "coffee_table", material: "#d97706", position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 1.8, rotation: Math.PI, scale: 1.0 },
        { object_type: "tv", material: "#1e293b", position_x: cx, position_y: 0, position_z: roomDepth / 2 - 0.3, rotation: 0, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: cx, position_y: 2.2, position_z: roomDepth / 2 - 0.1, rotation: 0, scale: 1.0 },
        { object_type: "rug", material: "#e2e8f0", position_x: cx, position_y: 0.01, position_z: -roomDepth / 2 + 1.8, rotation: Math.PI, scale: 1.2 },
        { object_type: "flower_pot", material: "#10b981", position_x: roomWidth / 2 - 0.6, position_y: 0, position_z: roomDepth / 2 - 0.6, rotation: 0, scale: 1.0 }
      );
    }
  } else if (roomType === "Bedroom") {
    // Bed, Nightstand, Wardrobe, AC, Armchair, Rug
    if (facing === "North" || facing === "East") {
      objects.push(
        { object_type: "bed", material: baseColor, position_x: cx, position_y: 0, position_z: roomDepth / 2 - 1.1, rotation: 0, scale: 1.0 },
        { object_type: "nightstand", material: "#78350f", position_x: -1.2, position_y: 0, position_z: roomDepth / 2 - 0.5, rotation: 0, scale: 1.0 },
        { object_type: "nightstand", material: "#78350f", position_x: 1.2, position_y: 0, position_z: roomDepth / 2 - 0.5, rotation: 0, scale: 1.0 },
        { object_type: "wardrobe", material: "#4b5563", position_x: -roomWidth / 2 + 0.6, position_y: 0, position_z: -roomDepth / 2 + 1.2, rotation: Math.PI / 2, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: cx, position_y: 2.2, position_z: -roomDepth / 2 + 0.1, rotation: Math.PI, scale: 1.0 },
        { object_type: "armchair", material: accentColor, position_x: roomWidth / 2 - 0.8, position_y: 0, position_z: -roomDepth / 2 + 0.8, rotation: -Math.PI / 4, scale: 1.0 },
        { object_type: "rug", material: "#f1f5f9", position_x: cx, position_y: 0.01, position_z: roomDepth / 2 - 2.2, rotation: 0, scale: 1.1 }
      );
    } else { // South / West
      objects.push(
        { object_type: "bed", material: baseColor, position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 1.1, rotation: Math.PI, scale: 1.0 },
        { object_type: "nightstand", material: "#78350f", position_x: -1.2, position_y: 0, position_z: -roomDepth / 2 + 0.5, rotation: Math.PI, scale: 1.0 },
        { object_type: "nightstand", material: "#78350f", position_x: 1.2, position_y: 0, position_z: -roomDepth / 2 + 0.5, rotation: Math.PI, scale: 1.0 },
        { object_type: "wardrobe", material: "#4b5563", position_x: roomWidth / 2 - 0.6, position_y: 0, position_z: roomDepth / 2 - 1.2, rotation: -Math.PI / 2, scale: 1.0 },
        { object_type: "ac", material: "#f1f5f9", position_x: cx, position_y: 2.2, position_z: roomDepth / 2 - 0.1, rotation: 0, scale: 1.0 },
        { object_type: "armchair", material: accentColor, position_x: -roomWidth / 2 + 0.8, position_y: 0, position_z: roomDepth / 2 - 0.8, rotation: Math.PI * 0.75, scale: 1.0 },
        { object_type: "rug", material: "#f1f5f9", position_x: cx, position_y: 0.01, position_z: -roomDepth / 2 + 2.2, rotation: Math.PI, scale: 1.1 }
      );
    }
  } else if (roomType === "Office") {
    // Desk, Chair, Bookshelf, AC, Rug, Lamp
    objects.push(
      { object_type: "desk", material: "#1e293b", position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 1.2, rotation: Math.PI, scale: 1.0 },
      { object_type: "chair", material: accentColor, position_x: cx, position_y: 0, position_z: -roomDepth / 2 + 0.6, rotation: 0, scale: 1.0 },
      { object_type: "bookshelf", material: "#78350f", position_x: -roomWidth / 2 + 0.6, position_y: 0, position_z: cz, rotation: Math.PI / 2, scale: 1.0 },
      { object_type: "ac", material: "#f1f5f9", position_x: roomWidth / 2 - 0.1, position_y: 2.2, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 },
      { object_type: "lamp", material: "#fbbf24", position_x: roomWidth / 2 - 0.6, position_y: 0, position_z: roomDepth / 2 - 0.6, rotation: 0, scale: 1.0 },
      { object_type: "rug", material: "#cbd5e1", position_x: cx, position_y: 0.01, position_z: -roomDepth / 2 + 1.2, rotation: 0, scale: 1.0 }
    );
  } else if (roomType === "Kitchen") {
    // Dining Table, Chairs, Refrigerator, AC
    objects.push(
      { object_type: "dining_table", material: baseColor, position_x: cx, position_y: 0, position_z: cz, rotation: 0, scale: 1.0 },
      { object_type: "chair", material: accentColor, position_x: cx, position_y: 0, position_z: -0.8, rotation: 0, scale: 0.85 },
      { object_type: "chair", material: accentColor, position_x: cx, position_y: 0, position_z: 0.8, rotation: Math.PI, scale: 0.85 },
      { object_type: "refrigerator", material: "#cbd5e1", position_x: -roomWidth / 2 + 0.6, position_y: 0, position_z: -roomDepth / 2 + 0.6, rotation: Math.PI / 4, scale: 1.0 },
      { object_type: "ac", material: "#f1f5f9", position_x: roomWidth / 2 - 0.1, position_y: 2.2, position_z: cz, rotation: -Math.PI / 2, scale: 1.0 }
    );
  } else {
    // Other: Stool, Pouf, Mirror, Bench, AC
    objects.push(
      { object_type: "bench", material: baseColor, position_x: cx, position_y: 0, position_z: roomDepth / 2 - 0.6, rotation: 0, scale: 1.0 },
      { object_type: "mirror", material: "#e2e8f0", position_x: cx, position_y: 1.2, position_z: roomDepth / 2 - 0.05, rotation: 0, scale: 1.0 },
      { object_type: "pouf", material: accentColor, position_x: -roomWidth / 2 + 0.8, position_y: 0, position_z: cz, rotation: 0, scale: 1.0 },
      { object_type: "stool", material: "#78350f", position_x: roomWidth / 2 - 0.8, position_y: 0, position_z: cz, rotation: 0, scale: 1.0 },
      { object_type: "ac", material: "#f1f5f9", position_x: cx, position_y: 2.2, position_z: -roomDepth / 2 + 0.1, rotation: Math.PI, scale: 1.0 }
    );
  }

  return objects;
};

const getObjectPositionForRoom = (room: string) => {
  const r = room.toLowerCase();
  if (r.includes("hall") || r.includes("living")) return "20% 30%";
  if (r.includes("master")) return "80% 80%";
  if (r.includes("second")) return "20% 80%";
  if (r.includes("kids") || r.includes("kid")) return "80% 30%";
  if (r.includes("kitchen")) return "70% 20%";
  if (r.includes("bathroom") || r.includes("bath")) return "40% 70%";
  return "center";
};

const getStyleCardInfo = (budgetTier: string, roomType: string, customAmount?: string) => {
  let budgetVal = 10;
  if (budgetTier === "5L") budgetVal = 5;
  else if (budgetTier === "20L") budgetVal = 20;
  else if (budgetTier === "50L") budgetVal = 50;
  else if (budgetTier === "Custom" && customAmount) {
    const numeric = parseInt(customAmount);
    if (!isNaN(numeric)) budgetVal = numeric;
  }

  // Format roomType for pollinations prompt (e.g. Master Bedroom -> master_bedroom, Hall -> hall)
  const roomLabel = roomType.toLowerCase().replace(" / ", "_").replace(" ", "_");

  return [
    {
      name: "Modern",
      image: `https://image.pollinations.ai/prompt/modern_interior_design_style_${roomLabel}_concept?width=400&height=300&nologo=true&seed=100`,
      description: "Clean lines, geometric shapes, simple color palettes, and industrial materials like metal, glass, and steel.",
      budget: `₹ ${(budgetVal * 0.9).toFixed(1)}L - ${(budgetVal * 1.1).toFixed(1)}L`,
      colors: "White, Grey, Wood accents, Black",
      pros: "Timeless appeal, clutter-free, highly functional layouts.",
      cons: "Can feel cold or sterile if missing warm textiles."
    },
    {
      name: "Scandinavian",
      image: `https://image.pollinations.ai/prompt/scandinavian_interior_design_style_cozy_${roomLabel}?width=400&height=300&nologo=true&seed=200`,
      description: "Focuses on functionality, simplicity, and natural beauty. Emphasizes warm wood tones, organic shapes, and natural light.",
      budget: `₹ ${(budgetVal * 0.85).toFixed(1)}L - ${(budgetVal * 1.05).toFixed(1)}L`,
      colors: "Oak, White, Soft pastel accents, Fabric grey",
      pros: "Warm, extremely cozy, excellent natural lighting integration.",
      cons: "Can easily look generic or washed out if not styled carefully."
    },
    {
      name: "Modern Luxury",
      image: `https://image.pollinations.ai/prompt/modern_luxury_interior_design_style_high_end_${roomLabel}?width=400&height=300&nologo=true&seed=300`,
      description: "Bespoke high-end finishes, custom-built panels, premium marble surfaces, gold or brass accents, and grand custom furniture.",
      budget: `₹ ${(budgetVal * 1.2).toFixed(1)}L - ${(budgetVal * 1.5).toFixed(1)}L`,
      colors: "Marble Calacatta, Polished Gold, Dark Veneer, Charcoal",
      pros: "Sophisticated, premium look, boosts resale value.",
      cons: "Highest expense tier, requires precise material coordination."
    },
    {
      name: "Japandi",
      image: `https://image.pollinations.ai/prompt/japandi_interior_design_style_minimalist_${roomLabel}?width=400&height=300&nologo=true&seed=400`,
      description: "A hybrid of Japanese minimalism and Scandinavian warmth. Natural raw wood, low furniture, paper lamps, and clay planters.",
      budget: `₹ ${(budgetVal * 0.9).toFixed(1)}L - ${(budgetVal * 1.1).toFixed(1)}L`,
      colors: "Light Wood, Beige, Sand, Oatmeal, Terracotta",
      pros: "Calming, zen-like aesthetics, organic materials.",
      cons: "Harder to source specific matching low-profile furniture."
    },
    {
      name: "Industrial",
      image: `https://image.pollinations.ai/prompt/industrial_loft_interior_design_style_${roomLabel}?width=400&height=300&nologo=true&seed=500`,
      description: "Exposed architectural features such as brick walls, concrete structures, black steel framing, and rustic dark timbers.",
      budget: `₹ ${(budgetVal * 0.95).toFixed(1)}L - ${(budgetVal * 1.15).toFixed(1)}L`,
      colors: "Concrete grey, Black metal, Leather brown, Dark Walnut",
      pros: "Robust, hides wear and tear, high unique character.",
      cons: "Can feel dark or echoey, requires sufficient natural light."
    },
    {
      name: "Contemporary",
      image: `https://image.pollinations.ai/prompt/contemporary_interior_design_style_${roomLabel}?width=400&height=300&nologo=true&seed=600`,
      description: "Curvaceous shapes, neutral tone palette with bold statement light fixtures, following current modern-day trends.",
      budget: `₹ ${(budgetVal * 1.0).toFixed(1)}L - ${(budgetVal * 1.25).toFixed(1)}L`,
      colors: "Cream, Taupe, Charcoal, Statement accents",
      pros: "Fresh, trendy, high comfort.",
      cons: "Styles change quickly, can become dated in a few years."
    }
  ];
};

export default function UploadPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");
    if (!userSession) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userSession));
      setAuthChecking(false);
    }
  }, [router]);

  // Active mode state: upload, lidar scan, or build from scratch
  const [activeMode, setActiveMode] = useState<"upload" | "lidar" | "vectorizer" | "scratch">("upload");

  // Scratch wizard states
  const [scratchStep, setScratchStep] = useState<number>(1);
  const [propertyType, setPropertyType] = useState<"independent" | "apartment">("independent");
  const [apartmentType, setApartmentType] = useState<"community" | "single">("single");
  const [communityBlock, setCommunityBlock] = useState<string>("");
  const [hasFloorPlan, setHasFloorPlan] = useState<"yes" | "no">("no");
  const [squareFootage, setSquareFootage] = useState<number>(500);
  const [dimensionsInput, setDimensionsInput] = useState<string>("3.63 m * 3.94 m");
  const [customRoomType, setCustomRoomType] = useState<string>("");
  const [bedroomNameType, setBedroomNameType] = useState<string>("Master Bedroom");
  const [customBedroomName, setCustomBedroomName] = useState<string>("");
  const [houseFacing, setHouseFacing] = useState<string>("North");
  const [selectedLayoutTemplate, setSelectedLayoutTemplate] = useState<string>("layout-a");
  const [numBedrooms, setNumBedrooms] = useState<string>("3");
  const [mainDoorDirection, setMainDoorDirection] = useState<string>("North");
  const [kitchenDoorDirection, setKitchenDoorDirection] = useState<string>("East");
  const [numBathrooms, setNumBathrooms] = useState<string>("2");
  const [numBalconies, setNumBalconies] = useState<string>("2");
  const [dimensionsHouse, setDimensionsHouse] = useState<string>("30 ft * 40 ft");
  const [dimensionsEachRoom, setDimensionsEachRoom] = useState<string>("Hall: 15x20, Kitchen: 10x12, Master Bed: 14x16, Bath: 8x6");
  const [numWindows, setNumWindows] = useState<string>("6");
  const [numDoors, setNumDoors] = useState<string>("8");
  const [numFloors, setNumFloors] = useState<string>("2");
  const [roomsPerFloor, setRoomsPerFloor] = useState<string>("Floor 1: Hall, Kitchen, Bath. Floor 2: 2 Bedrooms, Bath.");
  const [rooftopDesign, setRooftopDesign] = useState<string>("Garden seating area with turf and pergola");
  const [purposeEachFloor, setPurposeEachFloor] = useState<string>("Ground: Living area. First floor: Bedrooms.");
  const [rooftop, setRooftop] = useState<string>("yes");
  const [parking, setParking] = useState<string>("yes");
  const [garden, setGarden] = useState<string>("no");
  const [customBudget, setCustomBudget] = useState<string>("");
  const [masterHouseJson, setMasterHouseJson] = useState<any | null>(null);
  const [isValidatingHouseJson, setIsValidatingHouseJson] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [budgetSelection, setBudgetSelection] = useState<string>("10L");
  const [selectedRoomToDesign, setSelectedRoomToDesign] = useState<string>("Hall");
  const [scratchDesigns, setScratchDesigns] = useState<Array<{
    id: string;
    style: string;
    image_url: string;
    image_url_left?: string;
    image_url_right?: string;
    image_url_back?: string;
    image_url_front?: string;
    status?: "waiting" | "generating" | "completed" | "failed";
  }>>([]);
  const [scratchLayoutDesc, setScratchLayoutDesc] = useState<string>("");
  const [selectedDirection, setSelectedDirection] = useState<"front" | "left" | "right" | "back" | "front_wall">("front");
  const [isGeneratingDirection, setIsGeneratingDirection] = useState<boolean>(false);


  const [selectedScratchDesignId, setSelectedScratchDesignId] = useState<string>("");
  const [isGeneratingScratch, setIsGeneratingScratch] = useState<boolean>(false);
  const [housePlanFile, setHousePlanFile] = useState<File | null>(null);
  const [housePlanUrl, setHousePlanUrl] = useState<string | null>(null);
  const [scratchRoomWidth, setScratchRoomWidth] = useState<string>("3.63");
  const [scratchRoomLength, setScratchRoomLength] = useState<string>("3.94");
  const [isRoomBlueprintCorrect, setIsRoomBlueprintCorrect] = useState<boolean>(true);
  const [roomBlueprintFile, setRoomBlueprintFile] = useState<File | null>(null);

  useEffect(() => {
    if (housePlanFile) {
      const url = URL.createObjectURL(housePlanFile);
      setHousePlanUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setHousePlanUrl(null);
    }
  }, [housePlanFile]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeMode !== "scratch" || scratchStep !== 1) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setHousePlanFile(file);
            console.log("Image captured from clipboard paste:", file.name);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [activeMode, scratchStep]);

  const createHouseModelJson = async () => {
    setIsValidatingHouseJson(true);
    setValidationError(null);
    try {
      const pId = projectId || generateUUID();
      if (!projectId) {
        setProjectId(pId);
        sessionStorage.setItem("homeverse_project_id", pId);
      }

      const detailsObj = {
        mainDoorDirection,
        kitchenDoorDirection,
        numBedrooms,
        numBathrooms,
        numBalconies,
        dimensionsHouse,
        dimensionsEachRoom,
        numWindows,
        numDoors,
        selectedRoomToDesign,
        roomWidth: scratchRoomWidth,
        roomLength: scratchRoomLength,
        ...(propertyType === "independent" ? { numFloors, roomsPerFloor, purposeEachFloor, rooftop, parking, garden } : {})
      };

      const finalBudget = budgetSelection === "Custom" ? customBudget : budgetSelection;

      const formData = new FormData();
      formData.append("project_id", pId);
      formData.append("property_type", propertyType);
      formData.append("budget", finalBudget);
      formData.append("house_details", JSON.stringify(detailsObj));
      if (!isRoomBlueprintCorrect && roomBlueprintFile) {
        formData.append("house_plan_file", roomBlueprintFile);
      } else if (housePlanFile) {
        formData.append("house_plan_file", housePlanFile);
      }

      const res = await fetch("http://localhost:8080/api/ai/create-house-model", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        let errMsg = "Failed to create house model.";
        try {
          const errData = await res.json();
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      setMasterHouseJson(data);
      setScratchStep(3); // Navigate to step 3 JSON display
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || "Failed to create house model. Please check inputs.");
    } finally {
      setIsValidatingHouseJson(false);
    }
  };

  const triggerScratchGeneration = async () => {
    setIsGeneratingScratch(true);
    setScratchStep(4); // Move to Step 4 loading & renders grid
    try {
      const pId = projectId || generateUUID();
      const finalBudget = budgetSelection === "Custom" ? customBudget : budgetSelection;

      const formData = new FormData();
      formData.append("project_id", pId);
      formData.append("room_type", selectedRoomToDesign);
      formData.append("budget", finalBudget);

      // Step 1: Initialize design stubs instantly
      const initRes = await fetch("http://localhost:8080/api/ai/initialize-scratch-designs", {
        method: "POST",
        body: formData
      });

      if (!initRes.ok) {
        let errMsg = "Failed to initialize designs.";
        try {
          const errData = await initRes.json();
          if (errData && errData.detail) {
            errMsg = errData.detail;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const initData = await initRes.json();
      const layoutDesc = initData.layout_desc;
      setScratchLayoutDesc(layoutDesc);

      const initialDesigns = initData.designs.map((d: any, idx: number) => ({
        ...d,
        status: idx === 0 ? "generating" : "waiting"
      }));

      setScratchDesigns(initialDesigns);
      if (initialDesigns.length > 0) {
        setSelectedScratchDesignId(initialDesigns[0].id);
        setSelectedStyle(initialDesigns[0].style);
      }

      // Step 2: Sequentially render each style variant to prevent API rate limits and show progressive loaders in grid
      for (let i = 0; i < initialDesigns.length; i++) {
        const stub = initialDesigns[i];
        
        // Update current stub status to "generating"
        setScratchDesigns((prev) =>
          prev.map((d) => (d.id === stub.id ? { ...d, status: "generating" } : d))
        );

        try {
          const renderFormData = new FormData();
          renderFormData.append("design_id", stub.id);
          renderFormData.append("layout_desc", layoutDesc);
          renderFormData.append("room_type", selectedRoomToDesign);
          renderFormData.append("budget", finalBudget);

          const renderRes = await fetch("http://localhost:8080/api/ai/render-scratch-design", {
            method: "POST",
            body: renderFormData
          });

          if (renderRes.ok) {
            const rendered = await renderRes.json();
            // Update to "completed" and store URL
            setScratchDesigns((prev) =>
              prev.map((d) => (d.id === rendered.id ? { ...rendered, status: "completed" } : d))
            );
          } else {
            console.error(`Failed rendering ${stub.style}`);
            setScratchDesigns((prev) =>
              prev.map((d) => (d.id === stub.id ? { ...d, status: "failed" } : d))
            );
          }
        } catch (e) {
          console.error(`Error rendering ${stub.style}:`, e);
          setScratchDesigns((prev) =>
            prev.map((d) => (d.id === stub.id ? { ...d, status: "failed" } : d))
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate designs. Please try again.");
    } finally {
      setIsGeneratingScratch(false);
    }
  };

  // LiDAR scan states
  const [lidarStatus, setLidarStatus] = useState<"idle" | "scanning" | "completed">("idle");
  const [lidarProgress, setLidarProgress] = useState<number>(0);
  const [lidarPoints, setLidarPoints] = useState<number>(0);
  const [lidarLogs, setLidarLogs] = useState<string[]>([]);

  // Vectorizer states
  const [vectorizerStatus, setVectorizerStatus] = useState<"idle" | "uploaded" | "processing" | "completed">("idle");
  const [vectorizerProgress, setVectorizerProgress] = useState<number>(0);
  const [vectorizerLogs, setVectorizerLogs] = useState<string[]>([]);
  const [useSampleBlueprint, setUseSampleBlueprint] = useState<boolean>(false);

  // Upload/Analysis states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "analyzing" | "complete">("idle");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern");
  const [generatedDesigns, setGeneratedDesigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dynamic Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [customStyleInput, setCustomStyleInput] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);

  // Persistence and custom design naming states
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("My Interior Design");
  const [roomType, setRoomType] = useState<string>("Living Room");
  const [isReady, setIsReady] = useState(false);

  // Calls the backend template-image generator endpoint to get locally cached or generated room styling previews.
  const getTemplateImage = (style: string, facing: string, layout: "layout-a" | "layout-b"): string => {
    // Determine final readable room name
    let targetRoom = roomType;
    if (roomType === "Other") {
      targetRoom = customRoomType.trim() || "Custom Room";
    } else if (roomType === "Bedroom") {
      targetRoom = bedroomNameType === "Custom"
        ? (customBedroomName.trim() || "Custom Bedroom")
        : bedroomNameType;
    }

    const backendUrl = "http://localhost:8080";
    return `${backendUrl}/api/ai/template-image?room_type=${encodeURIComponent(targetRoom)}&style=${encodeURIComponent(style)}&direction=${encodeURIComponent(facing)}&layout=${encodeURIComponent(layout)}`;
  };

  useEffect(() => {
    setImageError(false);
  }, [selectedStyle, uploadStep]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem("homeverse_upload_step");
    if (savedStep && savedStep !== "idle") {
      setUploadStep(savedStep as any);
      
      const savedDesigns = sessionStorage.getItem("homeverse_generated_designs");
      if (savedDesigns) setGeneratedDesigns(JSON.parse(savedDesigns));
      
      const savedStyle = sessionStorage.getItem("homeverse_selected_style");
      if (savedStyle) setSelectedStyle(savedStyle);
      
      const savedUrl = sessionStorage.getItem("homeverse_uploaded_file_url");
      if (savedUrl) setUploadedFileUrl(savedUrl);
      
      const savedType = sessionStorage.getItem("homeverse_file_type");
      if (savedType) setFileType(savedType as any);
      
      const savedProjId = sessionStorage.getItem("homeverse_project_id");
      if (savedProjId) setProjectId(savedProjId);
      
      const savedProjTitle = sessionStorage.getItem("homeverse_project_title");
      if (savedProjTitle) setProjectTitle(savedProjTitle);
      
      const savedRoomType = sessionStorage.getItem("homeverse_room_type");
      if (savedRoomType) setRoomType(savedRoomType);

      const savedFileName = sessionStorage.getItem("homeverse_file_name");
      if (savedFileName) {
        setSelectedFile({ name: savedFileName } as any);
      }
    }

    // Load Scratch config states
    const savedActiveMode = sessionStorage.getItem("homeverse_active_mode");
    if (savedActiveMode) setActiveMode(savedActiveMode as any);

    const savedScratchStep = sessionStorage.getItem("homeverse_scratch_step");
    if (savedScratchStep) setScratchStep(parseInt(savedScratchStep));

    const savedPropertyType = sessionStorage.getItem("homeverse_property_type");
    if (savedPropertyType) setPropertyType(savedPropertyType as any);

    const savedApartmentType = sessionStorage.getItem("homeverse_apartment_type");
    if (savedApartmentType) setApartmentType(savedApartmentType as any);

    const savedCommunityBlock = sessionStorage.getItem("homeverse_community_block");
    if (savedCommunityBlock) setCommunityBlock(savedCommunityBlock);

    const savedHasFloorPlan = sessionStorage.getItem("homeverse_has_floor_plan");
    if (savedHasFloorPlan) setHasFloorPlan(savedHasFloorPlan as any);

    const savedSquareFootage = sessionStorage.getItem("homeverse_square_footage");
    if (savedSquareFootage) setSquareFootage(parseInt(savedSquareFootage));

    const savedDimensionsInput = sessionStorage.getItem("homeverse_dimensions_input");
    if (savedDimensionsInput) setDimensionsInput(savedDimensionsInput);

    const savedHouseFacing = sessionStorage.getItem("homeverse_house_facing");
    if (savedHouseFacing) setHouseFacing(savedHouseFacing);

    const savedSelectedLayoutTemplate = sessionStorage.getItem("homeverse_selected_layout_template");
    if (savedSelectedLayoutTemplate) setSelectedLayoutTemplate(savedSelectedLayoutTemplate);

    const savedNumBedrooms = sessionStorage.getItem("homeverse_num_bedrooms");
    if (savedNumBedrooms) setNumBedrooms(savedNumBedrooms);

    const savedMainDoorDirection = sessionStorage.getItem("homeverse_main_door_direction");
    if (savedMainDoorDirection) setMainDoorDirection(savedMainDoorDirection);

    const savedNumBathrooms = sessionStorage.getItem("homeverse_num_bathrooms");
    if (savedNumBathrooms) setNumBathrooms(savedNumBathrooms);

    const savedNumBalconies = sessionStorage.getItem("homeverse_num_balconies");
    if (savedNumBalconies) setNumBalconies(savedNumBalconies);

    const savedDimensionsHouse = sessionStorage.getItem("homeverse_dimensions_house");
    if (savedDimensionsHouse) setDimensionsHouse(savedDimensionsHouse);

    const savedDimensionsEachRoom = sessionStorage.getItem("homeverse_dimensions_each_room");
    if (savedDimensionsEachRoom) setDimensionsEachRoom(savedDimensionsEachRoom);

    const savedNumWindows = sessionStorage.getItem("homeverse_num_windows");
    if (savedNumWindows) setNumWindows(savedNumWindows);

    const savedNumDoors = sessionStorage.getItem("homeverse_num_doors");
    if (savedNumDoors) setNumDoors(savedNumDoors);

    const savedNumFloors = sessionStorage.getItem("homeverse_num_floors");
    if (savedNumFloors) setNumFloors(savedNumFloors);

    const savedRoomsPerFloor = sessionStorage.getItem("homeverse_rooms_per_floor");
    if (savedRoomsPerFloor) setRoomsPerFloor(savedRoomsPerFloor);

    const savedRooftopDesign = sessionStorage.getItem("homeverse_rooftop_design");
    if (savedRooftopDesign) setRooftopDesign(savedRooftopDesign);

    const savedPurposeEachFloor = sessionStorage.getItem("homeverse_purpose_each_floor");
    if (savedPurposeEachFloor) setPurposeEachFloor(savedPurposeEachFloor);

    const savedRooftop = sessionStorage.getItem("homeverse_rooftop");
    if (savedRooftop) setRooftop(savedRooftop);

    const savedParking = sessionStorage.getItem("homeverse_parking");
    if (savedParking) setParking(savedParking);

    const savedGarden = sessionStorage.getItem("homeverse_garden");
    if (savedGarden) setGarden(savedGarden);

    const savedCustomBudget = sessionStorage.getItem("homeverse_custom_budget");
    if (savedCustomBudget) setCustomBudget(savedCustomBudget);

    const savedMasterHouseJson = sessionStorage.getItem("homeverse_master_house_json");
    if (savedMasterHouseJson) setMasterHouseJson(JSON.parse(savedMasterHouseJson));

    const savedBudgetSelection = sessionStorage.getItem("homeverse_budget_selection");
    if (savedBudgetSelection) setBudgetSelection(savedBudgetSelection);

    const savedSelectedRoomToDesign = sessionStorage.getItem("homeverse_selected_room_to_design");
    if (savedSelectedRoomToDesign) setSelectedRoomToDesign(savedSelectedRoomToDesign);

    const savedScratchDesigns = sessionStorage.getItem("homeverse_scratch_designs");
    if (savedScratchDesigns) setScratchDesigns(JSON.parse(savedScratchDesigns));

    const savedSelectedScratchDesignId = sessionStorage.getItem("homeverse_selected_scratch_design_id");
    if (savedSelectedScratchDesignId) setSelectedScratchDesignId(savedSelectedScratchDesignId);

    const savedRoomWidth = sessionStorage.getItem("homeverse_scratch_room_width");
    if (savedRoomWidth) setScratchRoomWidth(savedRoomWidth);

    const savedRoomLength = sessionStorage.getItem("homeverse_scratch_room_length");
    if (savedRoomLength) setScratchRoomLength(savedRoomLength);

    const savedIsRoomBlueprintCorrect = sessionStorage.getItem("homeverse_is_room_blueprint_correct");
    if (savedIsRoomBlueprintCorrect) setIsRoomBlueprintCorrect(savedIsRoomBlueprintCorrect === "true");

    const savedScratchLayoutDesc = sessionStorage.getItem("homeverse_scratch_layout_desc");
    if (savedScratchLayoutDesc) setScratchLayoutDesc(savedScratchLayoutDesc);

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (scratchLayoutDesc) {
      sessionStorage.setItem("homeverse_scratch_layout_desc", scratchLayoutDesc);
    } else {
      sessionStorage.removeItem("homeverse_scratch_layout_desc");
    }
  }, [scratchLayoutDesc, isReady]);


  // Save states to sessionStorage
  useEffect(() => {
    if (!isReady) return;
    if (uploadStep !== "idle") {
      sessionStorage.setItem("homeverse_upload_step", uploadStep);
    } else {
      sessionStorage.removeItem("homeverse_upload_step");
    }
  }, [uploadStep, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (generatedDesigns.length > 0) {
      sessionStorage.setItem("homeverse_generated_designs", JSON.stringify(generatedDesigns));
    } else {
      sessionStorage.removeItem("homeverse_generated_designs");
    }
  }, [generatedDesigns, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_selected_style", selectedStyle);
  }, [selectedStyle, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (uploadedFileUrl) {
      sessionStorage.setItem("homeverse_uploaded_file_url", uploadedFileUrl);
    } else {
      sessionStorage.removeItem("homeverse_uploaded_file_url");
    }
  }, [uploadedFileUrl, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (fileType) {
      sessionStorage.setItem("homeverse_file_type", fileType);
    } else {
      sessionStorage.removeItem("homeverse_file_type");
    }
  }, [fileType, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (projectId) {
      sessionStorage.setItem("homeverse_project_id", projectId);
    } else {
      sessionStorage.removeItem("homeverse_project_id");
    }
  }, [projectId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (projectTitle) {
      sessionStorage.setItem("homeverse_project_title", projectTitle);
    } else {
      sessionStorage.removeItem("homeverse_project_title");
    }
  }, [projectTitle, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (roomType) {
      sessionStorage.setItem("homeverse_room_type", roomType);
    } else {
      sessionStorage.removeItem("homeverse_room_type");
    }
  }, [roomType, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (selectedFile) {
      sessionStorage.setItem("homeverse_file_name", selectedFile.name);
    } else {
      sessionStorage.removeItem("homeverse_file_name");
    }
  }, [selectedFile, isReady]);

  // Scratch States Observers
  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_active_mode", activeMode);
  }, [activeMode, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_scratch_step", scratchStep.toString());
  }, [scratchStep, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_property_type", propertyType);
  }, [propertyType, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_apartment_type", apartmentType);
  }, [apartmentType, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_community_block", communityBlock);
  }, [communityBlock, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_has_floor_plan", hasFloorPlan);
  }, [hasFloorPlan, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_square_footage", squareFootage.toString());
  }, [squareFootage, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_dimensions_input", dimensionsInput);
  }, [dimensionsInput, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_house_facing", houseFacing);
  }, [houseFacing, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_selected_layout_template", selectedLayoutTemplate);
  }, [selectedLayoutTemplate, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_bedrooms", numBedrooms);
  }, [numBedrooms, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_main_door_direction", mainDoorDirection);
  }, [mainDoorDirection, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_bathrooms", numBathrooms);
  }, [numBathrooms, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_balconies", numBalconies);
  }, [numBalconies, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_dimensions_house", dimensionsHouse);
  }, [dimensionsHouse, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_dimensions_each_room", dimensionsEachRoom);
  }, [dimensionsEachRoom, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_windows", numWindows);
  }, [numWindows, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_doors", numDoors);
  }, [numDoors, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_num_floors", numFloors);
  }, [numFloors, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_rooms_per_floor", roomsPerFloor);
  }, [roomsPerFloor, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_rooftop_design", rooftopDesign);
  }, [rooftopDesign, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_purpose_each_floor", purposeEachFloor);
  }, [purposeEachFloor, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_rooftop", rooftop);
  }, [rooftop, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_parking", parking);
  }, [parking, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_garden", garden);
  }, [garden, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_custom_budget", customBudget);
  }, [customBudget, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (masterHouseJson) {
      sessionStorage.setItem("homeverse_master_house_json", JSON.stringify(masterHouseJson));
    } else {
      sessionStorage.removeItem("homeverse_master_house_json");
    }
  }, [masterHouseJson, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_budget_selection", budgetSelection);
  }, [budgetSelection, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_selected_room_to_design", selectedRoomToDesign);
  }, [selectedRoomToDesign, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (scratchDesigns.length > 0) {
      sessionStorage.setItem("homeverse_scratch_designs", JSON.stringify(scratchDesigns));
    } else {
      sessionStorage.removeItem("homeverse_scratch_designs");
    }
  }, [scratchDesigns, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_selected_scratch_design_id", selectedScratchDesignId);
  }, [selectedScratchDesignId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_scratch_room_width", scratchRoomWidth);
  }, [scratchRoomWidth, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_scratch_room_length", scratchRoomLength);
  }, [scratchRoomLength, isReady]);

  useEffect(() => {
    if (!isReady) return;
    sessionStorage.setItem("homeverse_is_room_blueprint_correct", isRoomBlueprintCorrect ? "true" : "false");
  }, [isRoomBlueprintCorrect, isReady]);

  // Update project title and room type in the database
  const handleUpdateProjectDetails = async (newTitle: string, newRoomType: string) => {
    const activeProjId = projectId || sessionStorage.getItem("homeverse_project_id");
    if (!activeProjId) return;
    try {
      await fetch(`http://localhost:8080/api/projects/${activeProjId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newTitle,
          room_type: newRoomType
        })
      });
    } catch (err) {
      console.warn("Failed to update project details on backend:", err);
    }
  };

  const getFilterForStyle = (style: string) => {
    switch (style) {
      case "Modern":
        return "contrast(1.15) saturate(0.85) brightness(0.95) hue-rotate(-5deg)";
      case "Luxury":
      case "Modern Luxury":
        return "contrast(1.1) saturate(1.25) sepia(0.15) brightness(0.95)";
      case "Scandinavian":
        return "brightness(1.15) contrast(0.95) saturate(1.05) sepia(0.05)";
      case "Minimalist":
        return "brightness(1.1) saturate(0.3) contrast(1.05)";
      case "Japandi":
        return "sepia(0.2) brightness(1.05) saturate(0.9) contrast(0.95)";
      case "Industrial":
        return "contrast(1.2) brightness(0.9) saturate(0.8)";
      case "Contemporary":
        return "contrast(1.05) brightness(1.05) saturate(1.1)";
      default:
        return "none";
    }
  };

  const getMockObjectsForStyle = (style: string) => {
    switch (style) {
      case "Modern":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.0, rotation: 0.0, scale: 1.0, material: "#27272a" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -1.0, rotation: 0.0, scale: 1.0, material: "#78350f" }
        ];
      case "Japandi":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.2, rotation: -0.2, scale: 0.95, material: "#e4e4e7" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -1.1, rotation: 0.0, scale: 1.0, material: "#d97706" }
        ];
      case "Scandinavian":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.0, rotation: 0.3, scale: 1.0, material: "#cbd5e1" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -0.9, rotation: 0.0, scale: 0.9, material: "#fcd34d" }
        ];
      case "Minimalist":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -1.8, rotation: 0.0, scale: 1.0, material: "#f4f4f5" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -0.8, rotation: 1.57, scale: 0.8, material: "#71717a" }
        ];
      case "Luxury":
      case "Modern Luxury":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.1, rotation: -0.1, scale: 1.05, material: "#0f766e" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -1.0, rotation: 0.0, scale: 1.0, material: "#d97706" }
        ];
      case "Industrial":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.0, rotation: 0.0, scale: 1.0, material: "#71717a" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -1.0, rotation: 0.0, scale: 1.0, material: "#18181b" }
        ];
      case "Contemporary":
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.0, rotation: 0.0, scale: 1.0, material: "#e4e4e7" },
          { id: "2", object_type: "coffee_table", position_x: 0.0, position_y: 0.0, position_z: -1.0, rotation: 0.0, scale: 1.0, material: "#d97706" }
        ];
      default:
        return [];
    }
  };

  const styles = [
    { name: "Modern", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350", desc: "Sleek lines, dark wood accents, metal fixtures" },
    { name: "Japandi", img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350", desc: "East meets West. Warm wood, clean canvas, low profile" },
    { name: "Scandinavian", img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350", desc: "Light oak, high contrast, hygge vibes" },
    { name: "Minimalist", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350", desc: "Maximum space, hidden storage, monochrome" },
    { name: "Luxury", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350", desc: "Polished marble, gold lining, velvet upholstery" },
    { name: "Modern Luxury", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350", desc: "Polished marble, gold lining, velvet upholstery" },
    { name: "Industrial", img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350", desc: "Raw concrete, brick walls, dark wood, and metal accents" },
    { name: "Contemporary", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350", desc: "Sleek curved lines, neutral tones, statement lighting" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setFileType(type);
    
    // Create local object URL for previewing
    const fileUrl = URL.createObjectURL(file);
    setUploadedFileUrl(fileUrl);

    // Client-side Room Validation
    const filenameLower = file.name.toLowerCase();
    const nonRoomKeywords = [
      "cat", "dog", "animal", "car", "vehicle", "apple", "banana", "fruit", 
      "outdoor", "outside", "landscape", "nature", "forest", "mountain", 
      "ocean", "beach", "sky", "garden", "park", "street", "exterior",
      "cityscape", "food"
    ];
    let isRoom = true;
    for (const kw of nonRoomKeywords) {
      if (filenameLower.includes(kw)) {
        isRoom = false;
        break;
      }
    }

    if (!isRoom) {
      setError("Not appropriate data supplied to the app. The uploaded file does not appear to be an interior room or home area.");
      setUploadStep("idle");
      setSelectedFile(null);
      return;
    }

    setUploadStep("uploading");

    // Retrieve active user ID
    const userId = user?.id || "d0000000-0000-0000-0000-000000000000";

    try {
      // 1. Create project on backend
      const projTitle = file.name.split(".")[0] || "My Interior Design";
      setProjectTitle(projTitle);
      setRoomType("Living Room");
      let projectData = null;

      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: "Living Room",
            thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350",
            user_id: userId
          })
        });
        if (projRes.ok) {
          projectData = await projRes.json();
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client-side UUID:", err);
      }

      const activeProjId = projectData?.id || generateUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);

      // Trigger UI analysis state
      setTimeout(() => {
        setUploadStep("analyzing");
      }, 800);

      // 2. Upload file & analyze on backend
      const formData = new FormData();
      formData.append("project_id", activeProjId);
      formData.append("file", file);

      let resultData = null;
      try {
        const analyzeRes = await fetch("http://localhost:8080/api/ai/analyze-upload", {
          method: "POST",
          body: formData
        });
        if (analyzeRes.ok) {
          resultData = await analyzeRes.json();
        } else {
          const errData = await analyzeRes.json();
          throw new Error(errData.detail || "Backend analysis failed");
        }
      } catch (err: any) {
        console.warn("Backend analysis failed:", err.message);
        if (err.message.includes("Not appropriate data")) {
          throw err;
        }
        // Fallback mock result
        resultData = {
          project_id: activeProjId,
          detected_room_type: "Living Room",
          structural_analysis: {
            layout_description: "A rectangular room layout with a window on the left.",
            windows: [{ wall: "left", size: "medium" }],
            light_sources: [{ direction: "left", type: "natural" }],
            doors: [{ wall: "back" }],
            room_shape: "rectangular"
          }
        };
      }

      if (resultData && resultData.detected_room_type) {
        setRoomType(resultData.detected_room_type);
        sessionStorage.setItem("homeverse_room_type", resultData.detected_room_type);
      }
      setGeneratedDesigns([]);
      setActiveDesignId(null);
      
      // Delay completion step for smoother UX animation
      setTimeout(() => {
        setUploadStep("complete");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during room analysis. Please try again.");
      setUploadStep("idle");
      setSelectedFile(null);
    }
  };

  const handleGenerateDynamicDesign = async () => {
    if (!projectId) {
      setError("Project ID is missing. Please re-upload your space.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setImageLoading(true);

    try {
      const finalRoom = roomType === "Other" ? (customRoomType.trim() || "Custom Room") : roomType;
      const finalStyle = selectedStyle === "Custom" ? (customStyleInput.trim() || "Custom Style") : selectedStyle;
      
      const formData = new FormData();
      formData.append("project_id", projectId);
      formData.append("room_type", finalRoom);
      formData.append("style", finalStyle);
      if (colorPalette) {
        formData.append("color_palette", colorPalette);
      }
      if (customPrompt) {
        formData.append("custom_prompt", customPrompt);
      }

      const res = await fetch("http://localhost:8080/api/ai/generate-dynamic-design", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate design.");
      }

      const newDesign = await res.json();
      
      // Update designs list
      setGeneratedDesigns((prev) => [...prev, newDesign]);
      setActiveDesignId(newDesign.id);
      setSelectedStyle(newDesign.style);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate dynamic design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateFromScratch = async () => {
    if (!selectedScratchDesignId) {
      setError("Please wait for design generation to complete or select an option.");
      return;
    }
    setError(null);
    setUploadStep("complete");

    // Save selected design details to sessionStorage
    sessionStorage.setItem("homeverse_project_id", projectId || "");
    sessionStorage.setItem("homeverse_project_title", `My Custom ${selectedRoomToDesign}`);
    sessionStorage.setItem("homeverse_room_type", selectedRoomToDesign);
    sessionStorage.setItem("homeverse_selected_style", selectedStyle);
    sessionStorage.setItem("homeverse_upload_step", "complete");

    // Redirect to studio with selected designId and style
    router.push(`/studio?style=${selectedStyle}&designId=${selectedScratchDesignId}`);
  };

  const handleSelectDirection = async (direction: "front" | "left" | "right" | "back" | "front_wall") => {
    setSelectedDirection(direction);
    
    // Find active design
    const activeDesign = scratchDesigns.find((d) => d.id === selectedScratchDesignId);
    if (!activeDesign) return;

    // Check if the image url for this direction is already generated
    let existingUrl = "";
    if (direction === "front") existingUrl = activeDesign.image_url;
    else if (direction === "left") existingUrl = activeDesign.image_url_left || "";
    else if (direction === "right") existingUrl = activeDesign.image_url_right || "";
    else if (direction === "back") existingUrl = activeDesign.image_url_back || "";
    else if (direction === "front_wall") existingUrl = activeDesign.image_url_front || "";

    // If it exists and has already been cached, skip regeneration
    if (existingUrl && !existingUrl.includes("pollinations.ai")) {
      return;
    }

    setIsGeneratingDirection(true);
    try {
      const finalBudget = budgetSelection === "Custom" ? customBudget : budgetSelection;
      
      const formData = new FormData();
      formData.append("design_id", activeDesign.id);
      formData.append("layout_desc", scratchLayoutDesc || "A standard interior layout.");
      formData.append("room_type", selectedRoomToDesign);
      formData.append("budget", finalBudget);
      formData.append("view_direction", direction);

      const renderRes = await fetch("http://localhost:8080/api/ai/render-scratch-design", {
        method: "POST",
        body: formData
      });

      if (renderRes.ok) {
        const rendered = await renderRes.json();
        // Update the scratchDesigns list with the new direction URL
        setScratchDesigns((prev) =>
          prev.map((d) => (d.id === activeDesign.id ? { ...d, ...rendered } : d))
        );
      }
    } catch (err) {
      console.error("Failed to generate direction view:", err);
    } finally {
      setIsGeneratingDirection(false);
    }
  };



  const nextScratchStep = () => {
    setScratchStep((prev) => prev + 1);
  };

  const prevScratchStep = () => {
    setScratchStep((prev) => prev - 1);
  };

  const handleStartLidarScan = () => {
    setLidarStatus("scanning");
    setLidarProgress(0);
    setLidarPoints(0);
    setLidarLogs(["Initializing LiDAR depth sensor...", "Calibrating IMU spatial mapping..."]);

    const scanInterval = setInterval(() => {
      setLidarProgress((prev) => {
        const next = prev + 5;
        setLidarPoints((pts) => pts + Math.floor(Math.random() * 8000) + 4000);
        
        // Push live updates to logs based on scan progress
        if (next === 20) {
          setLidarLogs((l) => [...l, "Mapped floor boundary: 10m x 10m"]);
        } else if (next === 40) {
          setLidarLogs((l) => [...l, "Detecting vertical wall surfaces..."]);
        } else if (next === 60) {
          setLidarLogs((l) => [...l, "Identifying furniture structural meshes..."]);
        } else if (next === 75) {
          setLidarLogs((l) => [...l, "Sofa detected: width=2.0m, depth=0.9m"]);
        } else if (next === 85) {
          setLidarLogs((l) => [...l, "Coffee table detected: width=1.2m, depth=0.7m"]);
        } else if (next === 95) {
          setLidarLogs((l) => [...l, "Optimizing structural wireframe graph..."]);
        }

        if (next >= 100) {
          clearInterval(scanInterval);
          setLidarStatus("completed");
          setLidarLogs((l) => [...l, "Scan complete! Export ready."]);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handleCreateFromLidarScan = async () => {
    setError(null);
    setUploadStep("uploading");

    const userId = user?.id || "d0000000-0000-0000-0000-000000000000";
    const projTitle = projectTitle.trim() || `LiDAR Scan - ${roomType}`;

    try {
      // 1. Create project on backend with custom structural_analysis (room size detected)
      const struct = {
        room_width: 10,
        room_depth: 10,
        scanned_via: "LiDAR"
      };

      let projectIdFromBackend = null;
      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: roomType,
            thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350",
            user_id: userId,
            structural_analysis: JSON.stringify(struct)
          })
        });
        if (projRes.ok) {
          const projectData = await projRes.json();
          projectIdFromBackend = projectData.id;
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client UUID:", err);
      }

      const activeProjId = projectIdFromBackend || generateUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);
      sessionStorage.setItem("homeverse_project_title", projTitle);
      sessionStorage.setItem("homeverse_room_type", roomType);

      // 2. Create design on backend
      let activeDesignId = generateUUID();
      try {
        const designRes = await fetch("http://localhost:8080/api/designs/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_id: activeProjId,
            style: selectedStyle,
            image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350"
          })
        });
        if (designRes.ok) {
          const designData = await designRes.json();
          activeDesignId = designData.id;
        }
      } catch (err) {
        console.warn("Backend design creation failed, fallback to client UUID:", err);
      }

      // 3. Seed detected objects from LiDAR Scan (Sofa, Coffee Table, Lamp)
      const detectedObjs = [
        { object_type: "sofa", position_x: 0, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.0, material: "#ec4899" },
        { object_type: "coffee_table", position_x: 0, position_y: 0, position_z: -1.2, rotation: 0, scale: 1.0, material: "#f59e0b" },
        { object_type: "lamp", position_x: 1.5, position_y: 0, position_z: -2.5, rotation: 0, scale: 1.0, material: "#eab308" }
      ];

      for (const obj of detectedObjs) {
        try {
          await fetch(`http://localhost:8080/api/designs/${activeDesignId}/objects`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...obj,
              design_id: activeDesignId
            })
          });
        } catch (err) {
          console.warn("Failed to seed object on backend:", err);
        }
      }

      setUploadStep("complete");
      router.push(`/studio?style=${selectedStyle}&designId=${activeDesignId}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize LiDAR scanned design.");
      setUploadStep("idle");
    }
  };

  const handleStartVectorizer = () => {
    setVectorizerStatus("processing");
    setVectorizerProgress(0);
    setVectorizerLogs(["Loading blueprint vectorization engine...", "Reading pixel data & image resolution..."]);

    const processInterval = setInterval(() => {
      setVectorizerProgress((prev) => {
        const next = prev + 5;
        
        // Push live updates to logs based on vectorization progress
        if (next === 20) {
          setVectorizerLogs((l) => [...l, "Analyzing scale: 1 pixel = 0.025m"]);
        } else if (next === 40) {
          setVectorizerLogs((l) => [...l, "Tracing outer structural boundaries..."]);
        } else if (next === 60) {
          setVectorizerLogs((l) => [...l, "Vectorizing internal partition walls..."]);
        } else if (next === 80) {
          setVectorizerLogs((l) => [...l, "Detecting furniture contours (Bed, Sofa, Desk)..."]);
        } else if (next === 95) {
          setVectorizerLogs((l) => [...l, "Assembling 3D layout coordinates..."]);
        }

        if (next >= 100) {
          clearInterval(processInterval);
          setVectorizerStatus("completed");
          setVectorizerLogs((l) => [...l, "Vectorization complete! Created 3D layout blueprint successfully."]);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleCreateFromBlueprint = async () => {
    setError(null);
    setUploadStep("uploading");

    const userId = user?.id || "d0000000-0000-0000-0000-000000000000";
    const projTitle = projectTitle.trim() || `Vectorizer - ${roomType}`;

    try {
      // 1. Create project on backend with custom structural_analysis (room size detected)
      const struct = {
        room_width: 11.5,
        room_depth: 9.5,
        scanned_via: "BlueprintVectorizer"
      };

      let projectIdFromBackend = null;
      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: roomType,
            thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350",
            user_id: userId,
            structural_analysis: JSON.stringify(struct)
          })
        });
        if (projRes.ok) {
          const projectData = await projRes.json();
          projectIdFromBackend = projectData.id;
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client UUID:", err);
      }

      const activeProjId = projectIdFromBackend || generateUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);
      sessionStorage.setItem("homeverse_project_title", projTitle);
      sessionStorage.setItem("homeverse_room_type", roomType);

      // 2. Create design on backend
      let activeDesignId = generateUUID();
      try {
        const designRes = await fetch("http://localhost:8080/api/designs/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_id: activeProjId,
            style: selectedStyle,
            image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350"
          })
        });
        if (designRes.ok) {
          const designData = await designRes.json();
          activeDesignId = designData.id;
        }
      } catch (err) {
        console.warn("Backend design creation failed, fallback to client UUID:", err);
      }

      // 3. Seed partition walls and objects based on roomType
      let detectedObjs: any[] = [];
      
      if (roomType === "Bedroom") {
        detectedObjs = [
          // Partition walls separating bedroom and study/bathroom area
          { object_type: "partition", position_x: -2.0, position_y: 0, position_z: -2.5, rotation: 1.57, scale: 1.8, material: "#e2e8f0" }, // vertical divider
          { object_type: "partition", position_x: 2.0, position_y: 0, position_z: -1.0, rotation: 0, scale: 1.2, material: "#e2e8f0" }, // horizontal divider
          // Bedroom furniture
          { object_type: "bed", position_x: 1.0, position_y: 0, position_z: -3.2, rotation: 3.14, scale: 1.0, material: "#1e3a8a" },
          { object_type: "desk", position_x: -3.5, position_y: 0, position_z: -2.2, rotation: 1.57, scale: 1.0, material: "#4b5563" },
          { object_type: "chair", position_x: -2.8, position_y: 0, position_z: -2.2, rotation: -1.57, scale: 1.0, material: "#475569" },
          { object_type: "lamp", position_x: -3.8, position_y: 0, position_z: -3.8, rotation: 0, scale: 1.0, material: "#eab308" }
        ];
      } else {
        // Living Room or office default layout
        detectedObjs = [
          // Partitions
          { object_type: "partition", position_x: 0, position_y: 0, position_z: -3.5, rotation: 0, scale: 1.5, material: "#e2e8f0" },
          // Living room furniture
          { object_type: "sofa", position_x: -1.0, position_y: 0, position_z: -2.0, rotation: 0, scale: 1.0, material: "#ec4899" },
          { object_type: "coffee_table", position_x: -1.0, position_y: 0, position_z: -0.8, rotation: 0, scale: 1.0, material: "#f59e0b" },
          { object_type: "desk", position_x: 3.0, position_y: 0, position_z: -2.5, rotation: -1.57, scale: 1.0, material: "#4b5563" },
          { object_type: "chair", position_x: 2.2, position_y: 0, position_z: -2.5, rotation: 1.57, scale: 1.0, material: "#475569" },
          { object_type: "lamp", position_x: -2.5, position_y: 0, position_z: -2.0, rotation: 0, scale: 1.0, material: "#eab308" }
        ];
      }

      for (const obj of detectedObjs) {
        try {
          await fetch(`http://localhost:8080/api/designs/${activeDesignId}/objects`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...obj,
              design_id: activeDesignId
            })
          });
        } catch (err) {
          console.warn("Failed to seed blueprint object on backend:", err);
        }
      }

      setUploadStep("complete");
      router.push(`/studio?style=${selectedStyle}&designId=${activeDesignId}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize blueprint design.");
      setUploadStep("idle");
    }
  };

  const handleEnterStudio = async () => {
    // Sync final project details before entering studio
    if (projectId) {
      const finalRoom = roomType === "Other" ? (customRoomType.trim() || "Custom Room") : roomType;
      await handleUpdateProjectDetails(projectTitle, finalRoom);
    }

    // Find active design or design matching the selected style
    const activeDesign = generatedDesigns.find((d) => d.id === activeDesignId) || 
                          generatedDesigns.find((d) => d.style.toLowerCase() === selectedStyle.toLowerCase()) ||
                          generatedDesigns[0];
                          
    if (activeDesign) {
      router.push(`/studio?style=${encodeURIComponent(activeDesign.style)}&designId=${activeDesign.id}`);
    } else {
      router.push(`/studio?style=${encodeURIComponent(selectedStyle)}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/5 to-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              HomeVerse
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block -mt-0.5">
              AI Design Studio
            </span>
          </div>
        </div>

        {/* User Info / Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-855 px-3.5 py-2 rounded-xl border border-slate-850 transition-all cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 px-3 py-2 rounded-xl border border-slate-855 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center z-10">
        
        {/* Intro */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex bg-blue-950/30 text-blue-400 border border-blue-900/30 px-3.5 py-1.5 rounded-full text-xs font-semibold gap-1.5 items-center mx-auto shadow-sm">
            <Home className="w-3.5 h-3.5" /> Welcome to HomeVerse, {user?.name || "Designer"}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Upload Your Space
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Upload a photo or a video walkthrough of any room or area in your house. Our AI will automatically reconstruct the space into an interactive 3D model.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/40 text-red-400 rounded-2xl text-sm flex items-start gap-3 max-w-xl mx-auto shadow-lg animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-300">Invalid Upload Attempt</h4>
              <p className="text-xs text-red-450/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-stretch max-w-7xl w-full mx-auto">
          {/* Left Side: Upload console */}
          <div className="w-full md:w-1/2 flex">
            <div className="glass-panel p-6 rounded-3xl border-slate-800/80 flex flex-col justify-between w-full space-y-6 shadow-2xl">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {activeMode === "upload" ? "Upload Console" : activeMode === "scratch" ? "Scratch Designer" : activeMode === "lidar" ? "LiDAR Scanner" : "Blueprint Tracing"}
                </span>
                <span className="text-[9px] text-blue-400 font-semibold px-2 py-0.5 bg-blue-950/40 border border-blue-900/40 rounded-full font-mono uppercase animate-pulse">
                  {activeMode === "upload" ? uploadStep : activeMode === "lidar" ? lidarStatus : activeMode === "vectorizer" ? vectorizerStatus : "Active"}
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => { setActiveMode("upload"); setError(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === "upload"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Reconstruct Room
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveMode("lidar"); setError(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === "lidar"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> LiDAR Scanner
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveMode("vectorizer"); setError(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === "vectorizer"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveMode("scratch"); setError(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === "scratch"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Start Scratch
                </button>
              </div>

              {/* LiDAR Scanner Viewport */}
              {uploadStep === "idle" && activeMode === "lidar" && (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Smartphone scan viewport */}
                  <div className="relative border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-2xl flex flex-col">
                    {/* Viewport Backdrop Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-60"
                      style={{ 
                        backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600')" 
                      }}
                    />

                    {/* Laser scanning line */}
                    {lidarStatus === "scanning" && (
                      <div className="absolute left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_#22c55e] z-10 animate-pulse" 
                           style={{
                             top: `${(Math.sin(lidarProgress / 3) + 1) * 50}%`,
                             transition: "top 0.1s ease-in-out"
                           }}
                      />
                    )}

                    {/* LiDAR Point Cloud Dots Overlay */}
                    {lidarStatus === "scanning" && (
                      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-75"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 1.5}s`,
                              animationDuration: `${1 + Math.random() * 2}s`
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Camera view HUD overlay */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-between z-10 select-none pointer-events-none">
                      {/* Top HUD bar */}
                      <div className="flex justify-between items-center text-[9px] text-slate-350 font-mono bg-slate-950/75 px-2.5 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${lidarStatus === "scanning" ? "bg-red-500 animate-pulse" : "bg-slate-500"}`} />
                           <span>{lidarStatus === "scanning" ? "REC" : "STANDBY"}</span>
                        </div>
                        <div>FPS: 60 | RES: 1.2cm</div>
                        <div>BAT: 94%</div>
                      </div>

                      {/* Center Reticle */}
                      <div className="self-center flex flex-col items-center justify-center gap-2">
                        {lidarStatus === "idle" && (
                          <div className="w-12 h-12 border border-dashed border-white/40 rounded-full flex items-center justify-center animate-spin" />
                        )}
                        {lidarStatus === "scanning" && (
                          <div className="w-16 h-16 border-2 border-green-500/70 rounded-full flex items-center justify-center relative">
                            <div className="absolute w-2 h-2 bg-green-500 rounded-full" />
                            <div className="absolute -top-3 text-[8px] font-mono text-green-400 font-bold bg-slate-950/80 px-1 py-0.5 rounded">
                              {lidarProgress}%
                            </div>
                          </div>
                        )}
                        {lidarStatus === "completed" && (
                          <div className="w-12 h-12 bg-green-500/20 border border-green-400 rounded-full flex items-center justify-center text-green-400 font-bold text-lg">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Bottom Diagnostics HUD */}
                      <div className="flex justify-between items-end gap-3 text-[8px] font-mono text-slate-350 bg-slate-950/75 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
                        <div className="space-y-1">
                          <p>SENSOR: SOLID-STATE LIDAR</p>
                          <p>VERTICES: <span className="text-green-400 font-bold">{lidarPoints.toLocaleString()}</span></p>
                          <p>CONFIDENCE: HIGH</p>
                        </div>
                        <div className="text-right space-y-0.5 max-h-[45px] overflow-hidden text-[7px] text-slate-400">
                          {lidarLogs.slice(-3).map((log, index) => (
                            <p key={index}>{log}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / settings below scanner */}
                  <div className="bg-slate-900/35 border border-slate-900/80 rounded-2xl p-4 space-y-3 flex flex-col">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                          Room Type
                        </label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-600 transition-colors cursor-pointer"
                        >
                          <option value="Living Room">Living Room</option>
                          <option value="Bedroom">Bedroom</option>
                          <option value="Home Office">Home Office</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                          Style Preset
                        </label>
                        <select
                          value={selectedStyle}
                          onChange={(e) => setSelectedStyle(e.target.value)}
                          className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value="Modern">Modern</option>
                          <option value="Japandi">Japandi</option>
                          <option value="Scandinavian">Scandinavian</option>
                          <option value="Minimalist">Minimalist</option>
                          <option value="Modern Luxury">Modern Luxury</option>
                          <option value="Industrial">Industrial</option>
                          <option value="Contemporary">Contemporary</option>
                        </select>
                      </div>
                    </div>

                    {lidarStatus === "idle" && (
                      <button
                        onClick={handleStartLidarScan}
                        className="w-full bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" /> Start LiDAR Scan
                      </button>
                    )}

                    {lidarStatus === "scanning" && (
                      <button
                        disabled
                        className="w-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 select-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning Space ({lidarProgress}%)
                      </button>
                    )}

                    {lidarStatus === "completed" && (
                      <button
                        onClick={handleCreateFromLidarScan}
                        className="w-full bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Export Scan to Studio
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Blueprint Vectorizer Viewport */}
              {uploadStep === "idle" && activeMode === "vectorizer" && (
                <div className="flex-1 flex flex-col gap-4 font-sans">
                  {/* Mock phone / tablet canvas blueprint vectorizer */}
                  <div className="relative border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-2xl flex flex-col justify-center">
                    {/* If nothing is uploaded/selected */}
                    {vectorizerStatus === "idle" && (
                      <div className="p-6 text-center space-y-4 flex flex-col items-center justify-center">
                        <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl text-blue-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Upload Floorplan Blueprint Image</p>
                          <p className="text-[10px] text-slate-500 mt-1">Upload a top-down blueprint plan to construct 3D walls automatically</p>
                        </div>
                        <button
                          onClick={() => {
                            setUseSampleBlueprint(true);
                            setVectorizerStatus("uploaded");
                            setVectorizerLogs(["Loaded sample floorplan blueprint: Modern Bedroom Layout."]);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-355 transition-colors cursor-pointer"
                        >
                          Use Sample Floorplan Blueprint
                        </button>
                      </div>
                    )}

                    {/* Blueprint photo displayed with scanning vector grid */}
                    {(vectorizerStatus === "uploaded" || vectorizerStatus === "processing" || vectorizerStatus === "completed") && (
                      <div className="absolute inset-0 z-0">
                        {useSampleBlueprint ? (
                          <div 
                            className="w-full h-full bg-contain bg-no-repeat bg-center"
                            style={{ 
                              backgroundImage: "url('https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400')",
                              opacity: vectorizerStatus === "processing" ? 0.4 : 0.75
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                            Custom Floorplan Loaded
                          </div>
                        )}
                        
                        {/* Interactive overlay drawing blueprint walls */}
                        {vectorizerStatus === "processing" && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {/* Tracing lines */}
                            <line x1="20%" y1="20%" x2="80%" y2="20%" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
                            <line x1="20%" y1="20%" x2="20%" y2="80%" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
                            <line x1="80%" y1="20%" x2="80%" y2="80%" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
                            <line x1="20%" y1="80%" x2="80%" y2="80%" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
                            {/* Divider partitions */}
                            <line x1="45%" y1="20%" x2="45%" y2="80%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" />
                            <line x1="45%" y1="50%" x2="80%" y2="50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" />
                            {/* Horizontal laser scan */}
                            <line x1="0" y1={`${vectorizerProgress}%`} x2="100%" y2={`${vectorizerProgress}%`} stroke="#3b82f6" strokeWidth="2" className="shadow-[0_0_10px_#3b82f6]" />
                          </svg>
                        )}

                        {vectorizerStatus === "completed" && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {/* Static completed vector lines in bright emerald */}
                            <rect x="20%" y="20%" width="60%" height="60%" fill="none" stroke="#10b981" strokeWidth="2.5" />
                            <line x1="45%" y1="20%" x2="45%" y2="80%" stroke="#10b981" strokeWidth="2.5" />
                            <line x1="45%" y1="50%" x2="80%" y2="50%" stroke="#10b981" strokeWidth="2.5" />
                            
                            {/* Mapped labels */}
                            <text x="25%" y="30%" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">BEDROOM ZONE</text>
                            <text x="50%" y="35%" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">STUDY ZONE</text>
                            <text x="50%" y="65%" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">CLOSET ZONE</text>
                          </svg>
                        )}
                      </div>
                    )}

                    {/* HUD / Progress details */}
                    {vectorizerStatus !== "idle" && (
                      <div className="absolute inset-0 p-4 flex flex-col justify-between z-20 pointer-events-none select-none">
                        <div className="flex justify-between items-center text-[9px] text-slate-350 font-mono bg-slate-950/75 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm self-start">
                          <span>VECTORIZER STATUS: {vectorizerStatus.toUpperCase()}</span>
                        </div>

                        {vectorizerStatus === "processing" && (
                          <div className="self-center bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm text-[10px] font-mono text-blue-400 font-bold animate-pulse">
                            VECTORIZING PLAN... {vectorizerProgress}%
                          </div>
                        )}

                        <div className="flex justify-between items-end gap-3 text-[8px] font-mono text-slate-350 bg-slate-950/75 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
                          <div className="space-y-0.5">
                            <p>ENGINE: HOMEVERSE-VECT-V2</p>
                            <p>OUTER SHAPE: RECTANGULAR</p>
                            <p>SCALE SNAP: 0.1M</p>
                          </div>
                          <div className="text-right space-y-0.5 max-h-[45px] overflow-hidden text-[7px] text-slate-400">
                            {vectorizerLogs.slice(-3).map((log, idx) => (
                              <p key={idx}>{log}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Settings and controls */}
                  {vectorizerStatus !== "idle" && (
                    <div className="bg-slate-900/35 border border-slate-900/80 rounded-2xl p-4 space-y-3 flex flex-col">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                            Room Type
                          </label>
                          <select
                            value={roomType}
                            onChange={(e) => setRoomType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-600 transition-colors cursor-pointer"
                          >
                            <option value="Living Room">Living Room</option>
                            <option value="Bedroom">Bedroom</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                            Style Preset
                          </label>
                          <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-600 transition-colors cursor-pointer"
                          >
                            <option value="Modern">Modern</option>
                            <option value="Japandi">Japandi</option>
                            <option value="Scandinavian">Scandinavian</option>
                            <option value="Minimalist">Minimalist</option>
                            <option value="Modern Luxury">Modern Luxury</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Contemporary">Contemporary</option>
                          </select>
                        </div>
                      </div>

                      {vectorizerStatus === "uploaded" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setVectorizerStatus("idle");
                              setUseSampleBlueprint(false);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleStartVectorizer}
                            className="flex-2 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse" /> Vectorize Blueprint
                          </button>
                        </div>
                      )}

                      {vectorizerStatus === "processing" && (
                        <button
                          disabled
                          className="w-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 select-none"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto-Tracing Walls ({vectorizerProgress}%)
                        </button>
                      )}

                      {vectorizerStatus === "completed" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setVectorizerStatus("idle");
                              setUseSampleBlueprint(false);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-355 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Re-upload
                          </button>
                          <button
                            onClick={handleCreateFromBlueprint}
                            className="flex-2 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 animate-bounce"
                          >
                            <Check className="w-4 h-4" /> Construct 3D Walls
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}              {/* AI Reconstruct Room Mode Panel */}
              {activeMode === "upload" && (
                <div className="flex-1 flex flex-col justify-between h-full animate-fade-in">
                  {uploadStep === "idle" && (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group flex-1 flex flex-col justify-center ${
                        dragActive
                          ? "border-blue-500 bg-blue-950/20"
                          : "border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 group-hover:border-blue-500/40 group-hover:bg-slate-900 transition-colors">
                          <Upload className="w-7 h-7 text-blue-400 group-hover:scale-115 transition-transform" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Click to upload or drag & drop</p>
                          <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or MP4 (Video walkthrough)</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-slate-500" /> Room Photo</span>
                          <span className="text-slate-800">|</span>
                          <span className="flex items-center gap-1.5"><Video className="w-3 h-3 text-slate-500" /> Video Scan</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadStep === "uploading" && (
                    <div className="border border-slate-850 rounded-2xl p-8 space-y-4 text-center bg-slate-950/30 flex-1 flex flex-col justify-center items-center">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-300">Uploading Assets...</h3>
                        <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]">File: {selectedFile?.name}</p>
                      </div>
                    </div>
                  )}

                  {uploadStep === "analyzing" && (
                    <div className="border border-slate-850/80 rounded-2xl p-5 space-y-4 bg-slate-950/40 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" /> AI Room Reconstruction
                        </h3>
                        <span className="text-[9px] text-blue-400 font-mono animate-pulse">Running Scan...</span>
                      </div>
                      <div className="space-y-2 text-[10px] text-slate-455 font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-900 leading-relaxed">
                        <div className="flex items-center justify-between text-green-400">
                          <span>✔ Loaded {fileType} file metadata</span>
                          <span>[OK]</span>
                        </div>
                        <div className="flex items-center justify-between text-green-400">
                          <span>✔ Furniture Recognition (Sofa, Table, TV)</span>
                          <span>[OK]</span>
                        </div>
                        <div className="flex items-center justify-between text-blue-400 animate-pulse">
                          <span>🔄 Segmenting walls, doors, ceiling</span>
                          <span>[RUNNING]</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>☐ Creating 3D semantic layout coordinates</span>
                          <span>[WAITING]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadStep === "complete" && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto max-h-[600px] pr-1">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                        <div>
                          <h3 className="font-bold text-xs text-slate-200">Design Options</h3>
                          <p className="text-[9px] text-slate-450 mt-0.5">Customize your room details and style requirements</p>
                        </div>
                        <span className="flex items-center gap-1 text-[9px] text-blue-400 font-semibold bg-blue-950/20 border border-blue-900/40 px-2 py-0.5 rounded-full font-mono">
                          ⚡ Custom Generator
                        </span>
                      </div>

                      {/* Options form */}
                      <div className="space-y-3 bg-slate-900/25 p-3.5 border border-slate-900/80 rounded-2xl">
                        {/* Name Input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-450 font-mono">
                            Design Name / Title
                          </label>
                          <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => {
                              setProjectTitle(e.target.value);
                              sessionStorage.setItem("homeverse_project_title", e.target.value);
                            }}
                            onBlur={() => handleUpdateProjectDetails(projectTitle, roomType)}
                            placeholder="e.g. Guest Bedroom, Loft Gym"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Room Type Select */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                            Room / Space Type
                          </label>
                          <select
                            value={roomType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRoomType(val);
                              sessionStorage.setItem("homeverse_room_type", val);
                              handleUpdateProjectDetails(projectTitle, val);
                            }}
                            className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
                          >
                            <option value="Living Room">Living Room</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Office">Home Office</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Dining Room">Dining Room</option>
                            <option value="Gym">Home Gym</option>
                            <option value="Playroom">Kids Playroom</option>
                            <option value="Library">Library / Study</option>
                            <option value="Other">Other (Custom Type...)</option>
                          </select>
                        </div>

                        {/* Custom Room Type input if "Other" is chosen */}
                        {roomType === "Other" && (
                          <div className="flex flex-col gap-1 animate-fadeIn">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                              Custom Room Type Name
                            </label>
                            <input
                              type="text"
                              value={customRoomType}
                              onChange={(e) => setCustomRoomType(e.target.value)}
                              placeholder="e.g., Attic Studio, Conservatory, Home Theater"
                              className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
                            />
                          </div>
                        )}

                        {/* Style Select */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                            Design Style Theme
                          </label>
                          <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors cursor-pointer"
                          >
                            <option value="Modern">Modern</option>
                            <option value="Japandi">Japandi</option>
                            <option value="Scandinavian">Scandinavian</option>
                            <option value="Minimalist">Minimalist</option>
                            <option value="Modern Luxury">Modern Luxury</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Contemporary">Contemporary</option>
                            <option value="Custom">Custom Style...</option>
                          </select>
                        </div>

                        {/* Custom Style input if "Custom" is chosen */}
                        {selectedStyle === "Custom" && (
                          <div className="flex flex-col gap-1 animate-fadeIn">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                              Custom Style Name
                            </label>
                            <input
                              type="text"
                              value={customStyleInput}
                              onChange={(e) => setCustomStyleInput(e.target.value)}
                              placeholder="e.g., Industrial Loft, Bohemian, Mid-Century Modern"
                              className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
                            />
                          </div>
                        )}

                        {/* Color Palette Input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                            Color Palette & Materials (Optional)
                          </label>
                          <input
                            type="text"
                            value={colorPalette}
                            onChange={(e) => setColorPalette(e.target.value)}
                            placeholder="e.g. Emerald green and brass, Light oak wood"
                            className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Custom Requirements Prompt */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
                            Additional Design Notes (Optional)
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., Add plants, place a compact workspace near the window"
                            rows={2}
                            className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors resize-none"
                          />
                        </div>
                      </div>

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerateDynamicDesign}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-1.5 py-3 text-white font-bold rounded-xl transition-all cursor-pointer text-xs ${
                          isGenerating 
                            ? "bg-slate-800 border border-slate-750 text-slate-500 cursor-not-allowed" 
                            : "bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 glow-btn"
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating AI Redesign...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Generate AI Design
                          </>
                        )}
                      </button>

                      {/* Generated Designs Selection Carousel / Grid */}
                      {generatedDesigns.length > 0 && (
                        <div className="space-y-2 border-t border-slate-900 pt-3">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-450 font-mono">
                            Your Generated Designs ({generatedDesigns.length})
                          </span>
                          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                            {generatedDesigns.map((d) => (
                              <button
                                key={d.id}
                                onClick={() => {
                                  setActiveDesignId(d.id);
                                  setSelectedStyle(d.style);
                                  setShowOriginal(false);
                                }}
                                className={`flex-shrink-0 group relative rounded-lg overflow-hidden border text-left p-1 bg-slate-955 hover:bg-slate-900 transition-all cursor-pointer h-16 w-24 flex flex-col justify-between ${
                                  activeDesignId === d.id
                                    ? "border-blue-500 ring-1 ring-blue-500/50"
                                    : "border-slate-850"
                                }`}
                              >
                                <img
                                  src={d.image_url}
                                  alt={d.style}
                                  className="object-cover w-full h-8 rounded"
                                />
                                <span className="font-bold text-[8px] text-slate-350 truncate block mt-0.5">{d.style}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enter Studio Trigger */}
                      <button
                        onClick={handleEnterStudio}
                        disabled={generatedDesigns.length === 0}
                        className={`w-full flex items-center justify-center gap-1.5 py-3 font-bold rounded-xl transition-all cursor-pointer text-xs ${
                          generatedDesigns.length === 0
                            ? "bg-slate-850 border border-slate-800 text-slate-550 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
                        }`}
                      >
                        Open in Design Studio <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Informational badge */}
                      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] text-blue-400 leading-relaxed flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span>
                          <strong>Dynamic Design:</strong> Design any room type you want. Fill out your custom options, generate the design, then open in studio to interact with the 3D items!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
                  {activeMode === "scratch" && (
                <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in">
                  <div className="bg-slate-900/20 border border-slate-850/80 p-4 rounded-2xl space-y-4">
                    {/* Visual Progress Steps */}
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                        Design Wizard: Step {scratchStep} of 4
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((s) => (
                          <div
                            key={s}
                            className={`w-3.5 h-1.5 rounded-full transition-all ${
                              s === scratchStep
                                ? "bg-blue-500"
                                : s < scratchStep
                                ? "bg-blue-800"
                                : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* STEP 1: House Type Details Form */}
                    {scratchStep === 1 && (
                      <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                        {/* Property Type Selection */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            Property Type
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPropertyType("apartment")}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                                propertyType === "apartment"
                                  ? "bg-blue-955/40 border-blue-500 text-blue-400"
                                  : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                              }`}
                            >
                              <span className="font-bold text-xs">🏢 Apartment / Flat</span>
                              <span className="text-[9px] text-slate-500 font-normal">Multistory flat.</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPropertyType("independent")}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                                propertyType === "independent"
                                  ? "bg-blue-955/40 border-blue-500 text-blue-400"
                                  : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                              }`}
                            >
                              <span className="font-bold text-xs">🏠 Independent House</span>
                              <span className="text-[9px] text-slate-500 font-normal">Villa, Duplex, or Bungalow.</span>
                            </button>
                          </div>
                        </div>

                        {propertyType === "apartment" ? (
                          <div className="space-y-3 animate-fadeIn border-l-2 border-blue-900/40 pl-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Bedrooms</label>
                                <input type="number" min="0" value={numBedrooms} onChange={(e) => setNumBedrooms(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Bathrooms</label>
                                <input type="number" min="0" value={numBathrooms} onChange={(e) => setNumBathrooms(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Balconies</label>
                                <input type="number" min="0" value={numBalconies} onChange={(e) => setNumBalconies(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Total House Dimensions</label>
                                <input type="text" value={dimensionsHouse} onChange={(e) => setDimensionsHouse(e.target.value)} placeholder="e.g. 30 ft * 40 ft" className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Main Door Direction</label>
                              <select value={mainDoorDirection} onChange={(e) => setMainDoorDirection(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer">
                                <option value="North">North</option>
                                <option value="East">East</option>
                                <option value="West">West</option>
                                <option value="South">South</option>
                                <option value="North East">North East</option>
                                <option value="South East">South East</option>
                                <option value="North West">North West</option>
                                <option value="South West">South West</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Windows</label>
                                <input type="number" min="0" value={numWindows} onChange={(e) => setNumWindows(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Doors</label>
                                <input type="number" min="0" value={numDoors} onChange={(e) => setNumDoors(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Room Dimensions (Unstructured details)</label>
                              <textarea value={dimensionsEachRoom} onChange={(e) => setDimensionsEachRoom(e.target.value)} placeholder="e.g. Hall: 12x13 ft, Master Bed: 14x16 ft" className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none h-14 resize-none font-sans" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-fadeIn border-l-2 border-blue-900/40 pl-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Number of Floors</label>
                                <input type="number" min="1" value={numFloors} onChange={(e) => setNumFloors(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Dimensions</label>
                                <input type="text" value={dimensionsHouse} onChange={(e) => setDimensionsHouse(e.target.value)} placeholder="e.g. 30 ft * 45 ft" className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Rooms in each Floor</label>
                              <textarea value={roomsPerFloor} onChange={(e) => setRoomsPerFloor(e.target.value)} placeholder="e.g. Ground: Living, Kitchen. First: 2 Bedrooms." className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none h-12 resize-none font-sans" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Purpose of each Floor</label>
                              <textarea value={purposeEachFloor} onChange={(e) => setPurposeEachFloor(e.target.value)} placeholder="e.g. Ground floor for rental/living, first floor for personal use." className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none h-12 resize-none font-sans" />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-bold tracking-widest text-slate-455 font-mono">Rooftop?</label>
                                <select value={rooftop} onChange={(e) => setRooftop(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-2 py-1.5 text-[10px] text-slate-200 cursor-pointer">
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-bold tracking-widest text-slate-455 font-mono">Parking?</label>
                                <select value={parking} onChange={(e) => setParking(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-2 py-1.5 text-[10px] text-slate-200 cursor-pointer">
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] uppercase font-bold tracking-widest text-slate-455 font-mono">Garden?</label>
                                <select value={garden} onChange={(e) => setGarden(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-2 py-1.5 text-[10px] text-slate-200 cursor-pointer">
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">Main Door Direction</label>
                              <select value={mainDoorDirection} onChange={(e) => setMainDoorDirection(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer">
                                <option value="North">North</option>
                                <option value="East">East</option>
                                <option value="West">West</option>
                                <option value="South">South</option>
                                <option value="North East">North East</option>
                                <option value="South East">South East</option>
                                <option value="North West">North West</option>
                                <option value="South West">South West</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Windows</label>
                                <input type="number" min="0" value={numWindows} onChange={(e) => setNumWindows(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">No. of Doors</label>
                                <input type="number" min="0" value={numDoors} onChange={(e) => setNumDoors(e.target.value)} className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Target Room Selection */}
                        <div className="space-y-1.5 pt-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            Which room would you like to design / modify?
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "Hall", label: "Hall / Living", icon: "📺" },
                              { id: "Master Bedroom", label: "Master Bed", icon: "🛏️" },
                              { id: "Second Bedroom", label: "Second Bed", icon: "💤" },
                              { id: "Kids Bedroom", label: "Kids Room", icon: "🧸" },
                              { id: "Kitchen", label: "Kitchen", icon: "🍳" },
                              { id: "Bathroom", label: "Bathroom", icon: "🚿" }
                            ].map((room) => (
                              <button
                                type="button"
                                key={room.id}
                                onClick={() => {
                                  setSelectedRoomToDesign(room.id);
                                  setRoomType(room.id);
                                }}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-[9px] flex flex-col justify-center items-center gap-1.5 h-16 ${
                                  selectedRoomToDesign === room.id
                                    ? "bg-blue-955/40 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10"
                                    : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                                }`}
                              >
                                <span className="text-base">{room.icon}</span>
                                <span className="leading-tight">{room.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            House Plan Blueprint / Screenshot (Upload or paste)
                          </label>
                          <input
                            type="file"
                            id="house-plan-upload"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setHousePlanFile(files[0]);
                              }
                            }}
                          />
                          {!housePlanFile ? (
                            <div 
                              onClick={() => document.getElementById("house-plan-upload")?.click()}
                              className="border border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-3.5 bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-455 cursor-pointer hover:bg-slate-900/10 transition-all group"
                            >
                              <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-450 group-hover:scale-105 transition-all mb-1.5" />
                              <span className="font-medium text-slate-350">Click to upload image or PDF</span>
                              <span className="text-[8px] text-slate-600 font-sans mt-0.5">Or paste directly with Ctrl + V</span>
                            </div>
                          ) : (
                            <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-905/60 flex items-center justify-between text-xs text-slate-200">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-base">📄</span>
                                <div className="truncate">
                                  <p className="font-bold text-[10px] text-slate-300 truncate leading-tight">{housePlanFile.name}</p>
                                  <p className="text-[8px] text-slate-555 font-sans">
                                    {(housePlanFile.size / 1024).toFixed(1)} KB • {housePlanFile.type.split("/")[1]?.toUpperCase() || "File"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setHousePlanFile(null)}
                                className="p-1 text-slate-550 hover:text-red-400 transition-colors text-[9px] font-bold border border-slate-850 hover:border-red-900/30 rounded bg-slate-950/80 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Room blueprint, dimensions & Budget Selection */}
                    {scratchStep === 2 && (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 animate-fadeIn">
                        <div className="text-center space-y-1 py-1">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Room Details & Budget</h3>
                          <p className="text-[10px] text-slate-500 font-sans">Verify your room blueprint, room dimensions, and selected budget.</p>
                        </div>

                        {/* Room Blueprint Verification */}
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            Extracted {selectedRoomToDesign} Blueprint
                          </label>
                          
                          {housePlanFile ? (
                            <div className="space-y-3">
                              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                                {!isRoomBlueprintCorrect && roomBlueprintFile ? (
                                  <img
                                    src={URL.createObjectURL(roomBlueprintFile)}
                                    alt="Uploaded Room Blueprint"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={housePlanUrl || ""}
                                      alt="Cutout blueprint"
                                      className="w-full h-full object-none transition-all duration-500"
                                      style={{
                                        objectPosition: getObjectPositionForRoom(selectedRoomToDesign),
                                        transform: "scale(2.2)",
                                      }}
                                    />
                                    <div className="absolute inset-0 border-2 border-dashed border-blue-500/60 pointer-events-none" />
                                    <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                      AI Auto-Cutout
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                                <span className="text-[9px] text-slate-400 font-medium">Is this cutout the correct blueprint of the {selectedRoomToDesign}?</span>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRoomBlueprintCorrect(true);
                                      setRoomBlueprintFile(null);
                                    }}
                                    className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                      isRoomBlueprintCorrect
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200"
                                    }`}
                                  >
                                    ✓ Yes, looks correct
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsRoomBlueprintCorrect(false)}
                                    className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                      !isRoomBlueprintCorrect
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200"
                                    }`}
                                  >
                                    ❌ No, it's incorrect
                                  </button>
                                </div>
                              </div>

                              {!isRoomBlueprintCorrect && (
                                <div className="space-y-1.5 animate-fadeIn border-l-2 border-amber-500/40 pl-2">
                                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                                    Upload Room-Specific Blueprint
                                  </label>
                                  <input
                                    type="file"
                                    id="room-blueprint-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        setRoomBlueprintFile(files[0]);
                                      }
                                    }}
                                  />
                                  {!roomBlueprintFile ? (
                                    <div 
                                      onClick={() => document.getElementById("room-blueprint-upload")?.click()}
                                      className="border border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-3 bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-455 cursor-pointer hover:bg-slate-900/10 transition-all group"
                                    >
                                      <Upload className="w-4 h-4 text-slate-500 group-hover:text-blue-450 group-hover:scale-105 transition-all mb-1" />
                                      <span className="font-medium text-slate-350">Click to upload Room Blueprint</span>
                                    </div>
                                  ) : (
                                    <div className="border border-slate-800 rounded-xl p-2 bg-slate-905/60 flex items-center justify-between text-[10px] text-slate-200">
                                      <span className="truncate max-w-[150px] font-bold text-slate-300">{roomBlueprintFile.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => setRoomBlueprintFile(null)}
                                        className="text-red-405 hover:text-red-300 font-bold cursor-pointer"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950 text-center text-[10px] text-slate-500">
                              No house blueprint uploaded. You can upload a room blueprint or skip.
                            </div>
                          )}
                        </div>

                        {/* Room Dimensions Input */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            Room Dimensions
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-505 font-mono uppercase">Width (m)</span>
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                value={scratchRoomWidth}
                                onChange={(e) => setScratchRoomWidth(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] text-slate-555 font-mono uppercase">Length (m)</span>
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                value={scratchRoomLength}
                                onChange={(e) => setScratchRoomLength(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Budget Selection */}
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono block">
                            Design Budget Tier
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {["5L", "10L", "20L", "50L", "Custom"].map((tier) => (
                              <button
                                type="button"
                                key={tier}
                                onClick={() => {
                                  setBudgetSelection(tier);
                                  if (tier !== "Custom") setCustomBudget("");
                                }}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-[10px] flex flex-col justify-center items-center gap-0.5 ${
                                  budgetSelection === tier
                                    ? "bg-blue-955/40 border-blue-500 text-blue-400"
                                    : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                                }`}
                              >
                                <span>{tier === "Custom" ? "✏️ Custom" : `₹ ${tier}`}</span>
                                <span className="text-[7px] font-sans text-slate-500 font-normal">
                                  {tier === "5L" && "Friendly"}
                                  {tier === "10L" && "Economy"}
                                  {tier === "20L" && "Premium"}
                                  {tier === "50L" && "Luxury"}
                                  {tier === "Custom" && "Specify"}
                                </span>
                              </button>
                            ))}
                          </div>
                          {budgetSelection === "Custom" && (
                            <input
                              type="text"
                              value={customBudget}
                              onChange={(e) => setCustomBudget(e.target.value)}
                              placeholder="e.g. 15 Lakhs or 75 Lakhs"
                              className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none mt-2 animate-fadeIn"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Validate & Create Master JSON */}
                    {scratchStep === 3 && (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 animate-fadeIn">
                        <div className="text-center space-y-1">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Master House JSON Model</h3>
                          <p className="text-[10px] text-slate-550 font-sans leading-relaxed">
                            {isValidatingHouseJson 
                              ? "Validating inputs and generating structured house specifications..." 
                              : "Your house planning JSON representation generated successfully."}
                          </p>
                        </div>

                        {isValidatingHouseJson ? (
                          <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-[9px] text-slate-400 font-mono animate-pulse">Compiling architectural rules...</p>
                          </div>
                        ) : validationError ? (
                          <div className="p-4 border border-red-900/50 bg-red-950/20 rounded-xl text-center space-y-3">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="text-xs text-red-400 font-semibold">{validationError}</p>
                            <button 
                              type="button" 
                              onClick={createHouseModelJson} 
                              className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Retry Validation
                            </button>
                          </div>
                        ) : masterHouseJson ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-2.5 text-[10px] text-emerald-450">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">✓</span>
                                <span className="font-bold uppercase tracking-wider font-mono">JSON Validated & Saved</span>
                              </div>
                              <span className="font-mono bg-emerald-900/20 px-1.5 py-0.5 rounded text-[8px]">MODEL_V2</span>
                            </div>
                            
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 max-h-[180px] overflow-auto font-mono text-[9px] text-blue-400/90 leading-normal scrollbar-thin">
                              <pre>{JSON.stringify(masterHouseJson, null, 2)}</pre>
                            </div>

                            <div className="p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl text-[9px] text-slate-500 leading-normal">
                              💡 This JSON represents the master blueprint model of your home. All room planning and styling renders are dynamically mapped using these dimensions and orientations.
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <button
                              type="button"
                              onClick={createHouseModelJson}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Generate House Model JSON
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 4: Generation & Layout Locked Comparison Render */}
                    {scratchStep === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        {isGeneratingScratch && scratchDesigns.length === 0 ? (
                          <div className="border border-slate-850 rounded-2xl p-8 space-y-4 text-center bg-slate-955/30 flex-1 flex flex-col justify-center items-center h-[320px] animate-fadeIn">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-bold text-sm text-slate-200">Generating Style Renders</h3>
                              <p className="text-[10px] text-slate-455 max-w-[240px] leading-relaxed">
                                Running Layout Engine to lock 3D furniture placement for your <span className="text-blue-400 font-semibold">{selectedRoomToDesign}</span>, then parallel rendering the 6 styles.
                              </p>
                            </div>
                            <div className="w-full bg-slate-900 border border-slate-850/80 p-2.5 rounded-xl text-[9px] text-slate-500 font-mono text-left max-w-[260px] space-y-1">
                              <div className="flex justify-between items-center text-emerald-450 animate-pulse">
                                <span>⚡ Layout Engine running...</span>
                                <span>[LOCKED]</span>
                              </div>
                              <div className="text-[8px] text-slate-655 leading-snug">
                                Applying Room templates & Architecture rules to establish layout coordinates.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            <div className="text-center space-y-1 py-1">
                              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Locked Layout: 6 Variations</h3>
                              <p className="text-[10px] text-slate-500 font-sans">
                                Select your favorite design style. All options share the exact same furniture coordinates but apply style materials.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {scratchDesigns.map((design) => (
                                <button
                                  type="button"
                                  key={design.id}
                                  onClick={() => {
                                    setSelectedScratchDesignId(design.id);
                                    setSelectedStyle(design.style);
                                    setSelectedDirection("front");
                                  }}

                                  className={`p-2 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer group ${
                                    selectedScratchDesignId === design.id
                                      ? "bg-slate-900/60 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10"
                                      : "bg-slate-955 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                                  }`}
                                >
                                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center">
                                    {design.status === "completed" && design.image_url ? (
                                      <img
                                        src={design.image_url}
                                        alt={design.style}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : design.status === "generating" ? (
                                      <div className="flex flex-col items-center justify-center gap-1.5">
                                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                                        <span className="text-[7px] text-blue-400 font-mono tracking-wider uppercase font-semibold">Generating...</span>
                                      </div>
                                    ) : design.status === "failed" ? (
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-red-500 text-xs">⚠️</span>
                                        <span className="text-[7px] text-red-400 font-mono tracking-wider uppercase font-semibold">Failed</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="text-slate-600 text-[10px]">⏳</span>
                                        <span className="text-[7px] text-slate-500 font-mono tracking-wider uppercase">Waiting...</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center w-full">
                                    <h4 className="font-bold text-[10px] text-slate-200 leading-tight">{design.style}</h4>
                                    <span className={`text-[7px] font-mono font-bold uppercase ${
                                      design.status === "completed" ? "text-emerald-450" :
                                      design.status === "generating" ? "text-blue-400 animate-pulse" :
                                      design.status === "failed" ? "text-red-400" :
                                      "text-slate-500"
                                    }`}>
                                      {design.status === "completed" ? "Done" :
                                       design.status === "generating" ? "Active" :
                                       design.status === "failed" ? "Failed" :
                                       "Pending"}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex gap-2.5">
                    {scratchStep > 1 && !isGeneratingScratch && (
                      <button
                        type="button"
                        onClick={prevScratchStep}
                        className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-355 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    
                    {scratchStep === 1 && (
                      <button
                        type="button"
                        onClick={() => setScratchStep(2)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn text-xs animate-fadeIn"
                      >
                        Continue to Room Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {scratchStep === 2 && (
                      <button
                        type="button"
                        onClick={createHouseModelJson}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn text-xs animate-fadeIn"
                      >
                        Create House Model <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {scratchStep === 3 && (
                      <button
                        type="button"
                        disabled={!masterHouseJson}
                        onClick={triggerScratchGeneration}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn text-xs disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn"
                      >
                        Generate Locked Layout & 6 Renders <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {scratchStep === 4 && !isGeneratingScratch && (
                      <button
                        type="button"
                        onClick={handleCreateFromScratch}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn text-xs animate-bounce animate-fadeIn"
                      >
                        Open Studio Space <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-3xl border-slate-800/80 space-y-4 flex flex-col justify-between flex-1 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Active Workspace Preview</span>
                {uploadStep === "complete" && (
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900/60">
                    <button
                      onClick={() => setShowOriginal(true)}
                      className={`text-[9px] px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                        showOriginal
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setShowOriginal(false)}
                      className={`text-[9px] px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                        !showOriginal
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      AI Redesign
                    </button>
                  </div>
                )}
                <span className={`w-2 h-2 rounded-full ${uploadStep === "complete" ? "bg-emerald-500 animate-pulse" : "bg-blue-500 animate-pulse"}`} />
              </div>

              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center flex-1 min-h-[160px]">
                {activeMode === "upload" ? (
                  uploadStep === "complete" ? (
                    showOriginal || generatedDesigns.length === 0 ? (
                      uploadedFileUrl ? (
                        fileType === "video" ? (
                          <video
                            src={uploadedFileUrl}
                            className="w-full h-full object-cover animate-fadeIn"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <img
                            src={uploadedFileUrl}
                            alt="Original Room"
                            className="w-full h-full object-cover animate-fadeIn"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Layers className="w-8 h-8 text-slate-750 mb-1" />
                          <span className="text-[10px]">No Image Preview</span>
                        </div>
                      )
                    ) : (
                      (() => {
                        const activeDesign = generatedDesigns.find((d) => d.id === activeDesignId) || 
                                             generatedDesigns.find((d) => d.style.toLowerCase() === selectedStyle.toLowerCase()) ||
                                             generatedDesigns[generatedDesigns.length - 1];
                        
                        const displayImg = activeDesign?.image_url || styles.find((s) => s.name === selectedStyle)?.img;
                        return (
                          <div className="relative w-full h-full">
                            {imageLoading && (
                              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                <div className="text-center">
                                  <p className="text-xs font-semibold text-slate-355">Generating AI Redesign...</p>
                                  <p className="text-[10px] text-slate-500 mt-1">Applying {selectedStyle} style to your room layout</p>
                                </div>
                              </div>
                            )}
                            <img
                              src={displayImg}
                              onLoad={() => setImageLoading(false)}
                              onError={() => {
                                setImageLoading(false);
                                setImageError(true);
                              }}
                              alt={selectedStyle}
                              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                            />
                          </div>
                        );
                      })()
                    )
                  ) : uploadStep === "uploading" || uploadStep === "analyzing" ? (
                    <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center animate-fadeIn">
                      <div className="relative w-28 h-20 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30 flex items-center justify-center shadow-inner">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px]" />
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-bounce" />
                        <Upload className="w-6 h-6 text-blue-500 animate-pulse relative z-10" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Reconstructing Room Geometry</p>
                        <p className="text-[9px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                          Our spatial mapping pipeline is extracting structural features and locating primary assets.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-650 p-4 text-center">
                      <Layers className="w-10 h-10 mb-2 text-slate-800" />
                      <p className="text-xs font-semibold text-slate-400">AI Reconstruct View Empty</p>
                      <p className="text-[10px] max-w-[220px] mt-1 text-slate-500 leading-relaxed">
                        Please upload a room image/video to run the AI mapping pipeline.
                      </p>
                    </div>
                  )
                ) : activeMode === "scratch" ? (
                  (() => {
                    if (scratchStep === 1) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3 animate-fadeIn">
                          <div className="w-16 h-16 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center bg-slate-900/20">
                            <Layers className="w-6 h-6 text-slate-650" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">Set Up House Geometry</p>
                            <p className="text-[9px] text-slate-555 max-w-[200px] mt-1 leading-relaxed">
                              Enter your property details, select the room to modify, and upload a house plan blueprint.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (scratchStep === 2) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3 animate-fadeIn">
                          <div className="w-16 h-16 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center bg-slate-900/20">
                            <Layers className="w-6 h-6 text-slate-650" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">Room Details & Budget</p>
                            <p className="text-[9px] text-slate-555 max-w-[200px] mt-1 leading-relaxed">
                              Verify your room blueprint cutout, adjust dimensions, and select the design budget tier.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (scratchStep === 3) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-505 p-6 text-center space-y-3 animate-fadeIn">
                          <div className="w-16 h-16 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center bg-slate-900/20">
                            <Layers className="w-6 h-6 text-slate-655" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">Validate House JSON</p>
                            <p className="text-[9px] text-slate-550 max-w-[200px] mt-1 leading-relaxed">
                              Generate and inspect the structured house blueprint model in JSON format.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (scratchStep === 4 && scratchDesigns.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-4 animate-fadeIn">
                          <div className="w-14 h-14 border border-blue-500/30 rounded-full flex items-center justify-center bg-blue-950/10 relative">
                            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <Sparkles className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">Pre-rendering Locked Layout styles</p>
                            <p className="text-[9px] text-slate-555 max-w-[220px] mt-1 leading-relaxed">
                              Setting up common structural 3D blueprint coordinates and loading stubs...
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const activeDesign = scratchDesigns.find((d) => d.id === selectedScratchDesignId);
                    
                    if (!activeDesign || activeDesign.status === "waiting") {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3 animate-fadeIn h-full w-full bg-slate-950/60">
                          <span className="text-slate-600 text-lg">⏳</span>
                          <div>
                            <p className="text-xs font-bold text-slate-300">Queue pending...</p>
                            <p className="text-[9px] text-slate-550 mt-1">This style is waiting in the generation queue</p>
                          </div>
                        </div>
                      );
                    }

                    if (activeDesign.status === "generating" || !activeDesign.image_url) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-505 p-6 text-center space-y-4 animate-fadeIn h-full w-full bg-slate-955/65">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <div>
                            <p className="text-xs font-bold text-slate-300">Rendering style redesign...</p>
                            <p className="text-[9px] text-slate-500 mt-1">Applying {selectedStyle} materials to locked room layout</p>
                          </div>
                        </div>
                      );
                    }

                    if (activeDesign.status === "failed") {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-3 animate-fadeIn h-full w-full bg-slate-950/60">
                          <span className="text-red-500 text-lg">⚠️</span>
                          <div>
                            <p className="text-xs font-bold text-red-400">Generation Failed</p>
                            <p className="text-[9px] text-slate-500 mt-1">The AI model was unable to generate this style render</p>
                          </div>
                        </div>
                      );
                    }

                    let displayImg = activeDesign.image_url;
                    if (selectedDirection === "left") displayImg = activeDesign.image_url_left || "";
                    else if (selectedDirection === "right") displayImg = activeDesign.image_url_right || "";
                    else if (selectedDirection === "back") displayImg = activeDesign.image_url_back || "";
                    else if (selectedDirection === "front_wall") displayImg = activeDesign.image_url_front || "";

                    const isDirectionGenerating = isGeneratingDirection || (selectedDirection !== "front" && !displayImg);

                    if (isDirectionGenerating) {
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-4 animate-fadeIn bg-slate-955/80">
                          {/* Direction selection controls still visible during generation */}
                          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full p-1 flex gap-1 shadow-lg">
                            {(["front", "front_wall", "left", "right", "back"] as const).map((dir) => (
                              <button
                                key={dir}
                                onClick={() => handleSelectDirection(dir)}
                                disabled={isGeneratingDirection}
                                className={`px-2 py-1 rounded-full text-[8px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                  selectedDirection === dir
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                                }`}
                              >
                                {dir === "front" ? "Door View" : dir === "front_wall" ? "Front Wall" : dir === "back" ? "Opposite View" : `${dir} Wall`}
                              </button>
                            ))}
                          </div>
                          
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <div>
                            <p className="text-xs font-bold text-slate-350">Rendering {selectedDirection === "front" ? "Door View" : selectedDirection === "front_wall" ? "Front Wall" : selectedDirection === "back" ? "Opposite View" : `${selectedDirection} Wall`} view...</p>
                            <p className="text-[9px] text-slate-500 mt-1">Generating from specified camera perspective in {selectedStyle} Style</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="relative w-full h-full animate-fadeIn group">
                        {/* Direction selection controls */}
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-slate-955/85 backdrop-blur-md border border-slate-800 rounded-full p-1 flex gap-1 shadow-lg">
                          {(["front", "front_wall", "left", "right", "back"] as const).map((dir) => (
                            <button
                              key={dir}
                              onClick={() => handleSelectDirection(dir)}
                              disabled={isGeneratingDirection}
                              className={`px-2 py-1 rounded-full text-[8px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                                selectedDirection === dir
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                              }`}
                            >
                                {dir === "front" ? "Door View" : dir === "front_wall" ? "Front Wall" : dir === "back" ? "Opposite View" : `${dir} Wall`}
                            </button>
                          ))}
                        </div>


                        <img
                          src={displayImg}
                          alt="Active Workspace Preview"
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                        />
                        
                        {/* Live Specs Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-4 pt-10">
                          <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
                            <span className="text-[8px] bg-blue-500/10 border border-blue-500/25 text-blue-400 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {selectedRoomToDesign}
                            </span>
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {selectedStyle} Theme
                            </span>
                            <span className="text-[8px] bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {budgetSelection} Budget
                            </span>
                          </div>
                          
                          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            {selectedStyle} Style Option Preview ({selectedDirection === "front" ? "Door View" : selectedDirection === "back" ? "Opposite View" : `${selectedDirection} Wall`})
                          </h3>
                          
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Layout matching your home specifications. Main Door facing <span className="font-mono text-slate-350">{mainDoorDirection}</span>.
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : activeMode === "lidar" ? (
                  lidarStatus === "scanning" || lidarStatus === "completed" ? (
                    <div className="relative w-full h-full animate-fadeIn group">
                      <img
                        src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600"
                        alt="LiDAR Point Cloud"
                        className="w-full h-full object-cover transition-all duration-500 opacity-60"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="relative w-20 h-20 border border-green-500/40 rounded-full flex items-center justify-center bg-green-950/10 animate-pulse">
                          <div className="absolute inset-2 border border-green-500/20 rounded-full animate-spin" style={{ animationDuration: "4s" }} />
                          <Sparkles className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                            {lidarStatus === "scanning" ? "Active Point Cloud Capture" : "Point Cloud Mesh Ready"}
                          </p>
                          <div className="flex gap-4 justify-center items-center mt-2.5">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-500 block">Progress</span>
                              <span className="text-xs font-bold font-mono text-green-400">{lidarProgress}%</span>
                            </div>
                            <div className="w-px h-6 bg-slate-800" />
                            <div className="text-center">
                              <span className="text-[10px] text-slate-500 block">Vertices</span>
                              <span className="text-xs font-bold font-mono text-slate-200">{lidarPoints} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-655 p-4 text-center">
                      <Sparkles className="w-10 h-10 mb-2 text-slate-800" />
                      <p className="text-xs font-semibold text-slate-450">LiDAR Feed Offline</p>
                      <p className="text-[10px] max-w-[220px] mt-1 text-slate-500 leading-relaxed">
                        Start scanning to view the spatial point cloud mesh generated in real time.
                      </p>
                    </div>
                  )
                ) : (
                  vectorizerStatus === "processing" || vectorizerStatus === "completed" ? (
                    <div className="relative w-full h-full animate-fadeIn group">
                      <img
                        src={useSampleBlueprint ? "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600" : "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=600"}
                        alt="Blueprint Vectorizer"
                        className="w-full h-full object-cover transition-all duration-500 opacity-40"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="relative w-16 h-16 border border-blue-500/30 rounded-xl flex items-center justify-center bg-blue-950/10">
                          {vectorizerStatus === "processing" && (
                            <div className="absolute inset-0 border-t-2 border-blue-500 rounded-xl animate-spin" />
                          )}
                          <Layers className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                            {vectorizerStatus === "processing" ? "Extracting Wall Vectors" : "Vector Floorplan Generated"}
                          </p>
                          <div className="flex gap-4 justify-center items-center mt-2.5">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-500 block">Status</span>
                              <span className="text-xs font-bold font-mono text-blue-400">
                                {vectorizerStatus === "processing" ? `${vectorizerProgress}%` : "100% Extracted"}
                              </span>
                            </div>
                            <div className="w-px h-6 bg-slate-850" />
                            <div className="text-center">
                              <span className="text-[10px] text-slate-500 block">Format</span>
                              <span className="text-xs font-bold font-mono text-slate-350">ThreeJS JSON</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-655 p-4 text-center">
                      <Layers className="w-10 h-10 mb-2 text-slate-800" />
                      <p className="text-xs font-semibold text-slate-450">No Floorplan Selected</p>
                      <p className="text-[10px] max-w-[220px] mt-1 text-slate-500 leading-relaxed">
                        Attach a blueprint image to begin wall alignment extraction.
                      </p>
                    </div>
                  )
                )}
              </div>

              {activeMode === "upload" && uploadStep === "complete" && (
                <>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 animate-fadeIn">
                    <span className="text-[10px] font-bold text-blue-400 block mb-0.5">Style Profile: {selectedStyle}</span>
                    <p className="text-[10px] text-slate-455 leading-relaxed">
                      {styles.find((s) => s.name === selectedStyle)?.desc}
                    </p>
                  </div>
                  {/* Background Image Prefetcher to load other styles in parallel */}
                  <div className="hidden pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true">
                    {generatedDesigns.map((d) => {
                      const matchedStyle = styles.find((s) => s.name.toLowerCase() === d.style.toLowerCase());
                      const imgUrl = d.image_url || matchedStyle?.img;
                      return imgUrl ? <img key={d.id} src={imgUrl} alt="prefetch" /> : null;
                    })}
                  </div>
                </>
              )}

              {activeMode === "scratch" && (
                <div className="hidden pointer-events-none w-0 h-0 overflow-hidden" aria-hidden="true">
                  {/* Prefetch all 8 images for the selected style to make dynamic toggles instant */}
                  {["North", "South", "East", "West"].flatMap((dir) =>
                    ["layout-a", "layout-b"].map((layout) => (
                      <img
                        key={`${dir}-${layout}`}
                        src={getTemplateImage(selectedStyle, dir, layout as any)}
                        alt="prefetch"
                      />
                    ))
                  )}
                </div>
              )}

              {/* Quick Bypass / Demo Trigger */}
              <div className="border border-slate-850 bg-slate-900/20 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-[11px] text-slate-300">Testing Without Uploading?</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Directly load the pre-analyzed demo room template into the 3D studio.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/studio?style=Modern")}
                  className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-1 bg-blue-950/20 border border-blue-900/40 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Launch Demo Studio →
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
