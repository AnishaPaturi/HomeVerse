"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AICopilotDrawer } from "@/components/ai/AICopilotDrawer";

interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  image_url?: string;
  description?: string;
  dimensions?: string;
  rating?: number;
  availability?: string;
  style?: string;
  material?: string;
  colour?: string;
}

interface AlternativeProduct extends Product {
  original_price: number;
  savings: number;
  savings_percentage: number;
  difference_reason: string;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "L-Shape Modular Sectional Sofa in Oatmeal Boucle",
    category: "sofa",
    brand: "Havenly Living",
    price: 85000,
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    description: "Deep-seated modular sectional sofa wrapped in tactile oatmeal boucle fabric with kiln-dried hardwood frame.",
    dimensions: "280cm x 170cm x 82cm",
    rating: 4.8,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Boucle / Hardwood",
    colour: "Oatmeal",
  },
  {
    id: "p2",
    name: "High-Performance Weave Sectional Sofa",
    category: "sofa",
    brand: "Urban Comfort",
    price: 52000,
    image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    description: "Commercial-grade stain-resistant weave sofa. Engineered frame with high-density foam cushioning.",
    dimensions: "260cm x 160cm x 80cm",
    rating: 4.6,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Commercial Weave",
    colour: "Oatmeal",
  },
  {
    id: "p3",
    name: "Solid Walnut Low Profile Coffee Table",
    category: "table",
    brand: "Kite & Timber",
    price: 24000,
    image_url: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800",
    description: "Organic rounded edges crafted from sustainably sourced American black walnut with oil finish.",
    dimensions: "120cm x 60cm x 38cm",
    rating: 4.9,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Solid Walnut",
    colour: "Walnut Brown",
  },
  {
    id: "p4",
    name: "Engineered Walnut Veneer Coffee Table",
    category: "table",
    brand: "Studio Craft",
    price: 14500,
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    description: "Value-engineered walnut veneer over high-density core with brass-tipped cylindrical legs.",
    dimensions: "110cm x 55cm x 38cm",
    rating: 4.5,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Walnut Veneer",
    colour: "Walnut Brown",
  },
  {
    id: "p5",
    name: "Floating TV Console with Acoustic Fluted Slats",
    category: "storage",
    brand: "Form & Function",
    price: 48000,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    description: "Wall-mounted entertainment credenza with integrated cable raceways and soundbar acoustic slot.",
    dimensions: "200cm x 40cm x 35cm",
    rating: 4.8,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Oak & Charcoal Acoustic Felt",
    colour: "Natural Oak",
  },
  {
    id: "p6",
    name: "Dimmable Architectural Floor Lamp",
    category: "lighting",
    brand: "Lumina",
    price: 16000,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    description: "Slender brass stem with rotatable linen diffuser and touch-step warm dimming (2200K - 3000K).",
    dimensions: "155cm Height",
    rating: 4.7,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "Brushed Brass & Linen",
    colour: "Warm Brass",
  },
  {
    id: "p7",
    name: "Textured Handwoven Wool Area Rug (8x10)",
    category: "decor",
    brand: "Artisan Loom",
    price: 32000,
    image_url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800",
    description: "Subtle ribbed high-low pile hand-knotted from undyed New Zealand wool.",
    dimensions: "240cm x 300cm",
    rating: 4.9,
    availability: "in_stock",
    style: "Warm Contemporary",
    material: "100% Wool",
    colour: "Ivory / Sand",
  },
];

