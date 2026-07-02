"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play, FileText, Download, Plus, Sparkles, Layers, Box, Search, Sliders, ShoppingBag, Image as ImageIcon, ShoppingCart, Trash2, ExternalLink } from "lucide-react";
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

  // AI Design Advisor states
  const [isScratchMode, setIsScratchMode] = useState(false);
  const [scratchPropertyType, setScratchPropertyType] = useState<string>("independent");
  const [scratchApartmentType, setScratchApartmentType] = useState<string>("single");
  const [scratchCommunityBlock, setScratchCommunityBlock] = useState<string>("Block A");
  const [scratchSqFt, setScratchSqFt] = useState<number>(1000);
  const [occupantsCount, setOccupantsCount] = useState<number>(4);
  const [hasBalcony, setHasBalcony] = useState<boolean>(false);
  const [windowTreatment, setWindowTreatment] = useState<"curtains" | "blinds">("curtains");
  const [hasGrills, setHasGrills] = useState<boolean>(true);
  const [viewType, setViewType] = useState<string>("city");
  const [wallPaintColor, setWallPaintColor] = useState<string>("#f8fafc");
  const [sofaComplimentaryColor, setSofaComplimentaryColor] = useState<string>("#1e293b");


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
                  if (struct.source === "scratch") {
                    setIsScratchMode(true);
                    setActiveLeftTab("advisor");
                  }
                  if (struct.property_type) setScratchPropertyType(struct.property_type);
                  if (struct.apartment_type) setScratchApartmentType(struct.apartment_type);
                  if (struct.community_block) setScratchCommunityBlock(struct.community_block);
                  if (struct.square_footage) setScratchSqFt(struct.square_footage);
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
                  const struct = projectData.structural_analysis ? JSON.parse(projectData.structural_analysis) : {};
                  const isScratch = struct.source === "scratch";
                  const initialObjs = isScratch
                    ? [
                        { id: "floor-1", object_type: "floor", position_x: 0, position_y: 0, position_z: 0, rotation: 0, scale: 1.0, material: initialStyle === "Luxury" ? "granite" : "wood_light" },
                        { id: "wall-1", object_type: "wall", position_x: 0, position_y: 1.5, position_z: -(struct.room_depth ? Number(struct.room_depth)/2 : 5) - 2.5, rotation: 0, scale: 1.0, material: initialStyle === "Minimalist" ? "#ffffff" : "#f1f5f9" }
                      ]
                    : getInitialObjectsForRoomType(projectData.room_type, initialStyle);
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
  const [activeLeftTab, setActiveLeftTab] = useState<"library" | "recommendations" | "imgTo3D" | "advisor">("library");
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

  // Rendering style state (Mockup vs. Realistic glTF)
  const [renderStyle, setRenderStyle] = useState<"mockup" | "realistic">("realistic");

  // Shopping Cart & Invoice states
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjectId) {
        const obj = objects.find((o) => o.id === selectedObjectId);
        if (obj && obj.object_type !== "floor" && obj.object_type !== "wall") {
          handleDeleteObject(selectedObjectId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedObjectId, objects]);

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + parsePrice(item.price) * (item.quantity || 1), 0);
  };

  const calculateGST = () => {
    return Math.round(calculateSubtotal() * 0.18);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-IN");
  };

  const getProductDimensions = (category: string) => {
    switch (category.toLowerCase()) {
      case "sofa": return "2.2m (W) × 0.9m (H) × 1.1m (D)";
      case "table":
      case "coffee_table": return "1.2m (W) × 0.45m (H) × 0.7m (D)";
      case "bed": return "1.8m (W) × 0.9m (H) × 2.0m (D)";
      case "desk": return "1.4m (W) × 0.75m (H) × 0.8m (D)";
      case "chair": return "0.6m (W) × 0.85m (H) × 0.6m (D)";
      case "lighting":
      case "lamp": return "0.4m (W) × 1.4m (H) × 0.4m (D)";
      default: return "Standard dimensions";
    }
  };

  const handleGeneratePDFProposal = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker prevented opening the proposal. Please allow popups for this site.");
      return;
    }

    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    const total = calculateTotal();
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const itemsHtml = cart.map((item, index) => {
      const itemPrice = parsePrice(item.price);
      const rowTotal = itemPrice * (item.quantity || 1);
      const dimensions = getProductDimensions(item.category);
      
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${index + 1}</td>
          <td>
            <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Style: ${item.style} | Dim: ${dimensions}
            </div>
          </td>
          <td style="text-transform: capitalize;">${item.category}</td>
          <td style="text-align: center;">${item.quantity || 1}</td>
          <td style="font-family: monospace; text-align: right;">₹${formatNumber(itemPrice)}</td>
          <td style="font-family: monospace; text-align: right; font-weight: 600;">₹${formatNumber(rowTotal)}</td>
          <td style="text-align: center;">
            ${item.product_url ? `<a href="${item.product_url}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">Buy Link</a>` : "N/A"}
          </td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>HomeVerse Interior Design Proposal</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
          body {
            font-family: 'Outfit', sans-serif;
            color: #334155;
            padding: 40px;
            margin: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #0f172a;
          }
          .proposal-title {
            text-align: right;
          }
          .proposal-title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .proposal-title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .meta-section {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-bottom: 35px;
            font-size: 13px;
          }
          .meta-box {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 16px;
          }
          .meta-box h3 {
            margin: 0 0 10px 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 90px 1fr;
            gap: 6px;
          }
          .meta-label {
            color: #64748b;
          }
          .meta-value {
            font-weight: 600;
            color: #0f172a;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
            font-size: 13px;
          }
          .items-table th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            color: #475569;
          }
          .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .summary-table {
            width: 280px;
            border-collapse: collapse;
            font-size: 13px;
          }
          .summary-table td {
            padding: 8px 10px;
          }
          .summary-table tr.total-row {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            border-top: 2px solid #e2e8f0;
          }
          .summary-table tr.total-row td {
            padding-top: 12px;
          }
          .notes-section {
            background-color: #eff6ff;
            border: 1.5px dashed #bfdbfe;
            border-radius: 12px;
            padding: 16px;
            font-size: 12px;
            line-height: 1.5;
            color: #1e3a8a;
            margin-bottom: 40px;
          }
          .notes-section h4 {
            margin: 0 0 6px 0;
            font-weight: 600;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          .print-bar {
            background-color: #0f172a;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .print-info {
            color: #94a3b8;
            font-size: 12px;
          }
          .btn-print {
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .btn-print:hover {
            background-color: #1d4ed8;
          }
          @media print {
            .print-bar {
              display: none;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="print-bar">
            <span class="print-info">📄 HomeVerse Interior Design Proposal Draft</span>
            <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
          </div>

          <div class="header">
            <div class="logo">Home<span>Verse</span></div>
            <div class="proposal-title">
              <h1>Design Proposal</h1>
              <p>Date: ${dateStr}</p>
            </div>
          </div>

          <div class="meta-section">
            <div class="meta-box">
              <h3>Client Information</h3>
              <div class="meta-grid">
                <div class="meta-label">Client:</div>
                <div class="meta-value">Offline Designer</div>
                <div class="meta-label">Email:</div>
                <div class="meta-value">offline@homeverse.ai</div>
                <div class="meta-label">Plan Tier:</div>
                <div class="meta-value">Free Design Studio</div>
              </div>
            </div>
            
            <div class="meta-box">
              <h3>Project Specifications</h3>
              <div class="meta-grid">
                <div class="meta-label">Room Type:</div>
                <div class="meta-value" style="text-transform: capitalize;">${roomType || "Living Room"}</div>
                <div class="meta-label">Dimensions:</div>
                <div class="meta-value">${roomWidth.toFixed(1)}m × ${roomDepth.toFixed(1)}m</div>
                <div class="meta-label">Active Style:</div>
                <div class="meta-value">${initialStyle || "Modern"}</div>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>Item Description</th>
                <th style="width: 100px;">Category</th>
                <th style="width: 60px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 100px; text-align: right;">Total Price</th>
                <th style="width: 80px; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal:</td>
                <td style="font-family: monospace; text-align: right; font-weight: 600; color: #0f172a;">₹${formatNumber(subtotal)}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Estimated GST (18%):</td>
                <td style="font-family: monospace; text-align: right; font-weight: 600; color: #0f172a;">₹${formatNumber(gst)}</td>
              </tr>
              <tr class="total-row">
                <td>Estimated Total:</td>
                <td style="font-family: monospace; text-align: right; font-weight: 700; color: #2563eb;">₹${formatNumber(total)}</td>
              </tr>
            </table>
          </div>

          <div class="notes-section">
            <h4>💡 Important Proposal Information</h4>
            <p style="margin: 0;">
              This is an AI-assisted interior design proposal generated by HomeVerse. Bounding dimensions reflect standardized sizes matching typical 3D scene placements. Actual pricing may vary slightly based on retail stock availability, regional logistics, and specific customization requests directly on Pepperfry, IKEA, or Urban Ladder.
            </p>
          </div>

          <div class="footer">
            <p>HomeVerse Interior Customization Studio &copy; 2026. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Ray-Traced 4K Rendering states
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [renderQuality, setRenderQuality] = useState<"1080p" | "2K" | "4K">("4K");
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  const [renderImage, setRenderImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // WebXR AR Simulation states
  const [showARModal, setShowARModal] = useState(false);
  const [arCameraActive, setArCameraActive] = useState(false);
  const [arSurfaceDetected, setArSurfaceDetected] = useState(false);
  const [arPlaced, setArPlaced] = useState(false);
  const [arLogs, setArLogs] = useState<string[]>([]);
  const [arTargetObject, setArTargetObject] = useState<string>("sofa");

  // Auto-apply starting style presets only if we haven't loaded objects from database
  useEffect(() => {
    if (initialStyle && !hasLoadedFromDb) {
      applyStylePreset(initialStyle);
      setRecommendQuery(initialStyle);
    }
  }, [initialStyle, hasLoadedFromDb]);

  // Fetch recommendations from backend
  const fetchRecommendations = async (overrideQuery?: string) => {
    setLoadingRecommendations(true);
    setRecommendError(null);
    try {
      const response = await fetch("http://localhost:8080/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: overrideQuery || recommendQuery,
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

  // Sync recommendation query to selected object category + style
  useEffect(() => {
    if (selectedObjectId) {
      const selectedObj = objects.find((o) => o.id === selectedObjectId);
      if (selectedObj && selectedObj.object_type !== "floor" && selectedObj.object_type !== "wall") {
        let categoryName = selectedObj.object_type;
        if (categoryName === "coffee_table") categoryName = "Table";
        else if (categoryName === "lamp") categoryName = "Lighting";
        
        const categoryFormatted = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        const stylePrefix = initialStyle || "Modern";
        const newQuery = `${stylePrefix} ${categoryFormatted}`;
        setRecommendQuery(newQuery);
        setActiveLeftTab("recommendations");
        fetchRecommendations(newQuery);
      }
    }
  }, [selectedObjectId]);

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

  const handleUpdatePropertyType = async (newType: string) => {
    setScratchPropertyType(newType);
    const activeProjId = projectId || sessionStorage.getItem("homeverse_project_id");
    if (!activeProjId) return;

    try {
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

      currentStruct.property_type = newType;

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
      console.warn("Failed to sync property type to backend:", err);
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

  const handleStartRayTracedRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderImage(null);
    setRenderLogs(["Initializing WebGPU render pipe...", "Allocating ray buffers..."]);

    const renderInterval = setInterval(() => {
      setRenderProgress((prev) => {
        const next = prev + 5;

        if (next === 15) {
          setRenderLogs((l) => [...l, "Baking ambient occlusion volume..."]);
        } else if (next === 30) {
          setRenderLogs((l) => [...l, "Bouncing rays: 16 samples per pixel..."]);
        } else if (next === 50) {
          setRenderLogs((l) => [...l, "Bouncing rays: 64 samples per pixel..."]);
        } else if (next === 70) {
          setRenderLogs((l) => [...l, "Bouncing rays: 256 samples per pixel (HQ)..."]);
        } else if (next === 85) {
          setRenderLogs((l) => [...l, "Running AI bilateral denoiser filter..."]);
        } else if (next === 95) {
          setRenderLogs((l) => [...l, "Baking tone mapping exposure matrix..."]);
        }

        if (next >= 100) {
          clearInterval(renderInterval);
          setIsRendering(false);
          setRenderImage("https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=800");
          setRenderLogs((l) => [...l, "4K Photo-realistic Ray-Traced Render generated!"]);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleEnterARXR = () => {
    setArCameraActive(true);
    setArSurfaceDetected(false);
    setArPlaced(false);
    setArLogs(["Starting camera hardware access...", "Initializing ARCore coordinate system..."]);

    setTimeout(() => {
      setArLogs((l) => [...l, "Scanning horizontal planes..."]);
      setTimeout(() => {
        setArSurfaceDetected(true);
        setArLogs((l) => [...l, "Floor plane detected! Surface ready for projection."]);
      }, 1500);
    }, 1000);
  };

  // Add object from asset catalog or recommender
  const handleAddObject = async (
    type: any,
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
            onClick={() => {
              setShowARModal(true);
              setArCameraActive(false);
              setArSurfaceDetected(false);
              setArPlaced(false);
              setArLogs([]);
              // Default projection target is the first furniture item, or default to sofa
              const firstObj = objects.find(o => o.object_type !== "floor" && o.object_type !== "wall");
              setArTargetObject(firstObj ? firstObj.object_type : "sofa");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-650/40 border border-indigo-900/60 hover:bg-indigo-600 text-slate-200 rounded-xl transition-colors cursor-pointer animate-pulse"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> WebXR Projection
          </button>

          <button
            onClick={() => alert("Design Proposal exported to PDF (Dummy file generated).")}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Download Proposal PDF"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Rendering Style Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-slate-350 mr-1.5">
            <button
              onClick={() => setRenderStyle("mockup")}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                renderStyle === "mockup"
                  ? "bg-slate-800 text-white"
                  : "hover:text-slate-200"
              }`}
            >
              Mockups
            </button>
            <button
              onClick={() => setRenderStyle("realistic")}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                renderStyle === "realistic"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:text-slate-200"
              }`}
            >
              glTF Models
            </button>
          </div>

          <button
            onClick={() => {
              setShowRenderModal(true);
              setRenderImage(null);
              setRenderProgress(0);
              setIsRendering(false);
              setRenderLogs([]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-650 hover:bg-blue-600 text-white rounded-xl transition-all cursor-pointer glow-btn mr-1"
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
          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveLeftTab("library")}
              className={`flex items-center justify-center py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "library"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setActiveLeftTab("advisor")}
              className={`flex items-center justify-center py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "advisor"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Advisor
            </button>
            <button
              onClick={() => setActiveLeftTab("recommendations")}
              className={`flex items-center justify-center py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "recommendations"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Shop
            </button>
            <button
              onClick={() => setActiveLeftTab("imgTo3D")}
              className={`flex items-center justify-center py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLeftTab === "imgTo3D"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Img-3D
            </button>
          </div>

          <div className="flex-1 space-y-4 min-h-0">
            {activeLeftTab === "library" && (
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

                    <button
                      onClick={() => handleAddObject("door")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Door</p>
                        <span className="text-[10px] text-slate-500 font-normal">Wooden room door</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("window")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-blue-950/20 border border-blue-900/40 rounded-lg text-blue-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Window</p>
                        <span className="text-[10px] text-slate-500 font-normal">Glass window with metal grills</span>
                      </div>
                    </button>

                    {/* New Minimal Furniture Items */}
                    <button
                      onClick={() => handleAddObject("bookshelf")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-yellow-955/20 border border-yellow-900/40 rounded-lg text-yellow-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Bookshelf</p>
                        <span className="text-[10px] text-slate-500 font-normal">Vertical storage shelving unit</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("nightstand")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-indigo-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Nightstand</p>
                        <span className="text-[10px] text-slate-500 font-normal">Sleek bedroom bedside cabinet</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("wardrobe")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-pink-955/20 border border-pink-900/40 rounded-lg text-pink-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Wardrobe</p>
                        <span className="text-[10px] text-slate-500 font-normal">Premium double door clothes closet</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("rug")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-teal-950/20 border border-teal-900/40 rounded-lg text-teal-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Floor Rug</p>
                        <span className="text-[10px] text-slate-500 font-normal">Flat woven floor rug</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("armchair")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Armchair</p>
                        <span className="text-[10px] text-slate-500 font-normal">Cozy single cushion armchair</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("sideboard")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-amber-955/20 border border-amber-900/40 rounded-lg text-amber-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Sideboard</p>
                        <span className="text-[10px] text-slate-500 font-normal">Low credenza storage cabinet</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("pouf")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-purple-950/20 border border-purple-900/40 rounded-lg text-purple-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Pouf Stool</p>
                        <span className="text-[10px] text-slate-500 font-normal">Comfy round ottoman cushion</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("mirror")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-cyan-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Wall Mirror</p>
                        <span className="text-[10px] text-slate-500 font-normal">Circular metallic wall mirror</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("bench")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-orange-950/20 border border-orange-900/40 rounded-lg text-orange-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Bench</p>
                        <span className="text-[10px] text-slate-500 font-normal">Modern entryway wooden bench</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("stool")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Accent Stool</p>
                        <span className="text-[10px] text-slate-500 font-normal">Three-legged accent stool</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("bar_stool")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-blue-955/20 border border-blue-900/40 rounded-lg text-blue-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Bar Stool</p>
                        <span className="text-[10px] text-slate-500 font-normal">Tall kitchen counter bar stool</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("plant_box")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-green-950/20 border border-green-900/40 rounded-lg text-green-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Planter Box</p>
                        <span className="text-[10px] text-slate-500 font-normal">Concrete planter with green foliage</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAddObject("console_table")}
                      className="w-full flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/60 rounded-xl text-left text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      <div className="p-2 bg-violet-950/20 border border-violet-900/40 rounded-lg text-violet-500">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p>Insert Console Table</p>
                        <span className="text-[10px] text-slate-500 font-normal">Sleek hallway console table</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === "advisor" && (
              <div className="space-y-4 flex flex-col h-full animate-fade-in text-xs text-slate-300">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-slate-200">AI Design Advisor</span>
                </div>

                {isScratchMode ? (
                  /* SCRATCH MODE ADVISOR */
                  <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1">
                      <p className="font-bold text-blue-400 font-sans">Custom House Plan (Scratch)</p>
                      <p className="text-[10px] text-slate-405">
                        Blank space: <span className="text-white font-semibold">{scratchSqFt} sq. ft.</span>
                      </p>
                      <p className="text-[10px] text-slate-405 capitalize">
                        Property: <span className="text-white font-semibold">{scratchPropertyType}</span>
                        {scratchPropertyType === "apartment" && ` (${scratchApartmentType} ${scratchCommunityBlock ? `- ${scratchCommunityBlock}` : ""})`}
                      </p>
                    </div>

                    <div className="space-y-2 bg-slate-900/20 border border-slate-850 p-3 rounded-xl">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">1. Build Structural Plan</label>
                      <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
                        Use the 2D Blueprint editor to draw partition walls, set doors, and place windows.
                      </p>
                      
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => handleAddObject("partition")}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center font-bold text-[9px] text-slate-200 cursor-pointer"
                        >
                          🧱 Wall
                        </button>
                        <button
                          onClick={() => handleAddObject("door")}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center font-bold text-[9px] text-slate-200 cursor-pointer"
                        >
                          🚪 Door
                        </button>
                        <button
                          onClick={() => handleAddObject("window")}
                          className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center font-bold text-[9px] text-slate-200 cursor-pointer"
                        >
                          🪟 Window
                        </button>
                      </div>

                      <button
                        onClick={() => setViewMode(viewMode === "2D" ? "3D" : "2D")}
                        className="w-full mt-1.5 py-1.5 bg-blue-650 hover:bg-blue-600 font-bold rounded-lg text-center text-[10px] cursor-pointer text-white"
                      >
                        Switch to {viewMode === "2D" ? "3D Decor View" : "2D Floorplan"}
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-850">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">2. Occupant Planning</label>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Adjust occupancy count to customize layout suitability.</p>
                      
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[10px] text-slate-400">Residents:</span>
                        <select
                          value={occupantsCount}
                          onChange={(e) => setOccupantsCount(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-850 rounded px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>{n} Occupants</option>
                          ))}
                        </select>
                      </div>

                      {occupantsCount >= 6 ? (
                        <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1.5">
                          <p className="font-bold text-[10px] text-amber-400 flex items-center gap-1">🍽️ 6-Seater Dining Recommended</p>
                          <p className="text-[9px] text-slate-400 leading-normal">With {occupantsCount} family members, we suggest placing a full-sized dining table set in your center layout.</p>
                          <button
                            onClick={() => handleAddObject("dining_table")}
                            className="w-full py-1 bg-amber-600 hover:bg-amber-500 font-bold text-[9px] text-white rounded cursor-pointer transition-colors"
                          >
                            Add 6-Seater Dining Table
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-1.5">
                          <p className="font-bold text-[10px] text-blue-400">💡 Standard Seating</p>
                          <p className="text-[9px] text-slate-400 leading-normal">For {occupantsCount} people, a compact working desk or smaller dining desk fits beautifully.</p>
                          <button
                            onClick={() => handleAddObject("desk")}
                            className="w-full py-1 bg-blue-600 hover:bg-blue-500 font-bold text-[9px] text-white rounded cursor-pointer transition-colors"
                          >
                            Add Small Study Desk
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">3. Zoning & Partitions</label>
                      <p className="text-[9px] text-slate-400 leading-relaxed">Add sliding shutters or glass dividers to define areas.</p>
                      <button
                        onClick={() => handleAddObject("shutters")}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-[9px] text-slate-300 rounded cursor-pointer transition-colors"
                      >
                        Place Room Divider Shutter
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UPLOAD MODE ADVISOR */
                  <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-1">
                      <p className="font-bold text-emerald-400 font-sans">AI Scan Advisors</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Suggestions processed from photo upload.</p>
                    </div>

                    {/* Paint Matching */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">🎨 Paint & Sofa Matching</label>
                      <p className="text-[9px] text-slate-400 leading-relaxed">Match wall paints with complimentary sofa colors.</p>
                      
                      <div className="grid grid-cols-5 gap-1 py-1">
                        {[
                          { name: "White", hex: "#f8fafc", sofa: "#1e293b", sofaName: "Navy Blue" },
                          { name: "Blue", hex: "#93c5fd", sofa: "#fafafa", sofaName: "Warm Ivory" },
                          { name: "Green", hex: "#a7f3d0", sofa: "#7c2d12", sofaName: "Terracotta" },
                          { name: "Tan", hex: "#fef3c7", sofa: "#1b2a47", sofaName: "Charcoal" },
                          { name: "Grey", hex: "#64748b", sofa: "#f59e0b", sofaName: "Mustard Yellow" }
                        ].map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => {
                              setWallPaintColor(c.hex);
                              setSofaComplimentaryColor(c.sofa);
                              const wallObj = objects.find(o => o.object_type === "wall");
                              if (wallObj) handleUpdateObject(wallObj.id, { material: c.hex });
                            }}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              wallPaintColor === c.hex
                                ? "bg-slate-900 border-blue-500 shadow-md text-white"
                                : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400"
                            }`}
                          >
                            <div className="w-4 h-4 mx-auto rounded-full border border-slate-800" style={{ backgroundColor: c.hex }} />
                            <span className="text-[8px] mt-1 block truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Complimentary Sofa: <span className="text-white font-semibold">
                            {
                              wallPaintColor === "#f8fafc" ? "Navy Blue" :
                              wallPaintColor === "#93c5fd" ? "Warm Ivory" :
                              wallPaintColor === "#a7f3d0" ? "Terracotta" :
                              wallPaintColor === "#fef3c7" ? "Charcoal" : "Mustard Yellow"
                            }
                          </span>
                        </p>
                        <button
                          onClick={() => handleAddObject("sofa", sofaComplimentaryColor)}
                          className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] rounded cursor-pointer transition-colors"
                        >
                          Add Complementary Sofa
                        </button>
                      </div>
                    </div>

                    {/* Window Treatment */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">🪟 Windows & Balconies</label>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 py-1">
                        <span>Has an open balcony?</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setHasBalcony(true)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              hasBalcony ? "bg-emerald-950 text-emerald-400 border-emerald-500" : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setHasBalcony(false)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              !hasBalcony ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {hasBalcony ? (
                        <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-1.5">
                          <p className="font-bold text-[10px] text-emerald-400">🌴 French Window & Balcony Design</p>
                          <p className="text-[9px] text-slate-400 leading-normal">Place a wooden balcony deck outside with modern glass railings. You can also place sliding screen shutters.</p>
                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <button
                              onClick={() => handleAddObject("balcony")}
                              className="py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              Add Balcony Deck
                            </button>
                            <button
                              onClick={() => handleAddObject("shutters")}
                              className="py-1 bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              Add Glass Shutters
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-300">Outside View:</span>
                            <select
                              value={viewType}
                              onChange={(e) => setViewType(e.target.value)}
                              className="bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] text-slate-200"
                            >
                              <option value="scenic">Scenic View</option>
                              <option value="city">City View</option>
                              <option value="street">Street View</option>
                            </select>
                          </div>
                          
                          <p className="text-[9px] text-slate-400 leading-normal">
                            {viewType === "scenic" && "Scenic views match translucent curtains to let light filter softly while showcasing the scenery."}
                            {viewType === "city" && "City lights at night call for blackout curtains or roller blinds to cover windows fully."}
                            {viewType === "street" && "High-traffic street views require safety window grills and privacy blinds."}
                          </p>

                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <button
                              onClick={() => handleAddObject("curtains", "#e2e8f0")}
                              className="py-1 bg-blue-650 hover:bg-blue-600 text-white font-bold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              Draw Curtains
                            </button>
                            <button
                              onClick={() => handleAddObject("blinds", "#f1f5f9")}
                              className="py-1 bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold text-[9px] rounded cursor-pointer transition-colors"
                            >
                              Add Blinds
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Window Safety Grills?</span>
                        <input
                          type="checkbox"
                          checked={hasGrills}
                          onChange={(e) => setHasGrills(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-900 text-blue-500 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* Placements */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">📺 TV & Seating Layout</label>
                      <p className="text-[9px] text-slate-400 leading-normal">Add a TV console opposite the sofa to prevent screen glare. Place a center table to anchor the room.</p>
                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          onClick={() => handleAddObject("tv")}
                          className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[9px] rounded cursor-pointer transition-colors"
                        >
                          Add TV + Console
                        </button>
                        <button
                          onClick={() => handleAddObject("coffee_table")}
                          className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[9px] rounded cursor-pointer transition-colors"
                        >
                          Add Center Table
                        </button>
                      </div>
                    </div>

                    {/* Accent plants */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">🌿 Accent & Flower Pots</label>
                      <p className="text-[9px] text-slate-400 leading-relaxed">Place decorative green planter pots in unused corners for fresh organic highlights.</p>
                      <button
                        onClick={() => handleAddObject("flower_pot")}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[9px] rounded cursor-pointer transition-colors"
                      >
                        Place Flower Pot in Corner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === "recommendations" && (
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
                      onClick={() => fetchRecommendations()}
                      disabled={loadingRecommendations}
                      className="px-2.5 py-1.5 bg-blue-650 hover:bg-blue-600 disabled:bg-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider">{item.style} • {item.category}</span>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {/* Action: Add to scene, Add to Cart & Shop link */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAddObject(
                              mapCategoryTo3DType(item.category),
                              mapProductToMaterial(item.name),
                              item.category === "Chair" ? 0.65 : item.category === "Lighting" ? 0.8 : 1.0
                            )}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-650 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            title="Add 3D model to canvas"
                          >
                            <Plus className="w-3.5 h-3.5" /> 3D View
                          </button>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="px-2 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Add to shopping cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Cart
                          </button>
                          {item.product_url && (
                            <a
                              href={item.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                              title="Go to store website"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-blue-450" /> Shop
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
                      <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-slate-400 text-xs">
                        <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                        <p>Upload a photo of furniture</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">We will extract the silhouette and style preset</p>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block font-mono">Or select a preset item:</span>
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
                    <div className="space-y-4">
                      {/* Viewfinder frame */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col justify-center items-center">
                        {imgTo3DFile && (
                          <img src={imgTo3DFile} alt="Target" className="w-full h-full object-cover opacity-60" />
                        )}
                        
                        {imgTo3DStatus === "processing" && (
                          <div className="absolute inset-0 bg-slate-950/50 flex flex-col justify-center items-center text-center p-3 select-none">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-[10px] font-mono text-blue-450 font-bold">RECONSTRUCTING MESH... {imgTo3DProgress}%</p>
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
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[8px] text-slate-400 space-y-0.5">
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

              {/* Property Type & Floor Level Selector */}
              <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Property:</span>
                  <select
                    value={scratchPropertyType}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdatePropertyType(val);
                      if (val === "apartment" || val === "flat") {
                        setActiveFloor(0);
                      }
                    }}
                    className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="independent">🏡 Independent House</option>
                    <option value="apartment">🏢 Apartment / Flat</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Floor Level:</span>
                  {(scratchPropertyType === "apartment" || scratchPropertyType === "flat") ? (
                    <span className="text-xs text-slate-450 bg-slate-950/60 border border-slate-850/40 px-3 py-1.5 rounded font-semibold font-mono">
                      Single Flat Level
                    </span>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-slate-500 font-medium">
                Dimensions: <span className="font-mono text-slate-350 font-bold">{roomWidth.toFixed(1)}m × {roomDepth.toFixed(1)}m</span>
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 relative cursor-pointer select-none"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                <span>Cart ({cart.length})</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-md border border-slate-950">
                    {cart.length}
                  </span>
                )}
              </button>
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
                onUpdateObject={handleUpdateObject}
                backgroundImageUrl={bgImageUrl}
                roomWidth={roomWidth}
                roomDepth={roomDepth}
                activeFloor={activeFloor}
                renderStyle={renderStyle}
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

      {/* 1. Ray-Traced 4K Render Dialog */}
      {showRenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col font-sans text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="font-extrabold text-sm tracking-tight">Cloud Ray-Tracing Render Engine</h3>
              </div>
              <button 
                onClick={() => setShowRenderModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 space-y-5">
              {!isRendering && !renderImage && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convert your 3D design workspace layout into an ultra-high definition photorealistic visual render using cloud path-tracing ray tracing.
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block font-mono">Select Output Quality:</span>
                    <div className="grid grid-cols-3 gap-3">
                      {(["1080p", "2K", "4K"] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => setRenderQuality(q)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            renderQuality === q
                              ? "bg-blue-650/20 border-blue-655 text-blue-400 font-bold shadow-md"
                              : "bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <p className="text-xs">{q === "1080p" ? "Full HD" : q === "2K" ? "Retina 2K" : "Ultra HD 4K"}</p>
                          <span className="text-[9px] opacity-70 block font-mono font-medium mt-0.5">
                            {q === "1080p" ? "1920x1080" : q === "2K" ? "2560x1440" : "3840x2160"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartRayTracedRender}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Generate Ray-Traced Render
                  </button>
                </div>
              )}

              {isRendering && (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-blue-450 font-bold">Path-Tracing Scene: {renderProgress}%</p>
                    <div className="w-full bg-slate-955 rounded-full h-1.5 border border-slate-850 overflow-hidden max-w-xs mx-auto">
                      <div 
                        className="bg-blue-550 h-full transition-all duration-150" 
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Render Logs HUD */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-left font-mono text-[9px] text-slate-400 space-y-1 max-h-24 overflow-y-auto">
                    {renderLogs.map((log, idx) => (
                      <p key={idx}>{log}</p>
                    ))}
                  </div>
                </div>
              )}

              {renderImage && (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={renderImage} alt="Ray-traced render result" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide">
                      ✓ Ray-Traced ({renderQuality})
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setRenderImage(null);
                        setRenderProgress(0);
                      }}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-450 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Render Again
                    </button>
                    <a
                      href={renderImage}
                      download={`render_${renderQuality}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-2 bg-blue-650 hover:bg-blue-650 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download High-Res Render
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. WebXR AR Projection Simulator Dialog */}
      {showARModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col font-sans text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-extrabold text-sm tracking-tight">WebXR Mobile AR Projection Simulator</h3>
              </div>
              <button 
                onClick={() => setShowARModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 space-y-5">
              {!arCameraActive ? (
                <div className="space-y-4 text-center">
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-850 inline-block mx-auto mb-2 text-indigo-400">
                    <Layers className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-200">Simulate AR Projection in Browser</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Visualize how your interior furniture models fit in real physical environments using WebXR spatial anchors.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleEnterARXR}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Enter WebXR AR Simulator
                    </button>
                    
                    <div className="relative py-3 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-850" /></div>
                      <span className="relative bg-slate-900 px-3 text-[9px] uppercase font-bold tracking-widest text-slate-500">Or Scan QR on Mobile</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl inline-block mx-auto border border-slate-800 shadow-lg">
                      <div className="w-24 h-24 bg-slate-900 flex items-center justify-center rounded">
                        <span className="text-[8px] font-mono text-center text-slate-450 p-2 select-none">SCAN QR TO AR PROJECTION</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AR Screen simulation viewport */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600" 
                      alt="AR Camera Feed" 
                      className="w-full h-full object-cover opacity-60" 
                    />

                    {!arSurfaceDetected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40">
                        <div className="w-full h-0.5 bg-blue-550 animate-pulse absolute top-1/2 left-0 shadow-[0_0_8px_#3b82f6]" />
                        <p className="text-[10px] font-mono text-blue-400 font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-blue-900/40">
                          SURFACE DETECTING...
                        </p>
                      </div>
                    )}

                    {arSurfaceDetected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                        <div className="absolute w-48 h-48 border border-green-500/40 rounded-full border-dashed animate-ping duration-1000 transform -rotate-x-60" />
                        <div className="w-32 h-32 border border-green-500/80 rounded-full bg-green-500/10 transform -rotate-x-60" />

                        {arPlaced ? (
                          <div className="absolute -mt-6 flex flex-col items-center text-center">
                            <span className="bg-emerald-500 text-white rounded-full p-1 text-[10px] font-bold shadow-md">✓</span>
                            <span className="bg-slate-950/80 border border-slate-800 text-slate-200 text-[9px] px-2 py-0.5 rounded font-bold capitalize mt-1">
                              Simulated {arTargetObject} Placed
                            </span>
                          </div>
                        ) : (
                          <div className="absolute -mt-6 flex flex-col items-center text-center">
                            <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                            <span className="bg-blue-650 text-white text-[8px] px-2 py-0.5 rounded font-bold mt-1">
                              Tap Place
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-400 space-y-0.5">
                    {arLogs.slice(-2).map((log, idx) => (
                      <p key={idx} className={log.includes("detected") ? "text-green-400" : ""}>{log}</p>
                    ))}
                  </div>

                  {arSurfaceDetected && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setArCameraActive(false);
                          setArSurfaceDetected(false);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Reset
                      </button>

                      {!arPlaced ? (
                        <button
                          onClick={() => {
                            setArPlaced(true);
                            setArLogs((l) => [...l, `Placed virtual 3D ${arTargetObject} model at spatial coordinate [0.0, 0.0, -1.2].`]);
                          }}
                          className="flex-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                        >
                          Place {arTargetObject}
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`AR Screenshot captured & saved to device gallery!`)}
                          className="flex-2 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                        >
                          Capture Snapshot
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Cart Slide-out Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl z-50 flex flex-col p-6 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-bold text-base">Shopping Cart</h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-450 hover:text-white text-xs font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-850 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <ShoppingCart className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-xs">Your cart is empty.</p>
                <p className="text-[10px] text-slate-600 mt-1">Browse product recommendations and click "Cart" to collect items.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex gap-3 items-start relative group">
                  <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-slate-800" />
                  <div className="flex-1 space-y-1">
                    <h4 className="text-slate-200 font-semibold text-xs leading-snug line-clamp-1">{item.name}</h4>
                    <div className="text-[10px] text-slate-500">{item.category} • {item.style}</div>
                    <div className="text-blue-400 font-mono font-bold text-[11px]">{item.price}</div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateCartQuantity(item.id, (item.quantity || 1) - 1)}
                        className="w-5 h-5 bg-slate-850 hover:bg-slate-800 text-white rounded flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-slate-200 text-xs font-mono w-4 text-center">{item.quantity || 1}</span>
                      <button
                        onClick={() => handleUpdateCartQuantity(item.id, (item.quantity || 1) + 1)}
                        className="w-5 h-5 bg-slate-850 hover:bg-slate-800 text-white rounded flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="text-slate-500 hover:text-rose-450 p-1 rounded hover:bg-slate-850 absolute top-2 right-2 cursor-pointer transition-colors"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout / Invoice section */}
          {cart.length > 0 && (
            <div className="border-t border-slate-850 pt-4 mt-4 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">₹{formatNumber(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (18%):</span>
                  <span className="font-mono text-slate-200">₹{formatNumber(calculateGST())}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-900">
                  <span>Estimated Total:</span>
                  <span className="font-mono text-blue-400">₹{formatNumber(calculateTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleGeneratePDFProposal}
                className="w-full py-2.5 bg-blue-650 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-bold border border-blue-500/40 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/10 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Generate PDF Proposal
              </button>
            </div>
          )}
        </div>
      )}
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
