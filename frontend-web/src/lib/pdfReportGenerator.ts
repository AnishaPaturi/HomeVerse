import { jsPDF } from "jspdf";

export interface PaletteColor {
  name: string;
  hex: string;
  role: string;
}

export interface ReportFeaturedItem {
  name: string;
  subtitle: string;
  price: number;
  install: number;
}

export interface CostRangeSqFt {
  min: number;
  max: number;
}

export interface ReportStyleData {
  name: string;
  slug: string;
  image: string;
  tagline: string;
  description: string;
  tier: string;
  costRangeSqFt: CostRangeSqFt;
  est1000SqFt: string;
  materials: string;
  furniture: string;
  coloursSummary: string;
  advantages: string;
  considerations: string;
  maintenance: string;
  bestForBadge: string;
  palette: PaletteColor[];
  items: ReportFeaturedItem[];
}

export interface ReportGeneratorOptions {
  selectedStyle?: string;
  carpetAreaSqFt?: number;
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
    tier: "Mid-range",
    costRangeSqFt: { min: 1500, max: 2300 },
    est1000SqFt: "Rs. 15 - 23 Lakhs",
    materials: "Natural oak, bamboo, linen, stone, rattan.",
    furniture: "Low-profile sofas, wooden tables, organic-shaped furniture.",
    coloursSummary: "Ivory, sand beige, sage green, natural oak, charcoal brown.",
    advantages: "Timeless, peaceful, natural-looking and uncluttered.",
    considerations: "Quality natural wood and handcrafted furniture can increase costs.",
    maintenance: "Moderate; natural wood and linen need appropriate care.",
    bestForBadge: "Best for natural aesthetics",
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
        price: 45000,
        install: 2000,
      },
      {
        name: "Wooden Coffee Table",
        subtitle: "Solid Natural White Oak",
        price: 18000,
        install: 1000,
      },
      {
        name: "Rattan Pendant Light",
        subtitle: "Handwoven Natural Cane Rattan",
        price: 8500,
        install: 800,
      },
      {
        name: "Area Rug (Jute)",
        subtitle: "Natural Braided Jute & Wool Blend",
        price: 12000,
        install: 500,
      },
      {
        name: "Indoor Plant (Olive)",
        subtitle: "Ceramic Glazed Pot & Olive Tree",
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
    tier: "Mid-range",
    costRangeSqFt: { min: 1600, max: 2600 },
    est1000SqFt: "Rs. 16 - 26 Lakhs",
    materials: "Exposed brick, concrete, steel, reclaimed wood, leather.",
    furniture: "Metal shelving, leather sofas, industrial pendant lights.",
    coloursSummary: "Concrete gray, charcoal, matte black, rust.",
    advantages: "Distinctive appearance, durable materials and bold character.",
    considerations: "Authentic brickwork, steel fabrication and custom finishes can be expensive.",
    maintenance: "Moderate; metal may require rust protection.",
    bestForBadge: "Best for distinctive character",
    palette: [
      { name: "Concrete Gray", hex: "#D6D2CB", role: "Primary" },
      { name: "Cement Gray", hex: "#8B8580", role: "Secondary" },
      { name: "Charcoal", hex: "#343638", role: "Contrast" },
      { name: "Matte Black", hex: "#17191B", role: "Metal" },
      { name: "Rust", hex: "#A65E36", role: "Accent" },
    ],
    items: [
      {
        name: "Leather Sofa",
        subtitle: "Cognac Top-Grain Distressed Leather",
        price: 60000,
        install: 2500,
      },
      {
        name: "Metal Coffee Table",
        subtitle: "Structural Steel & Reclaimed Teak",
        price: 20000,
        install: 1000,
      },
      {
        name: "Industrial Pendant Light",
        subtitle: "Matte Black Iron Cage & Edison Fixture",
        price: 7500,
        install: 800,
      },
      {
        name: "Exposed Brick Wall Panel",
        subtitle: "Textured Architectural Brick Veneer",
        price: 15000,
        install: 2000,
      },
      {
        name: "Metal Bookshelf",
        subtitle: "Welded Tubular Steel & Dark Walnut",
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
    tier: "Budget-friendly",
    costRangeSqFt: { min: 1200, max: 1800 },
    est1000SqFt: "Rs. 12 - 18 Lakhs",
    materials: "Matte laminates, engineered wood, glass, simple stone finishes.",
    furniture: "Functional sofas, concealed storage, simple tables.",
    coloursSummary: "Pure white, off-white, light gray, stone gray, soft black.",
    advantages: "Often economical, easy to organize and visually spacious.",
    considerations: "Requires careful storage planning; premium minimalist furniture can still be expensive.",
    maintenance: "Generally low.",
    bestForBadge: "Best for budget-conscious users",
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
        price: 48000,
        install: 2000,
      },
      {
        name: "Round Coffee Table",
        subtitle: "Monolithic Cast Stone Surface",
        price: 16000,
        install: 800,
      },
      {
        name: "Floor Lamp",
        subtitle: "Slim Architectural Linear LED Stem",
        price: 6500,
        install: 500,
      },
      {
        name: "Neutral Rug",
        subtitle: "Short-Pile Organic Wool Blend",
        price: 10000,
        install: 500,
      },
      {
        name: "Wall Art (Abstract)",
        subtitle: "Monochrome Canvas Framed Float",
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
    tier: "Luxury",
    costRangeSqFt: { min: 3000, max: 5500 },
    est1000SqFt: "Rs. 30 - 55+ Lakhs",
    materials: "Marble, premium veneer, velvet, brass, glass and polished stone.",
    furniture: "Bespoke sofas, statement tables, designer lighting.",
    coloursSummary: "Champagne, gold, walnut, deep green, onyx.",
    advantages: "Premium appearance, refined detailing and customization.",
    considerations: "High material, fabrication and replacement costs.",
    maintenance: "Higher; marble, brass and delicate fabrics need care.",
    bestForBadge: "Best for premium finishes",
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
        price: 120000,
        install: 3000,
      },
      {
        name: "Marble Coffee Table",
        subtitle: "Calacatta Gold Marble & Brass Plinth",
        price: 45000,
        install: 2000,
      },
      {
        name: "Designer Chandelier",
        subtitle: "Brushed Champagne Brass Crystal Tier",
        price: 35000,
        install: 2500,
      },
      {
        name: "Accent Chair",
        subtitle: "Fluted Silk Velvet & Polished Brass",
        price: 28000,
        install: 1500,
      },
      {
        name: "Console & Decor",
        subtitle: "Dark Fluted Walnut & Gold Hardware",
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
    tier: "Premium",
    costRangeSqFt: { min: 1800, max: 3000 },
    est1000SqFt: "Rs. 18 - 30 Lakhs",
    materials: "Travertine, engineered stone, wood, glass, textured fabrics.",
    furniture: "Curved sofas, sculptural chairs, modern coffee tables.",
    coloursSummary: "Soft cream, greige, taupe, slate blue, graphite.",
    advantages: "Flexible, adaptable and suitable for combining different design elements.",
    considerations: "Custom pieces and changing trends can increase costs.",
    maintenance: "Moderate.",
    bestForBadge: "Best for versatility",
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
        price: 75000,
        install: 2500,
      },
      {
        name: "Coffee Table",
        subtitle: "Honed Roman Travertine & Smoked Glass",
        price: 22000,
        install: 1000,
      },
      {
        name: "Accent Chair",
        subtitle: "Sculptural Bouclé Swivel Silhouette",
        price: 18000,
        install: 1000,
      },
      {
        name: "Area Rug",
        subtitle: "High-Low Textured Architectural Wool",
        price: 14000,
        install: 800,
      },
      {
        name: "Wall Art & Decor",
        subtitle: "Curated Contemporary Canvas & Sculpture",
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
    tier: "Affordable",
    costRangeSqFt: { min: 1400, max: 2100 },
    est1000SqFt: "Rs. 14 - 21 Lakhs",
    materials: "Light oak, birch, cotton, wool, natural textiles.",
    furniture: "Functional wooden furniture, comfortable sofas, simple storage.",
    coloursSummary: "Snow white, oat beige, light oak, soft sage, powder blue.",
    advantages: "Bright, comfortable, functional and relatively economical.",
    considerations: "Natural wood and quality textiles can increase the budget.",
    maintenance: "Generally low to moderate.",
    bestForBadge: "Best for functionality",
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
        price: 55000,
        install: 2000,
      },
      {
        name: "Wooden Coffee Table",
        subtitle: "Solid Blonde Nordic Ash & Birch",
        price: 18000,
        install: 800,
      },
      {
        name: "Pendant Light",
        subtitle: "Matte White Spun Aluminum Dome",
        price: 8000,
        install: 800,
      },
      {
        name: "Woven Rug",
        subtitle: "Flatweave Wool & Cotton Geometric",
        price: 12000,
        install: 500,
      },
      {
        name: "Indoor Plant",
        subtitle: "Fiddle Leaf Fig in Terracotta Planter",
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
 * Generates the official 9-page HomeVerse "Interior Style Selection & Cost Guide"
 * Universal comprehensive catalogue covering all 6 styles, work categories, pricing benchmarks,
 * decision matrices, and 2026 market citations.
 */
export async function generateInteriorDesignReport(options: ReportGeneratorOptions = {}): Promise<void> {
  const { onProgress } = options;

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

  onProgress?.(20, "Initializing 9-page architectural report engine...");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const totalPages = 9;
  const reportDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function drawHeader(pageNum: number, categoryTitle: string | null) {
    // Emerald top accent bar
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 3, "F");

    // HomeVerse logo & tracker
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text("HomeVerse", margin, margin);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("AI SPATIAL ARCHITECTURE & INTERIOR ESTIMATION", margin + 28, margin - 0.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(
      categoryTitle ? categoryTitle.toUpperCase() : "INTERIOR STYLE GUIDE",
      pageWidth - margin,
      margin,
      { align: "right" }
    );

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 3.5, pageWidth - margin, margin + 3.5);
  }

  function drawFooter(pageNum: number, sectionName: string | null) {
    const footY = pageHeight - 10;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, footY - 3, pageWidth - margin, footY - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      sectionName ? `HomeVerse | ${sectionName}` : "HomeVerse | Interior Style Selection & Cost Guide",
      margin,
      footY + 1
    );

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text("2026 INDIA INTERIOR MARKET BENCHMARK", pageWidth / 2, footY + 1, {
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
  onProgress?.(25, "Compiling Cover Page (1/9)...");
  drawHeader(1, "Interior Style Guide");

  // Hero Card
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(margin, 24, contentWidth, 74, 4, 4, "F");

  // Emerald accent top strip
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, 24, contentWidth, 3, 2, 2, "F");

  // Badge pill
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(margin + 8, 33, 76, 6, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text("UNIVERSAL STYLE & BUDGET GUIDE * 2026 REFERENCE", margin + 11, 37.2);

  // Main Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(255, 255, 255);
  doc.text("INTERIOR STYLE SELECTION & COST GUIDE", margin + 8, 48);

  doc.setFontSize(11.5);
  doc.setTextColor(209, 213, 219);
  doc.text("& Turnkey Execution Budget Estimator (Per Sq.Ft)", margin + 8, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  const coverIntro =
    "Explore six interior aesthetics, understand their materials, compare estimated costs and find a style that matches your budget. Formulated with 2026 turnkey interior execution benchmarks in India.";
  doc.text(doc.splitTextToSize(coverIntro, contentWidth - 16), margin + 8, 62);

  // Metadata ribbon inside banner
  const ribbonY = 75;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 8, ribbonY, contentWidth - 16, 15, 2, 2, "F");

  const metaItems = [
    { label: "CATALOGUE SCOPE", val: "All 6 Design Styles" },
    { label: "PRICING BASIS", val: "Turnkey Rate (Per Sq.Ft)" },
    { label: "MARKET REFERENCE", val: "2026 India Metros" },
    { label: "REPORT DATE", val: reportDate },
  ];

  const colW = (contentWidth - 16) / 4;
  metaItems.forEach((m, i) => {
    const x = margin + 8 + i * colW + 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(m.label, x, ribbonY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(248, 250, 252);
    doc.text(m.val, x, ribbonY + 11);
  });

  // Table of Contents Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Catalogue Structure & Table of Contents", margin, 106);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, 108.5, margin + 35, 108.5);

  const tocItems = [
    {
      p: "Page 2",
      title: "Understanding Interior Design Costs",
      desc: "Per-sq.ft pricing framework, turnkey scope, inclusions, exclusions & work category allowances",
      cost: "Framework Guide",
    },
    {
      p: "Page 3",
      title: "01. Japandi Style Guide",
      desc: "Calm + Natural + Balanced | Natural oak, bamboo, linen, stone | Mid-range",
      cost: "Rs. 1,500 - 2,300 / sq.ft",
    },
    {
      p: "Page 4",
      title: "02. Industrial Style Guide",
      desc: "Raw + Bold + Urban | Exposed brick, concrete, steel, distressed leather | Mid-range",
      cost: "Rs. 1,600 - 2,600 / sq.ft",
    },
    {
      p: "Page 5",
      title: "03. Minimalist Style Guide",
      desc: "Clean + Simple + Uncluttered | Matte laminates, engineered wood, pure white | Budget-friendly",
      cost: "Rs. 1,200 - 1,800 / sq.ft",
    },
    {
      p: "Page 6",
      title: "04. Modern Luxury Style Guide",
      desc: "Elegant + Rich + Sophisticated | Marble, premium veneer, velvet, brushed brass | Luxury",
      cost: "Rs. 3,000 - 5,500+ / sq.ft",
    },
    {
      p: "Page 7",
      title: "05. Contemporary Style Guide",
      desc: "Current + Refined + Versatile | Travertine, curved form, textured chenille | Premium",
      cost: "Rs. 1,800 - 3,000 / sq.ft",
    },
    {
      p: "Page 8",
      title: "06. Modern Scandinavian Style Guide",
      desc: "Bright + Cozy + Airy | Light oak, birch, wool, natural daylight | Affordable",
      cost: "Rs. 1,400 - 2,100 / sq.ft",
    },
    {
      p: "Page 9",
      title: "Comparison & Recommendations",
      desc: "1,000 sq.ft side-by-side cost matrix, decision-making guide & 2026 market citations",
      cost: "All 6 Styles",
    },
  ];

  let tocY = 113;
  tocItems.forEach((t, i) => {
    doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, tocY, contentWidth, 12.2, 1.5, 1.5, "FD");

    // Page pill
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin + 2.5, tocY + 2.2, 15, 7.5, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text(t.p, margin + 10, tocY + 7, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(17, 24, 39);
    doc.text(t.title, margin + 20, tocY + 5.2);

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(107, 114, 128);
    doc.text(t.desc, margin + 20, tocY + 9.5);

    // Rate / Note
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(t.cost, margin + contentWidth - 3.5, tocY + 7.2, { align: "right" });

    tocY += 13.5;
  });

  // Callout banner at bottom of cover page
  const coverCalloutY = 227;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, coverCalloutY, contentWidth, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text("How to Use this Style Selection & Cost Guide", margin + 6, coverCalloutY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(55, 65, 81);
  const guideBullets = [
    "- Universal Aesthetic Evaluation: Evaluate materials and design character for the entire home rather than a single room.",
    "- Standardized Per-Sq.Ft Pricing: Turnkey rates are calibrated per square foot of carpet area for easy scaling to any property.",
    "- Transparent Material & Labour Split: Distinct allowances for raw material procurement and certified contractor execution.",
    "- Decision Framework & Market Benchmarks: Compare pros, cons, and maintenance levels before finalizing procurement agreements.",
  ];
  guideBullets.forEach((b, bi) => {
    doc.text(b, margin + 6, coverCalloutY + 13.5 + bi * 6);
  });

  drawFooter(1, "Cover Page");

  // ==========================================
  // PAGE 2: UNDERSTANDING INTERIOR DESIGN COSTS
  // ==========================================
  onProgress?.(35, "Compiling Cost Framework & Allowances (2/9)...");
  doc.addPage();
  drawHeader(2, "Cost Framework");

  const p2TopY = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Understanding Interior Design Costs in 2026", margin, p2TopY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "How per-square-foot pricing works, standard turnkey scopes, inclusions, and exclusions.",
    margin,
    p2TopY + 7.5
  );

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, p2TopY + 9.5, margin + 35, p2TopY + 9.5);

  // Two concept cards: Left = How per-sq.ft works | Right = Inclusions & Exclusions
  const cardRowY = p2TopY + 13;
  const cardW = (contentWidth - 6) / 2; // 88mm

  // Card 1: How Per-Sq.Ft Pricing Works
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cardRowY, cardW, 58, 2.5, 2.5, "FD");

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 3, cardRowY + 3, 2, 8, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("How Per-Square-Foot Pricing Works", margin + 8, cardRowY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  const sqftExpLines = [
    "* Metric Standard: In India, interior costs are planned based on carpet area or built-up area in square feet (sq. ft.).",
    "* Universal Comparability: Standardizes budgets across 1BHK, 2BHK, 3BHK, or independent villas regardless of room partitions.",
    "* Material Procurement (65% - 75%): BWP/BWR marine plywood, laminates, quartz, hardware (Hettich/Hafele), paints, and tiles.",
    "* Certified Labour (25% - 35%): Certified carpenters, electricians, civil masons, painters, and site supervisors.",
    "* Efficiency Scaling: Larger carpet areas often achieve 5-10% cost efficiencies per sq.ft through bulk material procurement.",
  ];
  let p2c1Y = cardRowY + 15;
  sqftExpLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, cardW - 8);
    doc.text(wrapped, margin + 4, p2c1Y);
    p2c1Y += wrapped.length * 3.4 + 2;
  });

  // Card 2: Turnkey Scope: Inclusions & Exclusions
  const card2X = margin + cardW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(card2X, cardRowY, cardW, 58, 2.5, 2.5, "FD");

  doc.setFillColor(59, 130, 246);
  doc.roundedRect(card2X + 3, cardRowY + 3, 2, 8, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Scope: Inclusions & Exclusions", card2X + 8, cardRowY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(5, 150, 105);
  doc.text("WHAT IS INCLUDED IN TURNKEY ESTIMATES:", card2X + 4, cardRowY + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(75, 85, 99);
  const incLines = [
    "- Civil prep, surface plastering & flooring installation",
    "- False ceiling framing, gypsum boards & cove lighting channels",
    "- Premium 2-coat wall painting with primer and putty",
    "- Modular carpentry: kitchen, wardrobes & vanity units",
    "- Concealed electrical conduits, wiring & switchboards",
  ];
  let p2c2Y = cardRowY + 19;
  incLines.forEach((l) => {
    doc.text(l, card2X + 4, p2c2Y);
    p2c2Y += 3.4;
  });

  p2c2Y += 1.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(220, 38, 38);
  doc.text("WHAT IS EXCLUDED (BUDGET SEPARATELY):", card2X + 4, p2c2Y);

  p2c2Y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(75, 85, 99);
  const excLines = [
    "- GST (Goods & Services Tax): 18% standard, quoted separately",
    "- Loose furniture (movable sofas, accent chairs, dining table)",
    "- Appliances (refrigerator, oven, hob, chimney, televisions)",
    "- Structural demolition or balcony masonry alterations",
  ];
  excLines.forEach((l) => {
    doc.text(l, card2X + 4, p2c2Y);
    p2c2Y += 3.4;
  });

  // Section 2: Work Category Planning Allowances Table
  const tableSecY = cardRowY + 63; // = 96mm
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Work Category Planning Allowances (2026 India Market)", margin, tableSecY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Indicative preliminary trade allowances. Note: Overall turnkey style rates already integrate these categories.",
    margin,
    tableSecY + 4.2
  );

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, tableSecY + 6.2, margin + 35, tableSecY + 6.2);

  // Table Header
  const thY = tableSecY + 9;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, thY, contentWidth, 7.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Work Category", margin + 3, thY + 5);
  doc.text("Approximate Cost Range", margin + 64, thY + 5);
  doc.text("Trade Scope & Specifications Included", margin + 115, thY + 5);

  const workCategories = [
    {
      name: "Painting and wall finishes",
      cost: "Rs. 25 - Rs. 60 / sq. ft.",
      desc: "Surface sanding, 2 coats acrylic putty, 1 coat primer, 2 coats washable premium emulsion (Asian Paints Royale / Berger).",
    },
    {
      name: "False ceiling",
      cost: "Rs. 75 - Rs. 180 / sq. ft.",
      desc: "Gyproc Saint-Gobain 12.5mm boards, galvanized steel framework, cove lighting recesses, and flush joint finishing.",
    },
    {
      name: "Flooring installation",
      cost: "Rs. 40 - Rs. 120 / sq. ft.",
      desc: "Laying charges for vitrified tile or SPC/laminate wooden flooring, chemical screed leveling, and epoxy joint grouting.",
    },
    {
      name: "Basic electrical & lighting labour",
      cost: "Rs. 30 - Rs. 80 / sq. ft.",
      desc: "Concealed PVC conduit routing, fire-retardant copper wiring, modular switchboard terminations, and LED spot fixtures.",
    },
    {
      name: "Interior carpentry & furniture",
      cost: "Scope / quantity dependent",
      desc: "IS:710 boiling waterproof plywood framing, 1mm high-gloss/matte laminates, hydraulic soft-close hinges and drawer channels.",
    },
    {
      name: "Decorative finishes",
      cost: "Scope / material dependent",
      desc: "Fluted charcoal louvers, CNC jaali architectural screens, textured stone cladding, acoustic slat panels, and metallic trims.",
    },
  ];

  let catRowY = thY + 7.5;
  const catRowH = 10.5;

  workCategories.forEach((wc, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.rect(margin, catRowY, contentWidth, catRowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(17, 24, 39);
    doc.text(wc.name, margin + 3, catRowY + 4.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(wc.cost, margin + 64, catRowY + 4.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(wc.desc, contentWidth - 118);
    doc.text(descLines, margin + 115, catRowY + 4.5);

    catRowY += catRowH;
  });

  // Callout: Unit Measurement vs. Package Rates
  const p2NoteY = catRowY + 5;
  doc.setFillColor(254, 252, 232); // Amber 50
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, p2NoteY, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text("Crucial Rule: Do Not Add Individual Trade Rates Together", margin + 4, p2NoteY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(120, 53, 15);
  const p2Rules = [
    "- Trade Measurement Differences: Flooring and painting are quoted against measured surface areas, while electrical points and modular carpentry are quoted per unit/running foot.",
    "- Integrated Turnkey Allowances: Do NOT add individual trade numbers together. The HomeVerse turnkey rate per sq.ft already combines these allowances harmoniously.",
    "- Market Variance: Published 2026 data shows false ceilings at Rs. 75 - Rs. 250/sq.ft and turnkey packages varying significantly by finish tier and location.",
  ];
  p2Rules.forEach((r, ri) => {
    doc.text(r, margin + 4, p2NoteY + 9.5 + ri * 4.2);
  });

  // Bottom Advice Box
  const p2AdvY = p2NoteY + 26;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, p2AdvY, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  doc.text("HomeVerse Strategic Contracting Checklist", margin + 4, p2AdvY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(55, 65, 81);
  const advItems = [
    "1. Detailed BOQ: Verify that all brands, plywood grades (IS:710), and laminate thicknesses (1.0mm) are explicitly itemized.",
    "2. GST Transparency: Confirm upfront whether quotations are GST-inclusive or GST-exclusive (standard 18% impact).",
    "3. Milestone Payments: Link payments strictly to verified site execution stages (e.g. 10% booking, 40% carcass, 40% finish, 10% handover).",
    "4. Contingency Reserve: Always retain an 8-10% contingency buffer for unforeseen plumbing adjustments or custom finish requests.",
  ];
  advItems.forEach((a, ai) => {
    doc.text(a, margin + 4, p2AdvY + 9.5 + ai * 3.8);
  });

  drawFooter(2, "Cost Framework");

  // ==========================================
  // PAGES 3 to 8: THE 6 INDIVIDUAL STYLE GUIDES
  // Page 3: Japandi
  // Page 4: Industrial
  // Page 5: Minimalist
  // Page 6: Modern Luxury
  // Page 7: Contemporary
  // Page 8: Modern Scandinavian
  // ==========================================
  REPORT_STYLES.forEach((st, idx) => {
    const pageNum = idx + 3;
    onProgress?.(45 + idx * 8, `Rendering Style ${idx + 1}/6: ${st.name} (Page ${pageNum}/9)...`);

    doc.addPage();
    drawHeader(pageNum, `${st.name} Style Guide`);

    // Top Header & Hero Image
    const topY = 20;
    const leftW = 106;
    const rightX = margin + leftW + 6;
    const rightW = contentWidth - leftW - 6; // 70mm

    // Style Tier Badge
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, topY, 44, 5.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(5, 150, 105);
    doc.text(`STYLE 0${idx + 1} | ${st.tier.toUpperCase()} TIER`, margin + 2.5, topY + 3.8);

    // Style Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text(st.name, margin, topY + 13.5);

    // Tagline
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text(st.tagline, margin, topY + 18.5);

    // Description paragraph
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(st.description, leftW);
    doc.text(descLines, margin, topY + 23.5);

    // Rate & Projection Card on Left
    const rateCardY = topY + 34;
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.roundedRect(margin, rateCardY, leftW, 14, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(52, 211, 153);
    doc.text(
      `TURNKEY PLANNING RATE: Rs. ${st.costRangeSqFt.min.toLocaleString("en-IN")} - ${st.costRangeSqFt.max.toLocaleString("en-IN")} / sq.ft`,
      margin + 4,
      rateCardY + 5.5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(209, 213, 219);
    doc.text(
      `Typical 1,000 sq.ft Home Estimate: ${st.est1000SqFt}`,
      margin + 4,
      rateCardY + 10.5
    );

    // Reference Interior Image on Right Side
    const heroImgData = heroImageCache[st.image];
    if (heroImgData) {
      try {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(rightX, topY, rightW, 48, 2.5, 2.5, "F");
        doc.addImage(heroImgData, "JPEG", rightX + 0.5, topY + 0.5, rightW - 1, 47, undefined, "FAST");
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.roundedRect(rightX, topY, rightW, 48, 2.5, 2.5, "D");
      } catch (e) {
        console.error("Failed to render style image:", st.name, e);
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(rightX, topY, rightW, 48, 2.5, 2.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${st.name} Reference`, rightX + rightW / 2, topY + 25, { align: "center" });
    }

    // ------------------------------------------
    // STYLE ARCHITECTURAL DNA: MATERIALS, FURNITURE, PROS, CONS & CARE
    // ------------------------------------------
    const dnaY = topY + 51; // = 71mm
    const dnaColW = (contentWidth - 6) / 2; // 88mm

    // Left DNA Box: Materials & Furniture
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, dnaY, dnaColW, 35, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Common Materials:", margin + 3.5, dnaY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    const matLines = doc.splitTextToSize(st.materials, dnaColW - 7);
    doc.text(matLines, margin + 3.5, dnaY + 9);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Signature Furniture Pieces:", margin + 3.5, dnaY + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    const furnLines = doc.splitTextToSize(st.furniture, dnaColW - 7);
    doc.text(furnLines, margin + 3.5, dnaY + 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Characteristic Palette:", margin + 3.5, dnaY + 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    doc.text(st.coloursSummary, margin + 3.5, dnaY + 33);

    // Right DNA Box: Advantages, Considerations & Maintenance
    const rightDnaX = margin + dnaColW + 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(rightDnaX, dnaY, dnaColW, 35, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text("Advantages (Pros):", rightDnaX + 3.5, dnaY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    const advLines = doc.splitTextToSize(st.advantages, dnaColW - 7);
    doc.text(advLines, rightDnaX + 3.5, dnaY + 9);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38);
    doc.text("Considerations & Challenges:", rightDnaX + 3.5, dnaY + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    const conLines = doc.splitTextToSize(st.considerations, dnaColW - 7);
    doc.text(conLines, rightDnaX + 3.5, dnaY + 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(59, 130, 246);
    doc.text("Maintenance Demands:", rightDnaX + 3.5, dnaY + 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    const maintLines = doc.splitTextToSize(st.maintenance, dnaColW - 7);
    doc.text(maintLines, rightDnaX + 3.5, dnaY + 33);

    // ------------------------------------------
    // SECTION 1: ARCHITECTURAL COLOUR PALETTE DNA
    // ------------------------------------------
    const sec1Y = dnaY + 39; // = 110mm
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

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(margin, sec1Y + 6.2, margin + 32, sec1Y + 6.2);

    // 5 Swatches
    const swatchRowY = sec1Y + 9.5; // = 119.5mm
    const swatchW = (contentWidth - 16) / 5;

    st.palette.forEach((c, ci) => {
      const sx = margin + ci * (swatchW + 4);
      const rgb = hexToRgb(c.hex);

      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.roundedRect(sx, swatchRowY, swatchW, 9.5, 2, 2, "F");

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.roundedRect(sx, swatchRowY, swatchW, 9.5, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(17, 24, 39);
      doc.text(c.name, sx + 1, swatchRowY + 13.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(107, 114, 128);
      doc.text(`${c.hex} | ${c.role}`, sx + 1, swatchRowY + 16.8);
    });

    // ------------------------------------------
    // SECTION 2: SIGNATURE ENSEMBLE & TURNKEY PRICING TABLE (3 Columns)
    // ------------------------------------------
    const sec2Y = swatchRowY + 21; // = 140.5mm
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

    // Table Header
    const thY = sec2Y + 8.5; // = 149mm
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.rect(margin, thY, contentWidth, 6.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text("Featured Item & Material Specification", margin + 3, thY + 4.5);
    doc.text("Item Price (INR)", margin + 125, thY + 4.5, { align: "right" });
    doc.text("Installation Cost (INR)", margin + contentWidth - 4, thY + 4.5, { align: "right" });

    // 5 Rows (pitch = 10mm)
    let rowY = thY + 6.5;
    const rowH = 10;
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
      doc.text(item.name, margin + 3, rowY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(107, 114, 128);
      doc.text(item.subtitle, margin + 3, rowY + 7.8);

      // Price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(formatINR(item.price), margin + 125, rowY + 6.2, { align: "right" });

      // Installation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(5, 150, 105);
      doc.text(formatINR(item.install), margin + contentWidth - 4, rowY + 6.2, { align: "right" });

      rowY += rowH;
    });

    // Sample Ensemble Investment Summary Box
    const totalY = rowY + 2.5; // = 208mm
    const grandTotal = sumItems + sumInstall;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, totalY, contentWidth, 15, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 78, 59);
    doc.text("Sample 5-Piece Ensemble Total", margin + 4, totalY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(75, 85, 99);
    doc.text(
      "Combined material acquisition + certified turnkey contractor installation charges",
      margin + 4,
      totalY + 10.5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Materials: ${formatINR(sumItems)}  |  Labour: ${formatINR(sumInstall)}`,
      margin + contentWidth - 4,
      totalY + 5.5,
      { align: "right" }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(4, 120, 87);
    doc.text(`Ensemble: ${formatINR(grandTotal)}`, margin + contentWidth - 4, totalY + 11.5, {
      align: "right",
    });

    // ------------------------------------------
    // SECTION 3: TURNKEY EXECUTION BUDGET (PER SQ.FT BENCHMARK)
    // ------------------------------------------
    const sqftBoxY = totalY + 18; // = 228.5mm
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, sqftBoxY, contentWidth, 34, 2.5, 2.5, "FD");

    // Header inside box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text("3. Whole-Home Turnkey Budget Benchmark (Per Sq.Ft)", margin + 4, sqftBoxY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Standardized full-home budget benchmark based on carpet area for complete turnkey interior delivery.",
      margin + 4,
      sqftBoxY + 9.5
    );

    // 3 Stat Cards inside the box
    const statW = (contentWidth - 14) / 3;
    const statY = sqftBoxY + 12.5;

    // Stat 1: Budget Classification
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 3, statY, statW, 17, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("BUDGET CLASSIFICATION", margin + 6, statY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(st.tier, margin + 6, statY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175);
    doc.text(st.bestForBadge, margin + 6, statY + 14.5);

    // Stat 2: Per Sq.Ft Rate Range
    const stat2X = margin + 3 + statW + 4;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(stat2X, statY, statW, 17, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ESTIMATED RATE / SQ.FT", stat2X + 3, statY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${st.costRangeSqFt.min.toLocaleString("en-IN")} - ${st.costRangeSqFt.max.toLocaleString("en-IN")}`, stat2X + 3, statY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175);
    doc.text("Materials + skilled turnkey labour", stat2X + 3, statY + 14.5);

    // Stat 3: 1,000 sq.ft Projection
    const stat3X = stat2X + statW + 4;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.4);
    doc.roundedRect(stat3X, statY, statW, 17, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87);
    doc.text("1,000 SQ.FT PROJECTION", stat3X + 3, statY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text(st.est1000SqFt, stat3X + 3, statY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text("Turnkey planning multiplication", stat3X + 3, statY + 14.5);

    drawFooter(pageNum, `${st.name} Style Guide`);
  });

  // ==========================================
  // PAGE 9: COMPARISON & RECOMMENDATIONS
  // ==========================================
  onProgress?.(90, "Compiling Comparison & Recommendations (9/9)...");
  doc.addPage();
  drawHeader(9, "Comparison & Recommendations");

  const p9TopY = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Overall Cost Comparison & Style Decision Matrix", margin, p9TopY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Side-by-side financial comparison, decision guidance, and market benchmarks for a 1,000 sq.ft home.",
    margin,
    p9TopY + 7.5
  );

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, p9TopY + 9.5, margin + 35, p9TopY + 9.5);

  // Table 1: Cross-Style Comparison Matrix
  const cmpThY = p9TopY + 12; // = 32mm
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, cmpThY, contentWidth, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text("Design Style", margin + 3, cmpThY + 4.8);
  doc.text("Budget Tier", margin + 38, cmpThY + 4.8);
  doc.text("Estimated Rate / sq.ft", margin + 82, cmpThY + 4.8, { align: "right" });
  doc.text("1,000 sq.ft Total", margin + 128, cmpThY + 4.8, { align: "right" });
  doc.text("Maintenance Profile", margin + contentWidth - 3, cmpThY + 4.8, { align: "right" });

  const comparisonRows = [
    {
      name: "Minimalist",
      tier: "Budget-friendly",
      rate: "Rs. 1,200 - 1,800 / sq.ft",
      est1000: "Rs. 12 - 18 Lakhs",
      maint: "Generally Low",
      highlight: true,
    },
    {
      name: "Modern Scandinavian",
      tier: "Affordable",
      rate: "Rs. 1,400 - 2,100 / sq.ft",
      est1000: "Rs. 14 - 21 Lakhs",
      maint: "Low to Moderate",
      highlight: false,
    },
    {
      name: "Japandi",
      tier: "Mid-range",
      rate: "Rs. 1,500 - 2,300 / sq.ft",
      est1000: "Rs. 15 - 23 Lakhs",
      maint: "Moderate",
      highlight: false,
    },
    {
      name: "Industrial",
      tier: "Mid-range",
      rate: "Rs. 1,600 - 2,600 / sq.ft",
      est1000: "Rs. 16 - 26 Lakhs",
      maint: "Moderate",
      highlight: false,
    },
    {
      name: "Contemporary",
      tier: "Premium",
      rate: "Rs. 1,800 - 3,000 / sq.ft",
      est1000: "Rs. 18 - 30 Lakhs",
      maint: "Moderate",
      highlight: false,
    },
    {
      name: "Modern Luxury",
      tier: "Luxury",
      rate: "Rs. 3,000 - 5,500+ / sq.ft",
      est1000: "Rs. 30 - 55+ Lakhs",
      maint: "Higher (Marble/Brass)",
      highlight: false,
    },
  ];

  let cmpRowY = cmpThY + 7;
  const cmpRowH = 7.5;

  comparisonRows.forEach((r, idx) => {
    doc.setFillColor(
      r.highlight ? 236 : idx % 2 === 0 ? 255 : 249,
      r.highlight ? 253 : idx % 2 === 0 ? 255 : 250,
      r.highlight ? 245 : idx % 2 === 0 ? 255 : 251
    );
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.rect(margin, cmpRowY, contentWidth, cmpRowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(17, 24, 39);
    doc.text(r.name, margin + 3, cmpRowY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(75, 85, 99);
    doc.text(r.tier, margin + 38, cmpRowY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.rate, margin + 82, cmpRowY + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(r.highlight ? 5 : 4, r.highlight ? 150 : 120, r.highlight ? 105 : 87);
    doc.text(r.est1000, margin + 128, cmpRowY + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(r.maint, margin + contentWidth - 3, cmpRowY + 5, { align: "right" });

    cmpRowY += cmpRowH;
  });

  // Section 2: Decision-Making Matrix
  const decSecY = cmpRowY + 5; // = 89mm
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Decision Matrix: Which Style Should You Choose?", margin, decSecY);

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(margin, decSecY + 2, margin + 30, decSecY + 2);

  const decThY = decSecY + 5;
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.rect(margin, decThY, contentWidth, 6, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(55, 65, 81);
  doc.text("If you prioritize...", margin + 3, decThY + 4.2);
  doc.text("Recommended Style", margin + 65, decThY + 4.2);
  doc.text("Key Architectural Rationale", margin + 115, decThY + 4.2);

  const decisionRows = [
    {
      prio: "Lowest initial budget",
      rec: "Minimalist",
      desc: "Economical, visually spacious, clean hidden storage & simple laminates.",
    },
    {
      prio: "Natural and peaceful interiors",
      rec: "Japandi",
      desc: "Organic natural oak, bamboo, linen textiles & timeless wabi-sabi calm.",
    },
    {
      prio: "Bright and cozy spaces",
      rec: "Modern Scandinavian",
      desc: "Airy daylighting, blonde woods, functional comfort & soft pastel accents.",
    },
    {
      prio: "Bold, unconventional interiors",
      rec: "Industrial",
      desc: "Architectural concrete, exposed brick, matte black steel & leather character.",
    },
    {
      prio: "Flexible and modern aesthetics",
      rec: "Contemporary",
      desc: "Adaptable curved geometry, roman travertine, chenille & versatile tones.",
    },
    {
      prio: "Premium and luxurious appearance",
      rec: "Modern Luxury",
      desc: "Bespoke Italian marble, fluted dark walnut, silk velvet & brushed brass.",
    },
  ];

  let decRowY = decThY + 6;
  const decRowH = 7.2;

  decisionRows.forEach((d, di) => {
    doc.setFillColor(di % 2 === 0 ? 255 : 249, di % 2 === 0 ? 255 : 250, di % 2 === 0 ? 255 : 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.rect(margin, decRowY, contentWidth, decRowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(17, 24, 39);
    doc.text(d.prio, margin + 3, decRowY + 4.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(d.rec, margin + 65, decRowY + 4.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(d.desc, margin + 115, decRowY + 4.8);

    decRowY += decRowH;
  });

  // Section 3: Curated Style Badges (3 x 2 grid)
  const badgeSecY = decRowY + 4.5; // = 153mm
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Curated Recommendations Summary", margin, badgeSecY);

  const badges = [
    { label: "Best for budget-conscious users:", style: "Minimalist" },
    { label: "Best for natural aesthetics:", style: "Japandi" },
    { label: "Best for functionality:", style: "Modern Scandinavian" },
    { label: "Best for distinctive character:", style: "Industrial" },
    { label: "Best for versatility:", style: "Contemporary" },
    { label: "Best for premium finishes:", style: "Modern Luxury" },
  ];

  const bW = (contentWidth - 8) / 3;
  let bRowY = badgeSecY + 4;

  badges.forEach((b, bi) => {
    const colIdx = bi % 3;
    const rowIdx = Math.floor(bi / 3);
    const bx = margin + colIdx * (bW + 4);
    const by = bRowY + rowIdx * 11;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, bW, 9.5, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label, bx + 2.5, by + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text(b.style, bx + 2.5, by + 7.5);
  });

  // Section 4: Official Cost Estimation Disclaimer & Citations
  const discSecY = bRowY + 26; // = 194mm
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, discSecY, contentWidth, 54, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text("Cost Estimation Disclaimer & 2026 Market References", margin + 5, discSecY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(75, 85, 99);
  const disclaimerFullText =
    "All prices provided in this report are indicative planning estimates based on assumed material specifications and typical interior execution requirements in India, using 2026 market references. Actual costs may vary depending on location, carpet area, material quality, supplier pricing, labour charges, design complexity and customization requirements. Estimates are not contractor quotations. GST, appliances, loose furniture, structural modifications and other excluded services may incur additional charges. A detailed bill of quantities and site assessment are recommended before finalizing any project.";

  const discLines = doc.splitTextToSize(disclaimerFullText, contentWidth - 10);
  doc.text(discLines, margin + 5, discSecY + 11.5);

  // Market Citations Box inside the disclaimer card
  const citeY = discSecY + 31.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin + 4, citeY, contentWidth - 8, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Market Data References & Sources Cited:", margin + 7, citeY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const citations = [
    "1. Aaditya Interior - Hyderabad Interior Cost Guide 2026 (turnkey packages & city benchmarks)",
    "2. Hexie Homes - Hyderabad Interior Design Pricing Benchmark (false ceiling & trade breakdown)",
    "3. CREDAI - India Construction & Turnkey Finishing Cost Trends (index of raw materials & skilled labour)",
  ];
  citations.forEach((c, ci) => {
    doc.text(c, margin + 7, citeY + 8.5 + ci * 3.5);
  });

  drawFooter(9, "Comparison & Recommendations");

  onProgress?.(100, "Downloading 9-page PDF report...");
  doc.save("HomeVerse_Interior_Style_Selection_Cost_Guide.pdf");
}