export default function ProductCataloguePage() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [selectedProductForAlt, setSelectedProductForAlt] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [isAltLoading, setIsAltLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      let url = "http://localhost:8080/api/products";
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStyle !== "all") params.append("style", selectedStyle);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          return;
        }
      }
    } catch {
      // Use fallback
    }

    // Filter local fallback
    let filtered = [...FALLBACK_PRODUCTS];
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedStyle !== "all") {
      filtered = filtered.filter((p) => (p.style || "").toLowerCase().includes(selectedStyle.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
      );
    }
    setProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStyle, searchQuery]);

  const openAlternativesModal = async (product: Product) => {
    setSelectedProductForAlt(product);
    setIsAltLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/products/${product.id}/alternatives`);
      if (res.ok) {
        const data = await res.json();
        setAlternatives(data);
      } else {
        throw new Error("Failed");
      }
    } catch {
      // Mock fallback alternatives
      const alt1Price = Math.round(product.price * 0.65);
      const alt2Price = Math.round(product.price * 0.78);
      setAlternatives([
        {
          id: `${product.id}-alt1`,
          name: `${product.name} (Value Standard)`,
          category: product.category,
          brand: "HomeVerse Curated",
          price: alt1Price,
          image_url: product.image_url,
          dimensions: product.dimensions,
          rating: 4.6,
          original_price: product.price,
          savings: product.price - alt1Price,
          savings_percentage: 35.0,
          difference_reason: "High-abrasion commercial weave with engineered framework (-35% cost).",
        },
        {
          id: `${product.id}-alt2`,
          name: `${product.name} (Design Studio Edition)`,
          category: product.category,
          brand: "Urban Comfort",
          price: alt2Price,
          image_url: product.image_url,
          dimensions: product.dimensions,
          rating: 4.7,
          original_price: product.price,
          savings: product.price - alt2Price,
          savings_percentage: 22.0,
          difference_reason: "Textured linen blend finish with modular layout flexibility (-22% cost).",
        },
      ]);
    } finally {
      setIsAltLoading(false);
    }
  };

  const handleAddToList = (product: Product) => {
    setToastMessage(`Added "${product.name}" to shopping list!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span>HomeVerse Catalogue &bull; Version 2</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Curated Architectural Catalogue
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Designer-grade furniture, ambient lighting, and bespoke joinery with value-engineering alternatives.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, material, or brand..."
              className="w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white shadow-sm"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-200/60 dark:bg-zinc-900 p-1 rounded-xl">
            {["all", "sofa", "table", "storage", "lighting", "decor"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  selectedCategory === cat
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {cat === "all" ? "All Items" : cat}
              </button>
            ))}
          </div>

          {/* Style Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500 dark:text-zinc-400 font-medium">Style:</span>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Styles</option>
              <option value="Warm Contemporary">Warm Contemporary</option>
              <option value="Scandinavian">Scandinavian</option>
              <option value="Minimalist">Minimalist</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Product Image */}
              <div className="relative h-56 w-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-white">
                    {p.category}
                  </span>
                  {p.style && (
                    <span className="px-2.5 py-1 rounded-md bg-indigo-600/80 backdrop-blur-md text-[10px] font-semibold text-white">
                      {p.style}
                    </span>
                  )}
                </div>
                {p.rating && (
                  <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-zinc-900/90 text-amber-500 text-xs font-bold shadow-sm">
                    <span>★</span>
                    <span className="text-gray-900 dark:text-white">{p.rating}</span>
                  </div>
                )}
              </div>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">{p.brand || "HomeVerse Curated"}</div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800 pt-2.5">
                    {p.dimensions && <div><span className="font-semibold text-gray-700 dark:text-zinc-300">Dims:</span> {p.dimensions}</div>}
                    {p.material && <div><span className="font-semibold text-gray-700 dark:text-zinc-300">Material:</span> {p.material}</div>}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 block text-[10px]">Estimated Price</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white">
                      ₹{p.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAlternativesModal(p)}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[11px] font-semibold transition"
                      title="Find value engineering alternatives"
                    >
                      Alternatives
                    </button>
                    <button
                      onClick={() => handleAddToList(p)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-sm transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alternatives Value Engineering Modal */}
        {selectedProductForAlt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Value Engineering Engine
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    Affordable Alternatives for {selectedProductForAlt.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Original Price: <span className="font-semibold text-gray-900 dark:text-white">₹{selectedProductForAlt.price.toLocaleString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProductForAlt(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {isAltLoading ? (
                  <div className="py-12 text-center text-xs text-gray-400">Calculating material trade-offs...</div>
                ) : alternatives.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">No alternatives found.</div>
                ) : (
                  alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{alt.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            Save ₹{alt.savings.toLocaleString()} ({alt.savings_percentage}%)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1">{alt.difference_reason}</p>
                        <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                          Brand: {alt.brand} &bull; Rating: ★ {alt.rating}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <div className="text-right">
                          <div className="text-xs line-through text-gray-400">₹{alt.original_price?.toLocaleString()}</div>
                          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{alt.price.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleAddToList(alt);
                            setSelectedProductForAlt(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                        >
                          Select Alternative
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedProductForAlt(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-semibold hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AICopilotDrawer />
    </div>
  );
}
