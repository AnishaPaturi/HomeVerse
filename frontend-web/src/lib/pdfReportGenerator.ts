import { jsPDF } from "jspdf";
import { getItemThumbnail } from "./pdfThumbnails";

export interface PaletteColor {
  name: string;
  hex: string;
  role: string;
}

export interface ReportFeaturedItem {
  name: string;
  subtitle: string;
  thumb: string;
  price: number;
  install: number;
}

export interface ReportStyleData {
  name: string;
  slug: string;
  image: string;
  tagline: string;
  description: string;
  bestFor: string;
  budgetTier: string;
  badgeText: string;
  palette: PaletteColor[];
  items: ReportFeaturedItem[];
}

export interface ReportGeneratorOptions {
  roomName?: string;
  roomDimensions?: {
    width?: number;
    length?: number;
    area?: number;
  };
  totalBudget?: number;
  homeType?: string;
  selectedStyle?: string;
  onProgress?: (progress: number, status: string) => void;
}

export const REPORT_STYLES: ReportStyleData[] = [
  {
    name: "Japandi",
    slug: "japandi",
    image: "/styles/japandi.png",
    tagline: "Calm + Natural + Balanced",
    description:
      "Harmonious union of Japanese wabi-sabi minimalism and Scandinavian warmth. Focuses on organic curves, natural light woods, linen textures, and serene uncluttered spaces.",
    bestFor: "natural wood, linen, organic shapes, soft lighting and uncluttered spaces.",
    budgetTier: "Balanced Value Tier",
    badgeText: "Best Balance & Value",
    palette: [
      { name: "Warm Ivory", hex: "#F5F0E8", role: "Primary" },
      { name: "Sand Beige", hex: "#D8C8B0", role: "Secondary" },
      { name: "Sage Green", hex: "#A3A78B", role: "Accent" },
      { name: "Natural Oak", hex: "#A47755", role: "Wood" },
      { name: "Charcoal Brown", hex: "#4A463D", role: "Contrast" },
    ],
    items: [
      {
        name: "Sofa (Linen)",
        subtitle: "Organic Linen & Solid Oak Frame",
        thumb: "/assets/pdf-items/japandi_1_sofa.png",
        price: 45000,
        install: 2000,
      },
      {
        name: "Wooden Coffee Table",
        subtitle: "Solid Natural White Oak",
        thumb: "/assets/pdf-items/japandi_2_table.png",
        price: 18000,
        install: 1000,
      },
      {
        name: "Rattan Pendant Light",
        subtitle: "Handwoven Natural Cane Rattan",
        thumb: "/assets/pdf-items/japandi_3_lamp.png",
        price: 8500,
        install: 800,
      },
      {
        name: "Area Rug (Jute)",
        subtitle: "Natural Braided Jute & Wool Blend",
        thumb: "/assets/pdf-items/japandi_4_rug.png",
        price: 12000,
        install: 500,
      },
      {
        name: "Indoor Plant (Olive)",
        subtitle: "Ceramic Glazed Pot & Olive Tree",
        thumb: "/assets/pdf-items/japandi_5_plant.png",
        price: 5000,
        install: 300,
      },
    ],
  },
  {
    name: "Industrial",
    slug: "industrial",
    image: "/styles/industrial.png",
    tagline: "Raw + Bold + Urban",
    description:
      "Showcases authentic architectural materials like concrete, steel, and exposed brick with a rugged unfinished aesthetic and modern urban sophistication.",
    bestFor: "exposed brick, concrete walls, black steel, distressed leather and reclaimed wood.",
    budgetTier: "Robust Mid-Range Tier",
    badgeText: "Urban Architectural",
    palette: [
      { name: "Concrete", hex: "#D6D2CB", role: "Primary" },
      { name: "Cement Gray", hex: "#8B8580", role: "Secondary" },
      { name: "Charcoal", hex: "#343638", role: "Contrast" },
      { name: "Matte Black", hex: "#17191B", role: "Metal" },
      { name: "Rust", hex: "#A65E36", role: "Accent" },
    ],
    items: [
      {
        name: "Leather Sofa",
        subtitle: "Cognac Top-Grain Distressed Leather",
        thumb: "/assets/pdf-items/industrial_1_sofa.png",
        price: 60000,
        install: 2500,
      },
      {
        name: "Metal Coffee Table",
        subtitle: "Structural Steel & Reclaimed Teak",
        thumb: "/assets/pdf-items/industrial_2_table.png",
        price: 20000,
        install: 1000,
      },
      {
        name: "Industrial Pendant Light",
        subtitle: "Matte Black Iron Cage & Edison Fixture",
        thumb: "/assets/pdf-items/industrial_3_lamp.png",
        price: 7500,
        install: 800,
      },
      {
        name: "Exposed Brick Wall Panel",
        subtitle: "Textured Architectural Brick Veneer",
        thumb: "/assets/pdf-items/industrial_4_panel.png",
        price: 15000,
        install: 2000,
      },
      {
        name: "Metal Bookshelf",
        subtitle: "Welded Tubular Steel & Dark Walnut",
        thumb: "/assets/pdf-items/industrial_5_shelf.png",
        price: 18000,
        install: 1500,
      },
    ],
  },
  {
    name: "Minimalist",
    slug: "minimalist",
    image: "/styles/minimalist.png",
    tagline: "Clean + Simple + Uncluttered",
    description:
      "Focuses on clean geometric discipline, open space, and a refined neutral palette with essential functional pieces that maximize light and tranquility.",
    bestFor: "clean geometry, open space, hidden storage and minimal decoration.",
    budgetTier: "Essential Forms Tier",
    badgeText: "Most Budget-Friendly",
    palette: [
      { name: "Pure White", hex: "#FFFFFF", role: "Primary" },
      { name: "Off White", hex: "#F2F2F0", role: "Secondary" },
      { name: "Light Gray", hex: "#D9D9D6", role: "Accent" },
      { name: "Stone Gray", hex: "#999995", role: "Neutral" },
      { name: "Soft Black", hex: "#252525", role: "Contrast" },
    ],
    items: [
      {
        name: "Minimal Sofa",
        subtitle: "Low-Profile Neutral Textured Weave",
        thumb: "/assets/pdf-items/minimalist_1_sofa.png",
        price: 48000,
        install: 2000,
      },
      {
        name: "Round Coffee Table",
        subtitle: "Monolithic Cast Stone Surface",
        thumb: "/assets/pdf-items/minimalist_2_table.png",
        price: 16000,
        install: 800,
      },
      {
        name: "Floor Lamp",
        subtitle: "Slim Architectural Linear LED Stem",
        thumb: "/assets/pdf-items/minimalist_3_lamp.png",
        price: 6500,
        install: 500,
      },
      {
        name: "Neutral Rug",
        subtitle: "Short-Pile Organic Wool Blend",
        thumb: "/assets/pdf-items/minimalist_4_rug.png",
        price: 10000,
        install: 500,
      },
      {
        name: "Wall Art (Abstract)",
        subtitle: "Monochrome Canvas Framed Float",
        thumb: "/assets/pdf-items/minimalist_5_art.png",
        price: 4000,
        install: 300,
      },
    ],
  },
  {
    name: "Modern Luxury",
    slug: "luxury",
    image: "/styles/Modern Luxury.png",
    tagline: "Elegant + Rich + Sophisticated",
    description:
      "Combines high-end materials, opulent Italian marble surfaces, plush velvet upholstery, fluted dark walnut, and brushed gold fixtures for a timeless opulent interior.",
    bestFor: "marble, velvet, metallic finishes, statement lighting and premium furniture.",
    budgetTier: "Premium Luxury Tier",
    badgeText: "Premium Luxury Tier",
    palette: [
      { name: "Champagne", hex: "#F1E7D6", role: "Primary" },
      { name: "Gold", hex: "#C6A875", role: "Accent" },
      { name: "Walnut", hex: "#75513F", role: "Secondary" },
      { name: "Deep Green", hex: "#263D35", role: "Rich Accent" },
      { name: "Onyx", hex: "#242326", role: "Contrast" },
    ],
    items: [
      {
        name: "Velvet Sofa",
        subtitle: "Deep Emerald Channel-Tufted Velvet",
        thumb: "/assets/pdf-items/luxury_1_sofa.png",
        price: 120000,
        install: 3000,
      },
      {
        name: "Marble Coffee Table",
        subtitle: "Calacatta Gold Marble & Brass Plinth",
        thumb: "/assets/pdf-items/luxury_2_table.png",
        price: 45000,
        install: 2000,
      },
      {
        name: "Designer Chandelier",
        subtitle: "Brushed Champagne Brass Crystal Tier",
        thumb: "/assets/pdf-items/luxury_3_chandelier.png",
        price: 35000,
        install: 2500,
      },
      {
        name: "Accent Chair",
        subtitle: "Fluted Silk Velvet & Polished Brass",
        thumb: "/assets/pdf-items/luxury_4_chair.png",
        price: 28000,
        install: 1500,
      },
      {
        name: "Console & Decor",
        subtitle: "Dark Fluted Walnut & Gold Hardware",
        thumb: "/assets/pdf-items/luxury_5_console.png",
        price: 40000,
        install: 2000,
      },
    ],
  },
  {
    name: "Contemporary",
    slug: "contemporary",
    image: "/styles/contemporary.png",
    tagline: "Current + Refined + Versatile",
    description:
      "A dynamic, ever-evolving aesthetic blending sculptural curves, layered textures, roman travertine, slate blue accents, and versatile modern silhouettes.",
    bestFor: "mixed materials, curved furniture, artistic lighting, layered textures and balanced neutral tones.",
    budgetTier: "Turnkey Flexible Tier",
    badgeText: "Modern Versatility",
    palette: [
      { name: "Soft Cream", hex: "#F4F1EB", role: "Primary" },
      { name: "Greige", hex: "#C7BDB0", role: "Secondary" },
      { name: "Taupe", hex: "#8C8278", role: "Neutral" },
      { name: "Slate Blue", hex: "#75858B", role: "Accent" },
      { name: "Graphite", hex: "#303234", role: "Contrast" },
    ],
    items: [
      {
        name: "Sectional Sofa",
        subtitle: "Modular Performance Textured Chenille",
        thumb: "/assets/pdf-items/contemporary_1_sofa.png",
        price: 75000,
        install: 2500,
      },
      {
        name: "Coffee Table",
        subtitle: "Honed Roman Travertine & Smoked Glass",
        thumb: "/assets/pdf-items/contemporary_2_table.png",
        price: 22000,
        install: 1000,
      },
      {
        name: "Accent Chair",
        subtitle: "Sculptural Bouclé Swivel Silhouette",
        thumb: "/assets/pdf-items/contemporary_3_chair.png",
        price: 18000,
        install: 1000,
      },
      {
        name: "Area Rug",
        subtitle: "High-Low Textured Architectural Wool",
        thumb: "/assets/pdf-items/contemporary_4_rug.png",
        price: 14000,
        install: 800,
      },
      {
        name: "Wall Art & Decor",
        subtitle: "Curated Contemporary Canvas & Sculpture",
        thumb: "/assets/pdf-items/contemporary_5_art.png",
        price: 8000,
        install: 500,
      },
    ],
  },
  {
    name: "Modern Scandinavian",
    slug: "scandinavian",
    image: "/styles/Modern Scandinavian.png",
    tagline: "Bright + Cozy + Airy",
    description:
      "Combines functional craftsmanship, light blonde woods, cozy woven textiles, and airy daylighting to create warm, inviting, and practical spaces.",
    bestFor: "light wood, natural daylight, cozy textiles, functional furniture and subtle pastel accents.",
    budgetTier: "Cost-Effective Tier",
    badgeText: "Cozy & Functional",
    palette: [
      { name: "Snow White", hex: "#FAF9F6", role: "Primary" },
      { name: "Oat Beige", hex: "#E8DDCA", role: "Secondary" },
      { name: "Light Oak", hex: "#D6C9B5", role: "Wood" },
      { name: "Soft Sage", hex: "#B8CBBE", role: "Accent" },
      { name: "Powder Blue", hex: "#91AFC1", role: "Secondary Accent" },
    ],
    items: [
      {
        name: "Fabric Sofa",
        subtitle: "Breathable Oatmeal Cotton-Linen Weave",
        thumb: "/assets/pdf-items/scandinavian_1_sofa.png",
        price: 55000,
        install: 2000,
      },
      {
        name: "Wooden Coffee Table",
        subtitle: "Solid Blonde Nordic Ash & Birch",
        thumb: "/assets/pdf-items/scandinavian_2_table.png",
        price: 18000,
        install: 800,
      },
      {
        name: "Pendant Light",
        subtitle: "Matte White Spun Aluminum Dome",
        thumb: "/assets/pdf-items/scandinavian_3_lamp.png",
        price: 8000,
        install: 800,
      },
      {
        name: "Woven Rug",
        subtitle: "Flatweave Wool & Cotton Geometric",
        thumb: "/assets/pdf-items/scandinavian_4_rug.png",
        price: 12000,
        install: 500,
      },
      {
        name: "Indoor Plant",
        subtitle: "Fiddle Leaf Fig in Terracotta Planter",
        thumb: "/assets/pdf-items/scandinavian_5_plant.png",
        price: 4000,
        install: 300,
      },
    ],
  },
];

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function formatINR(val: number): string {
  return "Rs. " + Number(val).toLocaleString("en-IN");
}

