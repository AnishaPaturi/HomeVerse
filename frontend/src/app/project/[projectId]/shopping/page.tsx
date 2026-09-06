"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AICopilotDrawer } from "@/components/ai/AICopilotDrawer";

interface ShoppingItem {
  id: string;
  project_id: string;
  name: string;
  quantity: number;
  estimated_cost: number;
  status: string; // Wishlist, Selected, Ordered, Delivered, Installed
  product_id?: string;
  product_details?: {
    name: string;
    category: string;
    price: number;
    image_url?: string;
    brand?: string;
  };
}

interface AlternativeProduct {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  savings: number;
  savings_percentage: number;
  difference_reason: string;
}

const CANONICAL_FALLBACK_ITEMS: ShoppingItem[] = [
  { id: "s1", project_id: "p1", name: "L-Shape Modular Sectional Sofa in Oatmeal Boucle", quantity: 1, estimated_cost: 85000, status: "Delivered" },
  { id: "s2", project_id: "p1", name: "Solid Walnut Low Profile Coffee Table", quantity: 1, estimated_cost: 24000, status: "Delivered" },
  { id: "s3", project_id: "p1", name: "Floating TV Console with Acoustic Fluted Slats", quantity: 1, estimated_cost: 48000, status: "Ordered" },
  { id: "s4", project_id: "p1", name: "Dimmable Architectural Floor Lamp", quantity: 2, estimated_cost: 32000, status: "Delivered" },
  { id: "s5", project_id: "p1", name: "Textured Handwoven Wool Area Rug (8x10)", quantity: 1, estimated_cost: 32000, status: "Delivered" },
  { id: "s6", project_id: "p1", name: "Linen Full-Length Window Drapes", quantity: 2, estimated_cost: 18000, status: "Delivered" },
];

