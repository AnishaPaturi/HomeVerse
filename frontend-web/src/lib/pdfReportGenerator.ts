import { jsPDF } from "jspdf";

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

export interface PerSqFtBenchmark {
  materialPerSqFt: number;
  installPerSqFt: number;
  totalPerSqFt: number;
  typical1000SqFt: string;
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
  perSqFt: PerSqFtBenchmark;
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
    perSqFt: {
      materialPerSqFt: 1850,
      installPerSqFt: 350,
      totalPerSqFt: 2200,
      typical1000SqFt: "Rs. 22.0 Lakhs",
    },
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
    perSqFt: {
      materialPerSqFt: 2550,
      installPerSqFt: 500,
      totalPerSqFt: 3050,
      typical1000SqFt: "Rs. 30.5 Lakhs",
    },
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
    perSqFt: {
      materialPerSqFt: 1550,
      installPerSqFt: 300,
      totalPerSqFt: 1850,
      typical1000SqFt: "Rs. 18.5 Lakhs",
    },
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
    perSqFt: {
      materialPerSqFt: 4800,
      installPerSqFt: 950,
      totalPerSqFt: 5750,
      typical1000SqFt: "Rs. 57.5 Lakhs",
    },
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
    perSqFt: {
      materialPerSqFt: 3100,
      installPerSqFt: 650,
      totalPerSqFt: 3750,
      typical1000SqFt: "Rs. 37.5 Lakhs",
    },
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
    perSqFt: {
      materialPerSqFt: 2050,
      installPerSqFt: 400,
      totalPerSqFt: 2450,
      typical1000SqFt: "Rs. 24.5 Lakhs",
    },
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
 * Generates an 8-page turnkey interior design PDF report with per-sqft benchmarks,
 * 6 style guides, colour palettes, itemized materials, installation costs, and comparison matrix.
 * Universal home catalogue without room-specific restrictions.
 */
export async function generateInteriorDesignReport(options: ReportGeneratorOptions = {}): Promise<void> {
  const {
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
      new Promise((res) => setTimeout(res, 3500)),
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
      styleName ? `${styleName.toUpperCase()} STYLE GUIDE` : "INTERIOR CATALOGUE",
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
    doc.text("TURNKEY SPECIFICATION & BUDGET BENCHMARK", pageWidth / 2, footY + 1, {
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
  doc.roundedRect(margin + 8, 33, 56, 6, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text("UNIVERSAL STYLE & BUDGET GUIDE", margin + 11, 37.2);

  // Main Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("6-STYLE INTERIOR CATALOGUE", margin + 8, 48);

  doc.setFontSize(13);
  doc.setTextColor(209, 213, 219); // Gray 300
  doc.text("& Turnkey Execution Budget Estimator (Per Sq.Ft)", margin + 8, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  const coverIntro =
    "Comprehensive architectural guide to help homeowners select their ideal interior aesthetic. Features detailed color palettes, signature 5-piece ensembles, and standardized turnkey budget rates per square foot.";
  doc.text(doc.splitTextToSize(coverIntro, contentWidth - 16), margin + 8, 63);

  // Metadata ribbon inside banner (Per-sqft & Universal focus)
  const ribbonY = 78;
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin + 8, ribbonY, contentWidth - 16, 15, 2, 2, "F");

  const metaItems = [
    { label: "CATALOGUE SCOPE", val: "All 6 Design Styles" },
    { label: "PRICING BASIS", val: "Turnkey Rate (Per Sq.Ft)" },
    { label: "ESTIMATION MODEL", val: "Material + Labour Benchmark" },
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
      cost: "Rs. 2,200 / sq.ft",
    },
    {
      p: "Page 3",
      title: "Industrial Style Guide",
      desc: "Raw + Bold + Urban | Concrete, steel framing, distressed leather & brick",
      cost: "Rs. 3,050 / sq.ft",
    },
    {
      p: "Page 4",
      title: "Minimalist Style Guide",
      desc: "Clean + Simple + Uncluttered | Essential geometries & pure neutral discipline",
      cost: "Rs. 1,850 / sq.ft",
    },
    {
      p: "Page 5",
      title: "Modern Luxury Style Guide",
      desc: "Elegant + Rich + Sophisticated | Italian marble, velvet & brushed gold brass",
      cost: "Rs. 5,750 / sq.ft",
    },
    {
      p: "Page 6",
      title: "Contemporary Style Guide",
      desc: "Current + Refined + Versatile | Curved silhouettes, travertine & slate blue",
      cost: "Rs. 3,750 / sq.ft",
    },
    {
      p: "Page 7",
      title: "Modern Scandinavian Style Guide",
      desc: "Bright + Cozy + Airy | Light blonde woods, cozy textiles & functional craft",
      cost: "Rs. 2,450 / sq.ft",
    },
    {
      p: "Page 8",
      title: "Overall Cost Comparison Matrix",
      desc: "Side-by-side per sq.ft financial matrix, budget ranking & execution insights",
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

    // Turnkey Rate Pill
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
  doc.text("How to Use this 6-Style Catalogue", margin + 6, noteY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  const bulletLines = [
    "- Universal Aesthetic Evaluation: Designed for the entire home, allowing you to select an aesthetic theme that unifies all rooms.",
    "- Per-Sq.Ft Turnkey Benchmark: Rates are calibrated per square foot of built-up/carpet area, easily scalable to any home layout.",
    "- Transparent Material & Labour Split: Material procurement costs and certified contractor charges are itemized separately.",
    "- Cross-Style Comparison Matrix: Page 8 provides side-by-side per-sq.ft rate comparisons with standard 1,000 sq.ft home projections.",
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
    // ------------------------------------------
    const sec1Y = topY + 54; // = 74mm
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("1. Style Overview & Architectural Colour DNA", margin, sec1Y);

    // Subtitle placed cleanly on its OWN distinct line
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
    // SECTION 2: FEATURED ITEMS & INSTALLATION TABLE (Clean 3-column layout)
    // ------------------------------------------
    const sec2Y = swatchRowY + 23; // = 106.5mm
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("2. Signature Ensemble Items & Turnkey Pricing", margin, sec2Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Representative 5-element ensemble displaying material grades and professional installation costs",
      margin,
      sec2Y + 4.2
    );

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, sec2Y + 6.2, margin + 32, sec2Y + 6.2);

    // Table Header (Clean 3-column table without preview column)
    const thY = sec2Y + 9; // = 115.5mm
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.rect(margin, thY, contentWidth, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text("Featured Item & Material Specification", margin + 3, thY + 4.8);
    doc.text("Item Price (INR)", margin + 125, thY + 4.8, { align: "right" });
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
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(item.name, margin + 3, rowY + 5.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(item.subtitle, margin + 3, rowY + 9.5);

      // Price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(formatINR(item.price), margin + 125, rowY + 7.5, { align: "right" });

      // Installation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(formatINR(item.install), margin + contentWidth - 4, rowY + 7.5, { align: "right" });

      rowY += rowH;
    });

    // Sample Ensemble Investment Summary Box
    const totalY = rowY + 3; // = 190.5mm
    const grandTotal = sumItems + sumInstall;

    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, totalY, contentWidth, 18, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(6, 78, 59);
    doc.text("Sample 5-Piece Ensemble Total", margin + 4, totalY + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(
      "Combined material acquisition + certified turnkey contractor installation charges",
      margin + 4,
      totalY + 12
    );

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
    doc.text(`Ensemble: ${formatINR(grandTotal)}`, margin + contentWidth - 4, totalY + 13.5, {
      align: "right",
    });

    // ------------------------------------------
    // SECTION 3: TURNKEY EXECUTION BUDGET (PER SQ.FT BENCHMARK)
    // Displayed per sq.ft across the entire home, NOT based on a single room!
    // ------------------------------------------
    const sqftBoxY = totalY + 22; // = 212.5mm
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, sqftBoxY, contentWidth, 36, 3, 3, "FD");

    // Header inside box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text("3. Turnkey Execution Budget (Per Sq.Ft Benchmark)", margin + 4, sqftBoxY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Standardized full-home budget benchmark based on built-up / carpet area for complete turnkey delivery.",
      margin + 4,
      sqftBoxY + 10.5
    );

    // 3 Stat Cards inside the box
    const cardW = (contentWidth - 14) / 3;
    const cardY = sqftBoxY + 14;

    // Stat 1: Material Rate
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 3, cardY, cardW, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("MATERIAL RATE", margin + 6, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Rs. ${st.perSqFt.materialPerSqFt.toLocaleString("en-IN")} / sq.ft`, margin + 6, cardY + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(156, 163, 175);
    doc.text("Cabinetry, finishes & fixtures", margin + 6, cardY + 15);

    // Stat 2: Installation Rate
    const card2X = margin + 3 + cardW + 4;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(card2X, cardY, cardW, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("LABOUR & INSTALLATION", card2X + 3, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${st.perSqFt.installPerSqFt.toLocaleString("en-IN")} / sq.ft`, card2X + 3, cardY + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(156, 163, 175);
    doc.text("Civil, electrical & fitting warranty", card2X + 3, cardY + 15);

    // Stat 3: Total Turnkey Rate
    const card3X = card2X + cardW + 4;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(card3X, cardY, cardW, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text("COMBINED TURNKEY RATE", card3X + 3, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(4, 120, 87);
    doc.text(`Rs. ${st.perSqFt.totalPerSqFt.toLocaleString("en-IN")} / sq.ft`, card3X + 3, cardY + 11);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`Est. 1,000 sq.ft: ${st.perSqFt.typical1000SqFt}`, card3X + 3, cardY + 15);

    drawFooter(pageNum, st.name);
  });

  // ==========================================
  // PAGE 8: OVERALL COST COMPARISON MATRIX (PER SQ.FT BASIS)
  // ==========================================
  onProgress?.(85, "Compiling Comparison Matrix & Budget Insights...");
  doc.addPage();
  drawHeader(8, "Comparison Matrix");

  const p8TopY = 22;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Overall Turnkey Cost Comparison & Budget Matrix", margin, p8TopY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Side-by-side financial comparison of all six interior design aesthetics benchmarked per square foot.",
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
  doc.text("Style Tier", margin + 36, cthY + 5.5);
  doc.text("Material / sq.ft", margin + 78, cthY + 5.5, { align: "right" });
  doc.text("Labour / sq.ft", margin + 108, cthY + 5.5, { align: "right" });
  doc.text("Turnkey Rate (sq.ft)", margin + 144, cthY + 5.5, { align: "right" });
  doc.text("1,000 sq.ft Projection", margin + contentWidth - 3, cthY + 5.5, { align: "right" });

  let cRowY = cthY + 8;
  const cRowH = 13.5;

  let grandSumSqFt = 0;
  let minSqFt = Infinity;
  let minStyle = "";

  REPORT_STYLES.forEach((st, idx) => {
    const rate = st.perSqFt.totalPerSqFt;
    grandSumSqFt += rate;

    if (rate < minSqFt) {
      minSqFt = rate;
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

    // Style Name & Tagline
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
    doc.text(st.budgetTier.replace(" Tier", ""), margin + 36, cRowY + 7.5);

    // Material / sq.ft
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text(`Rs. ${st.perSqFt.materialPerSqFt.toLocaleString("en-IN")}`, margin + 78, cRowY + 7.5, {
      align: "right",
    });

    // Labour / sq.ft
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${st.perSqFt.installPerSqFt.toLocaleString("en-IN")}`, margin + 108, cRowY + 7.5, {
      align: "right",
    });

    // Combined Turnkey Rate / sq.ft
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${rate.toLocaleString("en-IN")} / sq.ft`, margin + 144, cRowY + 7.5, {
      align: "right",
    });

    // Typical 1,000 sq.ft Projection
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(
      rate === 1850 ? 5 : rate > 4000 ? 180 : 4,
      rate === 1850 ? 150 : rate > 4000 ? 83 : 120,
      rate === 1850 ? 105 : rate > 4000 ? 9 : 87
    );
    doc.text(
      rate === 1850
        ? `${st.perSqFt.typical1000SqFt} (Best Budget)`
        : st.perSqFt.typical1000SqFt,
      margin + contentWidth - 3,
      cRowY + 7.5,
      { align: "right" }
    );

    cRowY += cRowH;
  });

  // KPI Summary Metric Cards (3 Cards)
  const kpiY = cRowY + 6;
  const kpiW = (contentWidth - 8) / 3;

  const kpis = [
    {
      title: "MOST BUDGET-FRIENDLY",
      val: `Rs. ${minSqFt.toLocaleString("en-IN")} / sq.ft`,
      sub: `${minStyle} · 1,000 sq.ft: Rs. 18.5 L`,
      color: [16, 185, 129],
    },
    {
      title: "AVERAGE TURNKEY RATE",
      val: `Rs. ${Math.round(grandSumSqFt / 6).toLocaleString("en-IN")} / sq.ft`,
      sub: "Across all 6 architectural styles",
      color: [59, 130, 246],
    },
    {
      title: "TURNKEY RATE RANGE",
      val: "Rs. 1,850 - 5,750 / sq.ft",
      sub: "Essential to Premium Luxury",
      color: [139, 92, 246],
    },
  ];

  kpis.forEach((k, ki) => {
    const kx = margin + ki * (kpiW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(kx, kpiY, kpiW, 20, 2, 2, "FD");

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
  doc.text("HomeVerse Turnkey Budget & Style Strategy Recommendation", margin + 4, guideY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(120, 53, 15);
  doc.text(
    "- For Budget-Conscious Homes: Minimalist (Rs. 1,850/sq.ft) and Japandi (Rs. 2,200/sq.ft) deliver maximum value, completing a 1,000 sq.ft home for Rs. 18.5L - 22.0L.",
    margin + 4,
    guideY + 11
  );
  doc.text(
    "- For Contemporary Warmth: Modern Scandinavian (Rs. 2,450/sq.ft) and Industrial (Rs. 3,050/sq.ft) pair natural light ash and architectural steel for Rs. 24.5L - 30.5L.",
    margin + 4,
    guideY + 16
  );
  doc.text(
    "- For Statement Luxury Residences: Modern Luxury (Rs. 5,750/sq.ft) and Contemporary (Rs. 3,750/sq.ft) integrate imported Italian Calacatta marble, fluted walnut millwork, and brass.",
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
    "All pricing figures and per-square-foot benchmarks shown in this document are estimates based on standard Tier-1 supplier benchmarks and prevailing turnkey contractor rates in India. Final quotes may vary depending on geographic location, site accessibility, architectural customization, material grade choices, and applicable GST taxes. HomeVerse strongly recommends a physical site survey by an accredited turnkey engineer before finalizing procurement contracts.";
  const discLines = doc.splitTextToSize(discText, contentWidth - 8);
  doc.text(discLines, margin + 4, discY + 9);

  drawFooter(8, "Comparison Matrix");

  onProgress?.(100, "Downloading PDF report...");
  doc.save("HomeVerse_6Style_Interior_Design_Catalogue.pdf");
}