/**
 * Loads a hero style image URL using fetch-to-blob to bypass CORS and canvas tainting issues,
 * then returns a base64 Data URL.
 */
async function loadStyleImageDataUrl(url: string, maxWidth = 900, quality = 0.85): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch(encodeURI(url));
    if (!res.ok) return null;
    const blob = await res.blob();

    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch {
          URL.revokeObjectURL(objectUrl);
          // Fallback to direct blob reading
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch (err) {
    console.warn("Could not load style hero image via fetch:", url, err);
    return null;
  }
}

/**
 * Generates an 8-page turnkey interior design PDF report with custom spatial dimensions,
 * 6 style pages, colour palettes, itemized materials, installation costs, and comparison matrix.
 */
export async function generateInteriorDesignReport(options: ReportGeneratorOptions = {}): Promise<void> {
  const {
    roomName = "Drawing Room",
    roomDimensions = { width: 4.5, length: 5.0, area: 22.5 },
    totalBudget = 1500000,
    homeType = "Residential Apartment",
    selectedStyle = "Japandi",
    onProgress,
  } = options;

  onProgress?.(5, "Pre-loading catalog visual assets...");

  // Load the 6 hero style images asynchronously
  const heroImageCache: Record<string, string | null> = {};
  const heroPromises = REPORT_STYLES.map((st) =>
    loadStyleImageDataUrl(st.image, 900, 0.85).then((res) => {
      heroImageCache[st.image] = res;
    })
  );

  try {
    await Promise.race([
      Promise.all(heroPromises),
      new Promise((res) => setTimeout(res, 3500)), // 3.5s timeout fallback
    ]);
  } catch {
    // Continue even if some hero images fail
  }

  onProgress?.(25, "Initializing architectural report engine...");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const totalPages = 8;
  const reportDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cleanRoomName = (roomName || "Drawing Room").replace(/[^a-zA-Z0-9_-]/g, "_");

  function drawHeader(pageNum: number, styleName: string | null) {
    // Top border bar
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, pageWidth, 3, "F");

    // Header HomeVerse logo & tracker
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39); // Gray 900
    doc.text("HomeVerse", margin, margin);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128); // Gray 500
    doc.text("AI SPATIAL ARCHITECTURE & INTERIOR ESTIMATION", margin + 28, margin - 0.5);

    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(
      styleName ? `${styleName.toUpperCase()} STYLE GUIDE` : "PROJECT REPORT",
      pageWidth - margin,
      margin,
      { align: "right" }
    );

    doc.setDrawColor(229, 231, 235); // Gray 200
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 3.5, pageWidth - margin, margin + 3.5);
  }

  function drawFooter(pageNum: number, styleName: string | null) {
    const footY = pageHeight - 10;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, footY - 3, pageWidth - margin, footY - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175); // Gray 400
    doc.text(
      styleName ? `HomeVerse | ${styleName} Style Guide` : "HomeVerse Interior Architecture Platform",
      margin,
      footY + 1
    );

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text("CONFIDENTIAL | PREPARED FOR HOME ESTIMATION", pageWidth / 2, footY + 1, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footY + 1, { align: "right" });
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  onProgress?.(30, "Compiling Cover Page...");
  drawHeader(1, null);

  // Big Banner Card
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(margin, 24, contentWidth, 75, 4, 4, "F");

  // Emerald accent strip
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, 24, contentWidth, 3, 2, 2, "F");

  // Badge
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(margin + 8, 33, 50, 6, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text("INTERIOR SPECIFICATION REPORT", margin + 11, 37.2);

  // Main Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("6-STYLE INTERIOR CATALOGUE", margin + 8, 48);

  doc.setFontSize(13);
  doc.setTextColor(209, 213, 219); // Gray 300
  doc.text("& Turnkey Installation Cost Estimation", margin + 8, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  const coverIntro =
    "Dynamic architectural analysis combining spatial dimensions, curated 5-element furniture ensembles, authentic material swatches, and certified contractor labour estimates.";
  doc.text(doc.splitTextToSize(coverIntro, contentWidth - 16), margin + 8, 63);

  // Metadata ribbon inside banner
  const ribbonY = 78;
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin + 8, ribbonY, contentWidth - 16, 15, 2, 2, "F");

  const metaItems = [
    { label: "ROOM FOCUS", val: roomName },
    {
      label: "DIMENSIONS",
      val: `${roomDimensions.width || 4.5}m x ${roomDimensions.length || 5.0}m (${roomDimensions.area || 22.5} sq.m)`,
    },
    { label: "TARGET BUDGET", val: formatINR(totalBudget) },
    { label: "REPORT DATE", val: reportDate },
  ];

  const colW = (contentWidth - 16) / 4;
  metaItems.forEach((m, i) => {
    const x = margin + 8 + i * colW + 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(m.label, x, ribbonY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(248, 250, 252);
    doc.text(m.val, x, ribbonY + 11);
  });

  // Table of Contents Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Catalogue Structure & Table of Contents", margin, 107);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, 109.5, margin + 35, 109.5);

  const tocItems = [
    {
      p: "Page 2",
      title: "Japandi Style Guide",
      desc: "Calm + Natural + Balanced | Japanese minimalism with Nordic warmth",
      cost: "Rs. 93,100",
    },
    {
      p: "Page 3",
      title: "Industrial Style Guide",
      desc: "Raw + Bold + Urban | Concrete, steel framing, distressed leather & brick",
      cost: "Rs. 1,28,300",
    },
    {
      p: "Page 4",
      title: "Minimalist Style Guide",
      desc: "Clean + Simple + Uncluttered | Essential geometries & pure neutral discipline",
      cost: "Rs. 88,600",
    },
    {
      p: "Page 5",
      title: "Modern Luxury Style Guide",
      desc: "Elegant + Rich + Sophisticated | Italian marble, velvet & brushed gold brass",
      cost: "Rs. 2,79,000",
    },
    {
      p: "Page 6",
      title: "Contemporary Style Guide",
      desc: "Current + Refined + Versatile | Curved silhouettes, travertine & slate blue",
      cost: "Rs. 1,42,800",
    },
    {
      p: "Page 7",
      title: "Modern Scandinavian Style Guide",
      desc: "Bright + Cozy + Airy | Light blonde woods, cozy textiles & functional craft",
      cost: "Rs. 1,01,400",
    },
    {
      p: "Page 8",
      title: "Overall Cost Comparison Matrix",
      desc: "Comprehensive financial comparison, budget alignment & contractor notes",
      cost: "All 6 Styles",
    },
  ];

  let tocY = 115;
  tocItems.forEach((t, i) => {
    doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, tocY, contentWidth, 12.5, 2, 2, "FD");

    // Page number pill
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin + 3, tocY + 2.5, 16, 7.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text(t.p, margin + 11, tocY + 7.2, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(t.title, margin + 22, tocY + 5.5);

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(t.desc, margin + 22, tocY + 9.8);

    // Est Cost Pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(t.cost, margin + contentWidth - 4, tocY + 7.5, { align: "right" });

    tocY += 14.5;
  });

  // Callout at bottom of cover page
  const noteY = 232;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, noteY, contentWidth, 38, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text("Key Highlights of this Estimation Report", margin + 6, noteY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  const bulletLines = [
    "- Tailored Room Estimation: Based on your selected room and dimensions, providing precise spatial itemization.",
    "- Turnkey Labour Breakdown: Material costs and contractor installation charges are separated for transparent budgeting.",
    "- Curated Colour DNA: Exact Hex color palettes specified for wall coatings, cabinetry, and secondary accents.",
    "- Comparative ROI: Page 8 provides a side-by-side comparative table ranking styles from most budget-friendly to luxury.",
  ];
  bulletLines.forEach((b, bi) => {
    doc.text(b, margin + 6, noteY + 14 + bi * 5.5);
  });

  drawFooter(1, null);

  // ==========================================
  // PAGES 2 to 7: THE 6 STYLES
  // ==========================================
  REPORT_STYLES.forEach((st, idx) => {
    const pageNum = idx + 2;
    onProgress?.(35 + idx * 8, `Rendering Style ${idx + 1}/6: ${st.name}...`);

    doc.addPage();
    drawHeader(pageNum, st.name);

    // Top Header & Reference Image Grid
    const topY = 20;
    const leftW = 106;
    const rightX = margin + leftW + 6;
    const rightW = contentWidth - leftW - 6; // 70mm

    // Style Badge
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, topY, 34, 5.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text(`STYLE 0${idx + 1} | ${st.budgetTier.toUpperCase()}`, margin + 2, topY + 3.8);

    // Style Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text(st.name, margin, topY + 14);

    // Tagline
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9.5);
    doc.setTextColor(5, 150, 105);
    doc.text(st.tagline, margin, topY + 19.5);

    // Description paragraph
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(st.description, leftW);
    doc.text(descLines, margin, topY + 25);

    // Best For summary box
    const bestForY = topY + 37;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, bestForY, leftW, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text("AESTHETIC SIGNATURE & MATERIALS:", margin + 3, bestForY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const bestForLines = doc.splitTextToSize(st.bestFor, leftW - 6);
    doc.text(bestForLines, margin + 3, bestForY + 8.5);

    // Reference Interior Image on Right Side
    const heroImgData = heroImageCache[st.image];
    if (heroImgData) {
      try {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(rightX, topY, rightW, 51, 3, 3, "F");
        doc.addImage(heroImgData, "JPEG", rightX + 0.5, topY + 0.5, rightW - 1, 50, undefined, "FAST");
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.roundedRect(rightX, topY, rightW, 51, 3, 3, "D");
      } catch (e) {
        console.error("Failed to render style image:", st.name, e);
      }
    } else {
      // Fallback placeholder card
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(rightX, topY, rightW, 51, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${st.name} Interior Reference`, rightX + rightW / 2, topY + 26, { align: "center" });
    }

    // ------------------------------------------
    // SECTION 1: STYLE OVERVIEW & COLOUR PALETTE
    // Fixed layout: Title and descriptive subtitle on separate lines to prevent text overlap!
    // ------------------------------------------
    const sec1Y = topY + 54; // = 74mm
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("1. Style Overview & Architectural Colour DNA", margin, sec1Y);

    // Subtitle placed cleanly on its OWN distinct line!
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Harmonized 5-shade palette formulated for wall textures, cabinetry, trim, and textiles",
      margin,
      sec1Y + 4.2
    );

    // Green accent underline beneath subtitle
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, sec1Y + 6.2, margin + 32, sec1Y + 6.2);

    // 5 Palette Swatches
    const swatchRowY = sec1Y + 9.5; // = 83.5mm
    const swatchW = (contentWidth - 16) / 5; // ~33.2mm

    st.palette.forEach((c, ci) => {
      const sx = margin + ci * (swatchW + 4);
      const rgb = hexToRgb(c.hex);

      // Swatch color pill
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.roundedRect(sx, swatchRowY, swatchW, 10, 2, 2, "F");

      // Swatch outline
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.roundedRect(sx, swatchRowY, swatchW, 10, 2, 2, "D");

      // Color Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(17, 24, 39);
      doc.text(c.name, sx + 1, swatchRowY + 14.2);

      // Hex code & Role
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`${c.hex} | ${c.role}`, sx + 1, swatchRowY + 17.5);
    });

    // ------------------------------------------
    // SECTION 2: FEATURED ITEMS & INSTALLATION TABLE
    // Fixed layout: Title and descriptive subtitle on separate lines!
    // ------------------------------------------
    const sec2Y = swatchRowY + 23; // = 106.5mm
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("2. Featured Items & Installation Cost Matrix", margin, sec2Y);

    // Subtitle placed cleanly on its OWN distinct line!
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Curated 5-element furniture ensemble, lighting, flooring, and certified contractor labour",
      margin,
      sec2Y + 4.2
    );

    // Green accent underline beneath subtitle
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, sec2Y + 6.2, margin + 32, sec2Y + 6.2);

    // Table Header
    const thY = sec2Y + 9; // = 115.5mm
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.rect(margin, thY, contentWidth, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text("Featured Item / Material Ensembles", margin + 3, thY + 4.8);
    doc.text("Preview", margin + 85, thY + 4.8, { align: "center" });
    doc.text("Item Price (INR)", margin + 130, thY + 4.8, { align: "right" });
    doc.text("Installation Cost (INR)", margin + contentWidth - 4, thY + 4.8, { align: "right" });

    // 5 Rows (pitch = 13mm)
    let rowY = thY + 7; // = 122.5mm
    const rowH = 13;
    let sumItems = 0;
    let sumInstall = 0;

    st.items.forEach((item, ii) => {
      sumItems += item.price;
      sumInstall += item.install;

      doc.setFillColor(
        ii % 2 === 0 ? 255 : 249,
        ii % 2 === 0 ? 255 : 250,
        ii % 2 === 0 ? 255 : 251
      );
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.rect(margin, rowY, contentWidth, rowH, "FD");

      // Item Name & Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(item.name, margin + 3, rowY + 5.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(107, 114, 128);
      doc.text(item.subtitle, margin + 3, rowY + 9.5);

      // Embedded Item Thumbnail Image (100% reliable pre-encoded PNG base64)
      const thumbData = getItemThumbnail(item.thumb, st.slug, ii);
      if (thumbData) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin + 77.5, rowY + 1.2, 15, 10.5, 1.5, 1.5, "F");
          doc.addImage(thumbData, "PNG", margin + 78, rowY + 1.5, 14, 10, undefined, "FAST");
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin + 77.5, rowY + 1.2, 15, 10.5, 1.5, 1.5, "D");
        } catch (e) {
          console.error("Error adding thumbnail to PDF:", item.name, e);
        }
      } else {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + 77.5, rowY + 1.2, 15, 10.5, 1.5, 1.5, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(156, 163, 175);
        doc.text("Item", margin + 85, rowY + 7, { align: "center" });
      }

      // Price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(formatINR(item.price), margin + 130, rowY + 7.5, { align: "right" });

      // Installation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(formatINR(item.install), margin + contentWidth - 4, rowY + 7.5, { align: "right" });

      rowY += rowH;
    });

    // Total Cost Summary Box
    const totalY = rowY + 3; // = 190.5mm
    const grandTotal = sumItems + sumInstall;

    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, totalY, contentWidth, 18, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text("Estimated Total Investment", margin + 4, totalY + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(
      "Combined 5-piece bespoke material cost + certified turnkey installation charges",
      margin + 4,
      totalY + 12
    );

    // Summary numbers on the right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Materials: ${formatINR(sumItems)}  |  Labour: ${formatINR(sumInstall)}`,
      margin + contentWidth - 4,
      totalY + 6.2,
      { align: "right" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(4, 120, 87);
    doc.text(`Total: ${formatINR(grandTotal)}`, margin + contentWidth - 4, totalY + 13.5, {
      align: "right",
    });

    // Dynamic Room Context Adaptation Box
    const adaptY = totalY + 21; // = 211.5mm
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, adaptY, contentWidth, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Room Customization for: ${roomName} (${roomDimensions.width || 4.5}m x ${roomDimensions.length || 5.0}m | ${roomDimensions.area || 22.5} sq.m)`,
      margin + 4,
      adaptY + 5.5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const roomBudgetRef = Math.max(1, totalBudget / 8);
    const budgetPct = ((grandTotal / roomBudgetRef) * 100).toFixed(1);
    doc.text(
      `Estimated budget envelope fit: Represents approx. ${budgetPct}% of standard single-room allocation.`,
      margin + 4,
      adaptY + 10.5
    );
    doc.text(
      "Materials curated for this layout: Includes spatial clearances, proper traffic circulation, and recommended lumens.",
      margin + 4,
      adaptY + 15
    );

    drawFooter(pageNum, st.name);
  });

  // ==========================================
  // PAGE 8: OVERALL COST COMPARISON MATRIX
  // ==========================================
  onProgress?.(85, "Compiling Comparison Matrix & Budget Insights...");
  doc.addPage();
  drawHeader(8, "Comparison Matrix");

  const p8TopY = 22;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Overall Cost Comparison & Budget Optimization", margin, p8TopY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Side-by-side financial comparison of all six interior design aesthetics calibrated for your space.",
    margin,
    p8TopY + 8
  );

  // Big Comparison Table
  const cthY = p8TopY + 13;
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, cthY, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Design Aesthetic", margin + 3, cthY + 5.5);
  doc.text("Style Tier", margin + 40, cthY + 5.5);
  doc.text("Material Cost", margin + 85, cthY + 5.5, { align: "right" });
  doc.text("Labour / Install", margin + 118, cthY + 5.5, { align: "right" });
  doc.text("Total Investment", margin + 152, cthY + 5.5, { align: "right" });
  doc.text("Recommendation", margin + contentWidth - 3, cthY + 5.5, { align: "right" });

  let cRowY = cthY + 8;
  const cRowH = 13.5;

  let grandSumMaterials = 0;
  let grandSumInstall = 0;
  let minTotal = Infinity;
  let minStyle = "";

  REPORT_STYLES.forEach((st, idx) => {
    const matSum = st.items.reduce((acc, it) => acc + it.price, 0);
    const insSum = st.items.reduce((acc, it) => acc + it.install, 0);
    const tot = matSum + insSum;
    grandSumMaterials += matSum;
    grandSumInstall += insSum;

    if (tot < minTotal) {
      minTotal = tot;
      minStyle = st.name;
    }

    const isSelected =
      st.name.toLowerCase() === selectedStyle.toLowerCase() ||
      (selectedStyle.toLowerCase().includes("scandinavian") && st.slug === "scandinavian") ||
      (selectedStyle.toLowerCase().includes("luxury") && st.slug === "luxury");

    doc.setFillColor(
      isSelected ? 236 : idx % 2 === 0 ? 255 : 248,
      isSelected ? 253 : idx % 2 === 0 ? 255 : 250,
      isSelected ? 245 : idx % 2 === 0 ? 255 : 252
    );
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.rect(margin, cRowY, contentWidth, cRowH, "FD");

    // Style Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(st.name, margin + 3, cRowY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(107, 114, 128);
    doc.text(st.tagline, margin + 3, cRowY + 9.5);

    // Tier
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(st.budgetTier.replace(" Tier", ""), margin + 40, cRowY + 7.5);

    // Material Cost
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(formatINR(matSum), margin + 85, cRowY + 7.5, { align: "right" });

    // Labour / Install
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text(formatINR(insSum), margin + 118, cRowY + 7.5, { align: "right" });

    // Total Investment
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatINR(tot), margin + 152, cRowY + 7.5, { align: "right" });

    // Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(
      tot === 88600 ? 5 : tot > 200000 ? 180 : 31,
      tot === 88600 ? 150 : tot > 200000 ? 83 : 41,
      tot === 88600 ? 105 : tot > 200000 ? 9 : 55
    );
    doc.text(st.badgeText, margin + contentWidth - 3, cRowY + 7.5, { align: "right" });

    cRowY += cRowH;
  });

  // KPI Summary Metric Cards (3 Cards)
  const kpiY = cRowY + 6;
  const kpiW = (contentWidth - 8) / 3;

  const kpis = [
    {
      title: "MOST BUDGET-FRIENDLY",
      val: minStyle,
      sub: `${formatINR(minTotal)} complete turnkey`,
      color: [16, 185, 129],
    },
    {
      title: "AVERAGE STYLE COST",
      val: formatINR(Math.round((grandSumMaterials + grandSumInstall) / 6)),
      sub: "Balanced median benchmark",
      color: [59, 130, 246],
    },
    {
      title: "LABOUR COST RANGE",
      val: "Rs. 4,100 - 11,000",
      sub: "Certified installer warranty",
      color: [139, 92, 246],
    },
  ];

  kpis.forEach((k, ki) => {
    const kx = margin + ki * (kpiW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(kx, kpiY, kpiW, 20, 2, 2, "FD");

    // Colored accent pill
    doc.setFillColor(k.color[0], k.color[1], k.color[2]);
    doc.roundedRect(kx + 3, kpiY + 3, 2, 14, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, kx + 8, kpiY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, kx + 8, kpiY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(k.sub, kx + 8, kpiY + 17);
  });

  // Decision Guidance Callout
  const guideY = kpiY + 26;
  doc.setFillColor(254, 252, 232); // Amber 50
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, guideY, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("HomeVerse Budget & Style Strategy Recommendation", margin + 4, guideY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(120, 53, 15);
  doc.text(
    "- For Budget-Conscious Turnkey Execution: Minimalist (Rs. 88,600) and Japandi (Rs. 93,100) provide exceptional ROI without sacrificing design elegance.",
    margin + 4,
    guideY + 11
  );
  doc.text(
    "- For Contemporary Warmth: Modern Scandinavian (Rs. 1,01,400) pairs natural daylight with light ash wood and cozy functional craftsmanship.",
    margin + 4,
    guideY + 16
  );
  doc.text(
    "- For Statement Luxury Living: Modern Luxury (Rs. 2,79,000) integrates imported Italian Calacatta marble, fluted walnut millwork, and opulent crystal lighting.",
    margin + 4,
    guideY + 21
  );

  // Official Disclaimer
  const discY = guideY + 28;
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, discY, contentWidth, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text("IMPORTANT ESTIMATION DISCLAIMER & NOTES", margin + 4, discY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  const discText =
    "All pricing figures, item rates, material specifications, and installation charges shown in this document are estimates based on standard Tier-1 supplier benchmarks and prevailing turnkey contractor rates in India. Final quotes may vary depending on geographic location, site accessibility, architectural customization, material grade choices, and applicable GST taxes. HomeVerse strongly recommends a physical site survey by an accredited turnkey engineer before finalizing procurement contracts.";
  const discLines = doc.splitTextToSize(discText, contentWidth - 8);
  doc.text(discLines, margin + 4, discY + 9);

  drawFooter(8, "Comparison Matrix");

  onProgress?.(100, "Downloading PDF report...");
  doc.save(`HomeVerse_${cleanRoomName}_6Style_Design_Report.pdf`);
}
