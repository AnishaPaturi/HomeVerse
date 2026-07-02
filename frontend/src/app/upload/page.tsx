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
  Home
} from "lucide-react";

const getFurnishedTemplateObjects = (
  roomType: string,
  style: string,
  facing: string,
  roomWidth: number,
  roomDepth: number
) => {
  const objects: any[] = [];
  const baseColor = style === "Luxury" ? "#1e293b" : style === "Minimalist" ? "#f8fafc" : "#cbd5e1";
  const accentColor = style === "Luxury" ? "#b45309" : style === "Japandi" ? "#0f766e" : "#3b82f6";

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

// Returns a fast-loading, highly reliable preset image for every combination of style, facing direction, and layout.
const getTemplateImage = (style: string, facing: string, layout: "layout-a" | "layout-b"): string => {
  const s = style.toLowerCase();
  const f = facing.toLowerCase();

  // Define unique high-resolution interior designs for every single direction and theme combination.
  const images: Record<string, Record<string, Record<"layout-a" | "layout-b", string>>> = {
    modern: {
      north: {
        "layout-a": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80"
      },
      south: {
        "layout-a": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=400&q=80"
      },
      east: {
        "layout-a": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80"
      },
      west: {
        "layout-a": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
      }
    },
    luxury: {
      north: {
        "layout-a": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80"
      },
      south: {
        "layout-a": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=400&q=80"
      },
      east: {
        "layout-a": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80"
      },
      west: {
        "layout-a": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80"
      }
    },
    japandi: {
      north: {
        "layout-a": "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=400&q=80"
      },
      south: {
        "layout-a": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
      },
      east: {
        "layout-a": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80"
      },
      west: {
        "layout-a": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80",
        "layout-b": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80"
      }
    }
  };

  const styleGroup = images[s] || images.modern;
  const facingGroup = styleGroup[f] || styleGroup.north;
  return facingGroup[layout];
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

  // Persistence and custom design naming states
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("My Interior Design");
  const [roomType, setRoomType] = useState<string>("Living Room");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (uploadStep === "complete") {
      setImageLoading(true);
      setImageError(false);
    }
  }, [selectedStyle, uploadStep, generatedDesigns]);

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
    setIsReady(true);
  }, []);

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
        return "contrast(1.1) saturate(1.25) sepia(0.15) brightness(0.95)";
      case "Scandinavian":
        return "brightness(1.15) contrast(0.95) saturate(1.05) sepia(0.05)";
      case "Minimalist":
        return "brightness(1.1) saturate(0.3) contrast(1.05)";
      case "Japandi":
        return "sepia(0.2) brightness(1.05) saturate(0.9) contrast(0.95)";
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
        return [
          { id: "1", object_type: "sofa", position_x: 0.0, position_y: 0.0, position_z: -2.1, rotation: -0.1, scale: 1.05, material: "#0f766e" },
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

      const activeProjId = projectData?.id || crypto.randomUUID();
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

      let designsList = [];
      try {
        const analyzeRes = await fetch("http://localhost:8080/api/ai/analyze-upload", {
          method: "POST",
          body: formData
        });
        if (analyzeRes.ok) {
          designsList = await analyzeRes.json();
        } else {
          const errData = await analyzeRes.json();
          throw new Error(errData.detail || "Backend analysis failed");
        }
      } catch (err: any) {
        console.warn("Backend analysis failed:", err.message);
        // If it's a validation error raised from backend, throw it to the outer catch
        if (err.message.includes("Not appropriate data")) {
          throw err;
        }
        // Fallback mock designs (if server is offline/error but was not validation error)
        designsList = [
          { id: crypto.randomUUID(), style: "Modern", image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Japandi", image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Scandinavian", image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Minimalist", image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=350" },
          { id: crypto.randomUUID(), style: "Luxury", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=350" }
        ];
      }

      setGeneratedDesigns(designsList);
      
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

  const handleCreateFromScratch = async () => {
    setError(null);
    setUploadStep("uploading");

    const userId = user?.id || "d0000000-0000-0000-0000-000000000000";

    try {
      // Parse room dimensions input
      let calculatedWidth = 5.0;
      let calculatedDepth = 5.0;
      try {
        const normalized = dimensionsInput.toLowerCase().replace(/\s+/g, "").replace(/x/g, "*");
        const parts = normalized.split("*");
        if (parts.length >= 2) {
          const part1 = parts[0];
          const part2 = parts[1];
          const num1 = parseFloat(part1) || 5.0;
          const num2 = parseFloat(part2) || 5.0;
          
          let isFt1 = part1.includes("ft") || part1.includes("feet") || part1.includes("'");
          let isFt2 = part2.includes("ft") || part2.includes("feet") || part2.includes("'");
          
          if (!isFt1 && !part1.includes("m") && num1 > 6.0) {
            isFt1 = true;
          }
          if (!isFt2 && !part2.includes("m") && num2 > 6.0) {
            isFt2 = true;
          }
          
          calculatedWidth = isFt1 ? num1 * 0.3048 : num1;
          calculatedDepth = isFt2 ? num2 * 0.3048 : num2;
        }
      } catch (e) {
        console.warn("Error parsing input dimensions:", e);
      }
      
      // Keep dimensions in reasonable bounds
      calculatedWidth = Math.max(2.0, Math.min(20.0, Math.round(calculatedWidth * 100) / 100));
      calculatedDepth = Math.max(2.0, Math.min(20.0, Math.round(calculatedDepth * 100) / 100));
      
      // Calculate derived square footage for database tracking
      const sqFtValue = Math.round((calculatedWidth * calculatedDepth) / 0.0929);

      const structAnalysisObj = {
        property_type: propertyType,
        apartment_type: null,
        community_block: null,
        has_floor_plan: hasFloorPlan,
        square_footage: sqFtValue,
        room_width: calculatedWidth,
        room_depth: calculatedDepth,
        source: "scratch"
      };
      const structAnalysisStr = JSON.stringify(structAnalysisObj);

      // 1. Create project on backend
      let projTitle = "";
      let finalRoomType = roomType;
      
      if (roomType === "Bedroom") {
        projTitle = bedroomNameType === "Custom" 
          ? (customBedroomName.trim() || "Custom Bedroom") 
          : bedroomNameType;
      } else if (roomType === "Other") {
        projTitle = customRoomType.trim() || "My Custom Room";
        finalRoomType = customRoomType.trim() || "Other";
      } else {
        projTitle = projectTitle.trim() || `My ${roomType} Design`;
      }

      let projectIdFromBackend = null;
      try {
        const projRes = await fetch("http://localhost:8080/api/projects/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: projTitle,
            room_type: finalRoomType,
            thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350",
            user_id: userId,
            structural_analysis: structAnalysisStr
          })
        });
        if (projRes.ok) {
          const projectData = await projRes.json();
          projectIdFromBackend = projectData.id;
        }
      } catch (err) {
        console.warn("Backend project creation failed, fallback to client UUID:", err);
      }

      const activeProjId = projectIdFromBackend || crypto.randomUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);
      sessionStorage.setItem("homeverse_project_title", projTitle);
      sessionStorage.setItem("homeverse_room_type", finalRoomType);

      // 2. Create design on backend
      let designIdFromBackend = null;
      try {
        const designRes = await fetch("http://localhost:8080/api/designs/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_id: activeProjId,
            style: selectedStyle,
            image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350",
            selected: true
          })
        });
        if (designRes.ok) {
          const designData = await designRes.json();
          designIdFromBackend = designData.id;
        }
      } catch (err) {
        console.warn("Backend design creation failed:", err);
      }

      const activeDesignId = designIdFromBackend || crypto.randomUUID();

      // 3. Pre-populate layout template objects on the backend database
      const templateObjects = getFurnishedTemplateObjects(finalRoomType, selectedStyle, houseFacing, calculatedWidth, calculatedDepth);
      const designObjectsToSave = [
        { object_type: "floor", material: selectedStyle === "Luxury" ? "granite" : "wood_light", position_x: 0, position_y: 0, position_z: 0, rotation: 0, scale: 1.0 },
        { object_type: "wall", material: selectedStyle === "Minimalist" ? "#ffffff" : selectedStyle === "Luxury" ? "#1e293b" : "#f1f5f9", position_x: 0, position_y: 0, position_z: 0, rotation: 0, scale: 1.0 },
        ...templateObjects
      ];

      for (const obj of designObjectsToSave) {
        try {
          await fetch(`http://localhost:8080/api/designs/${activeDesignId}/objects`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(obj)
          });
        } catch (err) {
          console.warn("Failed to pre-populate template object:", err);
        }
      }

      const localDesign = {
        id: activeDesignId,
        style: selectedStyle,
        image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=350"
      };

      setGeneratedDesigns([localDesign]);
      sessionStorage.setItem("homeverse_generated_designs", JSON.stringify([localDesign]));
      sessionStorage.setItem("homeverse_selected_style", selectedStyle);
      sessionStorage.setItem("homeverse_upload_step", "complete");
      setUploadStep("complete");

      // Redirect directly to studio
      router.push(`/studio?style=${selectedStyle}&designId=${activeDesignId}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize scratch design.");
      setUploadStep("idle");
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

      const activeProjId = projectIdFromBackend || crypto.randomUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);
      sessionStorage.setItem("homeverse_project_title", projTitle);
      sessionStorage.setItem("homeverse_room_type", roomType);

      // 2. Create design on backend
      let activeDesignId = crypto.randomUUID();
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
            body: JSON.stringify(obj)
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

      const activeProjId = projectIdFromBackend || crypto.randomUUID();
      setProjectId(activeProjId);
      sessionStorage.setItem("homeverse_project_id", activeProjId);
      sessionStorage.setItem("homeverse_project_title", projTitle);
      sessionStorage.setItem("homeverse_room_type", roomType);

      // 2. Create design on backend
      let activeDesignId = crypto.randomUUID();
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
            body: JSON.stringify(obj)
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
      await handleUpdateProjectDetails(projectTitle, roomType);
    }

    // Find design matching the selected style
    const matchedDesign = generatedDesigns.find(
      (d) => d.style.toLowerCase() === selectedStyle.toLowerCase()
    );
    if (matchedDesign) {
      router.push(`/studio?style=${selectedStyle}&designId=${matchedDesign.id}`);
    } else {
      router.push(`/studio?style=${selectedStyle}`);
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
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-blue-600 transition-colors cursor-pointer"
                        >
                          <option value="Modern">Modern</option>
                          <option value="Japandi">Japandi</option>
                          <option value="Scandinavian">Scandinavian</option>
                          <option value="Minimalist">Minimalist</option>
                          <option value="Luxury">Luxury</option>
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
                            <option value="Luxury">Luxury</option>
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
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-900">
                        <div>
                          <h3 className="font-bold text-xs text-slate-200">AI Design Suggestions</h3>
                          <p className="text-[9px] text-slate-450 mt-0.5">Select a style preset to open in 3D studio</p>
                        </div>
                        <span className="flex items-center gap-1 text-[9px] text-green-400 font-semibold bg-green-950/20 border border-green-900/40 px-2 py-0.5 rounded-full font-mono">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      </div>

                      {/* Name and Room Type inputs */}
                      <div className="space-y-3 bg-slate-900/25 p-3.5 border border-slate-900/80 rounded-2xl">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-455 font-mono">
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
                            placeholder="e.g. Master Bedroom design"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
                          />
                        </div>
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
                            className="w-full bg-slate-955 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                          >
                            <option value="Living Room" className="bg-slate-900 text-slate-200">Living Room</option>
                            <option value="Bedroom" className="bg-slate-900 text-slate-200">Bedroom</option>
                            <option value="Office" className="bg-slate-900 text-slate-200">Home Office</option>
                            <option value="Kitchen" className="bg-slate-900 text-slate-200">Kitchen</option>
                            <option value="Bathroom" className="bg-slate-900 text-slate-200">Bathroom</option>
                            <option value="Dining Room" className="bg-slate-900 text-slate-200">Dining Room</option>
                          </select>
                        </div>
                      </div>

                      {/* Grid of Styles */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 items-center py-2">
                        {styles.map((style) => {
                          return (
                            <button
                              key={style.name}
                              onClick={() => {
                                setSelectedStyle(style.name);
                                setShowOriginal(false);
                              }}
                              className={`group relative rounded-xl overflow-hidden border text-left p-2 bg-slate-955 hover:bg-slate-900/80 transition-all cursor-pointer h-24 flex flex-col justify-between ${
                                selectedStyle === style.name
                                  ? "border-blue-500 ring-1 ring-blue-500/50"
                                  : "border-slate-850"
                              }`}
                            >
                              <div className="relative h-12 w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                                <img
                                  src={style.img}
                                  alt={style.name}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <span className="font-bold text-[10px] text-slate-300">{style.name}</span>
                            </button>
                          );
                        })}
                      </div>
     
                      {/* Enter Studio Trigger */}
                      <button
                        onClick={handleEnterStudio}
                        className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn mt-2 text-xs"
                      >
                        Open in Design Studio <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Informational badge for custom room rendering */}
                      <div className="mt-3 p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] text-blue-400 leading-relaxed flex items-start gap-2 animate-fadeIn">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span>
                          <strong>Visual Studio Mode:</strong> Open the Design Studio to view the 3D furniture models arranged directly inside your uploaded room photo with realistic shadows!
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
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Design Wizard: Step {scratchStep} of 3
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((s) => (
                          <div
                            key={s}
                            className={`w-4 h-1.5 rounded-full transition-all ${
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

                    {/* STEP 1: Property Type */}
                    {scratchStep === 1 && (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-350 block">
                          What type of property are we designing?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPropertyType("independent")}
                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                              propertyType === "independent"
                                ? "bg-blue-950/20 border-blue-500 text-blue-400"
                                : "bg-slate-950/40 border-slate-850 text-slate-455 hover:text-slate-300"
                            }`}
                          >
                            <span className="font-bold text-xs">🏠 Independent House</span>
                            <span className="text-[10px] text-slate-500 font-normal">Single standing villa, bungalow, or duplex.</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPropertyType("apartment")}
                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                              propertyType === "apartment"
                                ? "bg-blue-950/20 border-blue-500 text-blue-400"
                                : "bg-slate-950/40 border-slate-850 text-slate-455 hover:text-slate-300"
                            }`}
                          >
                            <span className="font-bold text-xs">🏢 Apartment / Flat</span>
                            <span className="text-[10px] text-slate-500 font-normal">Multistory building unit, flat, or condo.</span>
                          </button>
                        </div>
                      </div>
                    )}
                                    {/* STEP 2: Floor Plan Share */}
                    {scratchStep === 2 && (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-355 block">
                          Do you have a floor plan map that you can share?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHasFloorPlan("no")}
                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                              hasFloorPlan === "no"
                                ? "bg-blue-950/20 border-blue-500 text-blue-400"
                                : "bg-slate-950/40 border-slate-855 text-slate-455 hover:text-slate-300"
                            }`}
                          >
                            <span className="font-bold text-xs">📐 Draw Manually</span>
                            <span className="text-[10px] text-slate-500 font-normal">I will enter square feet and place walls myself.</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasFloorPlan("yes")}
                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                              hasFloorPlan === "yes"
                                ? "bg-blue-950/20 border-blue-500 text-blue-400"
                                : "bg-slate-955 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                            }`}
                          >
                            <span className="font-bold text-xs">📂 Share Floor Plan</span>
                            <span className="text-[10px] text-slate-500 font-normal">Upload plan image/drawing (Optional).</span>
                          </button>
                        </div>
                        {hasFloorPlan === "yes" && (
                          <div className="border border-dashed border-slate-800 rounded-xl p-3 bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 cursor-pointer hover:border-slate-700">
                            📎 Attach Floorplan Image (PNG/JPG)
                          </div>
                        )}
                      </div>
                    )}

                    {scratchStep === 3 && (
                      <div className="space-y-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                            Room Dimensions
                          </label>
                          <input
                            type="text"
                            value={dimensionsInput}
                            onChange={(e) => setDimensionsInput(e.target.value)}
                            placeholder="e.g. 3.63 m * 3.94 m or 12 ft * 15 ft"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                          />
                          <span className="text-[9px] text-slate-500 font-sans leading-relaxed">
                            Supports meters (m) or feet (ft) like <span className="font-mono text-slate-400 font-bold">3.63 m * 3.94 m</span> or <span className="font-mono text-slate-400 font-bold">12 ft * 15 ft</span>.
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                            Room Type
                          </label>
                          <select
                            value={roomType}
                            onChange={(e) => setRoomType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                          >
                            <option value="Living Room" className="bg-slate-900 text-slate-200">Living Room</option>
                            <option value="Bedroom" className="bg-slate-900 text-slate-200">Bedroom</option>
                            <option value="Office" className="bg-slate-900 text-slate-200">Home Office</option>
                            <option value="Kitchen" className="bg-slate-900 text-slate-200">Kitchen/Dining</option>
                            <option value="Other" className="bg-slate-900 text-slate-200">Other</option>
                          </select>
                        </div>

                        {roomType === "Other" && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                              Custom Room Title / Type
                            </label>
                            <input
                              type="text"
                              value={customRoomType}
                              onChange={(e) => {
                                setCustomRoomType(e.target.value);
                                setProjectTitle(e.target.value);
                              }}
                              placeholder="e.g. Home Gym, Media Room, Library"
                              className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                            />
                          </div>
                        )}

                        {roomType === "Bedroom" && (
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                                Choose Bedroom Name
                              </label>
                              <select
                                value={bedroomNameType}
                                onChange={(e) => setBedroomNameType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                              >
                                <option value="Master Bedroom" className="bg-slate-900 text-slate-200">Master Bedroom</option>
                                <option value="Kids Bedroom" className="bg-slate-900 text-slate-200">Kids Bedroom</option>
                                <option value="Guest Bedroom" className="bg-slate-900 text-slate-200">Guest Bedroom</option>
                                <option value="Teen Bedroom" className="bg-slate-900 text-slate-200">Teen Bedroom</option>
                                <option value="Custom" className="bg-slate-900 text-slate-200">Custom Bedroom Name...</option>
                              </select>
                            </div>

                            {bedroomNameType === "Custom" && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                                  Custom Bedroom Name
                                </label>
                                <input
                                  type="text"
                                  value={customBedroomName}
                                  onChange={(e) => {
                                    setCustomBedroomName(e.target.value);
                                    setProjectTitle(e.target.value);
                                  }}
                                  placeholder="e.g. Anisha's Bedroom"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {roomType !== "Other" && roomType !== "Bedroom" && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                              Design Title / Name
                            </label>
                            <input
                              type="text"
                              value={projectTitle === "My Interior Design" ? `My Custom Room` : projectTitle}
                              onChange={(e) => setProjectTitle(e.target.value)}
                              placeholder="e.g. Dream Living Room"
                              className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                         {/* Starting Preset */}
                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Style Theme */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                              Style Theme
                            </label>
                            <div className="grid grid-cols-2 gap-1 py-1">
                              {styles.map((style) => (
                                <button
                                  key={style.name}
                                  type="button"
                                  onClick={() => setSelectedStyle(style.name)}
                                  className={`rounded-lg py-1 text-center transition-all cursor-pointer border text-[9px] font-bold ${
                                    selectedStyle === style.name
                                      ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                      : "bg-slate-900 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-850"
                                  }`}
                                >
                                  {style.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* House Facing */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                              House Facing
                            </label>
                            <div className="grid grid-cols-2 gap-1 py-1">
                              {["North", "East", "West", "South"].map((dir) => (
                                <button
                                  key={dir}
                                  type="button"
                                  onClick={() => setHouseFacing(dir)}
                                  className={`rounded-lg py-1 text-center transition-all cursor-pointer border text-[9px] font-bold ${
                                    houseFacing === dir
                                      ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                      : "bg-slate-900 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-850"
                                  }`}
                                >
                                  {dir}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Fully Furnished Templates */}
                        <div className="space-y-1.5 pt-0.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block">
                            Select Fully Furnished Template Option
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Option 1: Layout A */}
                            <button
                              type="button"
                              onClick={() => setSelectedLayoutTemplate("layout-a")}
                              className={`p-2.5 rounded-xl border text-left space-y-1.5 transition-all cursor-pointer flex flex-col h-36 group ${
                                selectedLayoutTemplate === "layout-a"
                                  ? "bg-slate-900/60 border-blue-500 text-blue-400 shadow-lg"
                                  : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                              }`}
                            >
                              <div className="relative w-full h-18 rounded-lg overflow-hidden border border-slate-800/80">
                                <img
                                  src={getTemplateImage(selectedStyle, houseFacing, "layout-a")}
                                  alt="Layout A"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute bottom-1 left-1 text-[7px] bg-blue-950/95 text-blue-400 border border-blue-800/40 px-1 py-0.2 rounded font-mono font-bold">
                                  Balanced Layout
                                </span>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-[10px] text-slate-200 leading-tight">Balanced Center Setup</h4>
                                <p className="text-[8px] text-slate-500 font-sans mt-0.5 leading-snug line-clamp-1">
                                  Centered seating/bed alignment optimized for traffic flow.
                                </p>
                              </div>
                            </button>

                            {/* Option 2: Layout B */}
                            <button
                              type="button"
                              onClick={() => setSelectedLayoutTemplate("layout-b")}
                              className={`p-2.5 rounded-xl border text-left space-y-1.5 transition-all cursor-pointer flex flex-col h-36 group ${
                                selectedLayoutTemplate === "layout-b"
                                  ? "bg-slate-900/60 border-blue-500 text-blue-400 shadow-lg"
                                  : "bg-slate-955 border border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                              }`}
                            >
                              <div className="relative w-full h-18 rounded-lg overflow-hidden border border-slate-800/80">
                                <img
                                  src={getTemplateImage(selectedStyle, houseFacing, "layout-b")}
                                  alt="Layout B"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute bottom-1 left-1 text-[7px] bg-emerald-950/95 text-emerald-450 border border-emerald-800/40 px-1 py-0.2 rounded font-mono font-bold">
                                  Corner Accent Layout
                                </span>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-[10px] text-slate-200 leading-tight">Cosy Corner Concept</h4>
                                <p className="text-[8px] text-slate-500 font-sans mt-0.5 leading-snug line-clamp-1">
                                  Maximizes visual space by placing focal furniture along side walls.
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex gap-2.5">
                    {scratchStep > 1 && (
                      <button
                        type="button"
                        onClick={prevScratchStep}
                        className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-355 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    
                    {scratchStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextScratchStep}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold border border-slate-800 rounded-xl transition-all cursor-pointer text-xs"
                      >
                        Continue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateFromScratch}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer glow-btn text-xs animate-bounce"
                      >
                        Open Studio Space <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Side: Demo showcase preview */}
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
                    showOriginal && uploadedFileUrl ? (
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
                      (() => {
                        const matchedDesign = generatedDesigns.find(
                          (d) => d.style.toLowerCase() === selectedStyle.toLowerCase()
                        );
                        const displayImg = matchedDesign?.image_url || styles.find((s) => s.name === selectedStyle)?.img;
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
                    const displayImg = getTemplateImage(selectedStyle, houseFacing, selectedLayoutTemplate as any);

                    return (
                      <div className="relative w-full h-full animate-fadeIn group">
                        <img
                          src={displayImg}
                          alt="Active Workspace Preview"
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                        />
                        
                        {/* Live Specs Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-4 pt-10">
                          <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
                            <span className="text-[8px] bg-blue-500/10 border border-blue-500/25 text-blue-400 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {roomType || "Living Room"}
                            </span>
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {selectedStyle} Theme
                            </span>
                            <span className="text-[8px] bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold font-mono px-2 py-0.5 rounded uppercase">
                              {houseFacing} Facing
                            </span>
                          </div>
                          
                          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            {selectedLayoutTemplate === "layout-a" ? "Balanced Setup Preview" : "Cosy Corner Setup Preview"}
                          </h3>
                          
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Furnished template matching <span className="font-mono text-slate-300 font-semibold">{dimensionsInput || "standard dimensions"}</span>. Standard minimalist meshes will align automatically upon workspace load.
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