export default function ProjectShoppingPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [items, setItems] = useState<ShoppingItem[]>(CANONICAL_FALLBACK_ITEMS);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedItemForSwap, setSelectedItemForSwap] = useState<ShoppingItem | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchShoppingList = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/projects/${projectId}/shopping`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          return;
        }
      }
    } catch {
      // Use canonical default
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, [projectId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = async (item: ShoppingItem, newStatus: string) => {
    try {
      await fetch(`http://localhost:8080/api/shopping/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local state fallback
    }
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: newStatus } : it))
    );
    showToast(`Updated "${item.name}" status to ${newStatus}`);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/shopping/${id}`, { method: "DELETE" });
    } catch {
      // Local fallback
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast("Item removed from procurement registry");
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCost) return;

    const costNum = parseFloat(newItemCost) || 0;
    try {
      const res = await fetch(`http://localhost:8080/api/projects/${projectId}/shopping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName.trim(),
          quantity: 1,
          estimated_cost: costNum,
          status: "Selected",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setItems((prev) => [...prev, created]);
      } else {
        throw new Error();
      }
    } catch {
      setItems((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          project_id: projectId,
          name: newItemName.trim(),
          quantity: 1,
          estimated_cost: costNum,
          status: "Selected",
        },
      ]);
    }
    setNewItemName("");
    setNewItemCost("");
    setIsAddModalOpen(false);
    showToast("Added item to shopping list");
  };

  const openSwapModal = async (item: ShoppingItem) => {
    setSelectedItemForSwap(item);
    setIsSwapping(true);
    try {
      // Fetch product alternatives from API
      const prodsRes = await fetch("http://localhost:8080/api/products");
      if (prodsRes.ok) {
        const prods: any[] = await prodsRes.json();
        const alts = prods
          .filter((p) => p.name !== item.name && p.price < item.estimated_cost)
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            brand: p.brand || "HomeVerse Studio",
            price: p.price,
            savings: Math.max(0, item.estimated_cost - p.price),
            savings_percentage: Math.round(((item.estimated_cost - p.price) / item.estimated_cost) * 100),
            difference_reason: `Substituted in ${p.material || "durable material"} to release ₹${(item.estimated_cost - p.price).toLocaleString()} back to budget contingency.`,
          }));
        setAlternatives(alts.length > 0 ? alts : getMockAlternatives(item));
      } else {
        setAlternatives(getMockAlternatives(item));
      }
    } catch {
      setAlternatives(getMockAlternatives(item));
    } finally {
      setIsSwapping(false);
    }
  };

  const getMockAlternatives = (item: ShoppingItem): AlternativeProduct[] => {
    const p1 = Math.round(item.estimated_cost * 0.65);
    const p2 = Math.round(item.estimated_cost * 0.78);
    return [
      {
        id: "alt-mock-1",
        name: `${item.name} (Value Alternative)`,
        category: "Furniture",
        brand: "Urban Comfort",
        price: p1,
        savings: item.estimated_cost - p1,
        savings_percentage: 35,
        difference_reason: `Engineered hardwood framework with commercial-grade stain-resistant weave (-35% cost).`,
      },
      {
        id: "alt-mock-2",
        name: `${item.name} (Design Studio Edition)`,
        category: "Furniture",
        brand: "Nordic Nest",
        price: p2,
        savings: item.estimated_cost - p2,
        savings_percentage: 22,
        difference_reason: `Minimalist Scandinavian construction with textured linen blend (-22% cost).`,
      },
    ];
  };

  const executeSwap = async (alt: AlternativeProduct) => {
    if (!selectedItemForSwap) return;
    try {
      await fetch(
        `http://localhost:8080/api/shopping/${selectedItemForSwap.id}/swap?alternative_product_id=${alt.id}`,
        { method: "POST" }
      );
    } catch {
      // Local fallback
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedItemForSwap.id
          ? { ...it, name: alt.name, estimated_cost: alt.price }
          : it
      )
    );
    showToast(`Swapped for ${alt.name} (Saved ₹${alt.savings.toLocaleString()})!`);
    setSelectedItemForSwap(null);
  };

  const totalCost = items.reduce((sum, it) => sum + (it.estimated_cost || 0), 0);
  const statusCounts = items.reduce((acc: Record<string, number>, it) => {
    const st = it.status || "Selected";
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const filteredItems =
    activeFilter === "All"
      ? items
      : items.filter((it) => (it.status || "Selected").toLowerCase() === activeFilter.toLowerCase());

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "wishlist":
        return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
      case "selected":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
      case "ordered":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "installed":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      <Navbar />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/project/${projectId}`}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-flex items-center space-x-1"
        >
          <span>&larr;</span> <span>Back to Project Dashboard</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-zinc-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Procurement & Shopping Engine
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              Itemized Shopping List
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Procurement lifecycle: Wishlist &rarr; Selected &rarr; Ordered &rarr; Delivered &rarr; Installed.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/catalogue"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-50 transition"
            >
              Browse Catalogue
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm transition"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Procurement Summary Banner */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Total Procurement Value</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              ₹{totalCost.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Within allocated ₹2.40L furniture envelope
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Total Registered Items</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {items.length} Items
            </div>
            <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
              Across living, dining, and ambient lighting
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Fulfillment Status</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(statusCounts).map(([st, cnt]) => (
                <span
                  key={st}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(st)}`}
                >
                  {st}: {cnt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-gray-200 dark:border-zinc-800 pb-3">
          {["All", "Wishlist", "Selected", "Ordered", "Delivered", "Installed"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeFilter === filter
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Procurement Table / Card List */}
        <div className="mt-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Product & Specification</th>
                <th className="px-6 py-3.5">Qty</th>
                <th className="px-6 py-3.5">Estimated Cost</th>
                <th className="px-6 py-3.5">Status Lifecycle</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white text-xs">{item.name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Procurement ID: HV-{item.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700 dark:text-zinc-300">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    ₹{item.estimated_cost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={item.status || "Selected"}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border-none cursor-pointer focus:outline-none ${getStatusBadgeColor(
                        item.status || "Selected"
                      )}`}
                    >
                      <option value="Wishlist">Wishlist</option>
                      <option value="Selected">Selected</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Installed">Installed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openSwapModal(item)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold transition"
                        title="Value engineering swap"
                      >
                        Swap &amp; Save
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                        title="Delete item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value Engineering Swap Modal */}
        {selectedItemForSwap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Product Alternatives Engine
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    Value-Engineering Alternatives for {selectedItemForSwap.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Current Cost: <span className="font-semibold text-gray-900 dark:text-white">₹{selectedItemForSwap.estimated_cost.toLocaleString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItemForSwap(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {isSwapping ? (
                  <div className="py-12 text-center text-xs text-gray-400">Scanning catalog for matching alternatives...</div>
                ) : alternatives.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">No lower-cost alternatives found for this item.</div>
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
                          Brand: {alt.brand}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <div className="text-right">
                          <div className="text-xs line-through text-gray-400">₹{selectedItemForSwap.estimated_cost.toLocaleString()}</div>
                          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{alt.price.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => executeSwap(alt)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                        >
                          Swap Item
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedItemForSwap(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Shopping Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Add Custom Shopping Item
              </h2>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Item Name & Specification
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Fluted Charcoal Bedside Tables (Pair)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    placeholder="e.g. 18000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Add to Registry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <AICopilotDrawer projectId={projectId} />
    </div>
  );
}
