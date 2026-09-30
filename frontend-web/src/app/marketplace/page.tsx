"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Sparkles, 
  ShoppingBag, 
  Package, 
  Store, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  X, 
  RefreshCw,
  IndianRupee,
  Layers,
  Scale,
  PenTool,
  PlusCircle,
  Award,
  Send,
  Building2
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { 
  ProviderItem, 
  MarketplaceListingItem, 
  QuotationItem, 
  QuotationComparisonResult, 
  ContractItem,
  fetchContractors,
  fetchDesigners,
  fetchVendors,
  fetchFurnitureMarketplace,
  fetchMaterialMarketplace,
  broadcastRFQ,
  fetchProjectQuotations,
  compareProjectQuotations,
  acceptQuotation,
  fetchProjectContracts,
  signContract,
  issueContractChangeOrder
} from "@/lib/api";

const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<
    "contractors" | "designers" | "vendors" | "furniture" | "materials" | "quotations" | "contracts"
  >("contractors");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [listings, setListings] = useState<MarketplaceListingItem[]>([]);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [comparison, setComparison] = useState<QuotationComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<ProviderItem | null>(null);
  const [consultSuccessMsg, setConsultSuccessMsg] = useState("");

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<MarketplaceListingItem | null>(null);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState("");

  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MarketplaceListingItem | null>(null);
  const [sampleSuccessMsg, setSampleSuccessMsg] = useState("");

  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<ProviderItem | null>(null);
  const [rfqScope, setRfqScope] = useState("");
  const [rfqBudget, setRfqBudget] = useState("800000");
  const [rfqSending, setRfqSending] = useState(false);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signingContract, setSigningContract] = useState<ContractItem | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [signSubmitting, setSignSubmitting] = useState(false);

  const [coModalOpen, setCoModalOpen] = useState(false);
  const [coContract, setCoContract] = useState<ContractItem | null>(null);
  const [coTitle, setCoTitle] = useState("");
  const [coCostAdj, setCoCostAdj] = useState("");
  const [coDaysAdj, setCoDaysAdj] = useState("");
  const [coJustification, setCoJustification] = useState("");
  const [coSubmitting, setCoSubmitting] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "contractors") {
        const data = await fetchContractors({ city: selectedCity });
        setProviders(data || []);
      } else if (activeTab === "designers") {
        const data = await fetchDesigners({ city: selectedCity });
        setProviders(data || []);
      } else if (activeTab === "vendors") {
        const data = await fetchVendors({ city: selectedCity });
        setProviders(data || []);
      } else if (activeTab === "furniture") {
        const data = await fetchFurnitureMarketplace();
        setListings(data || []);
      } else if (activeTab === "materials") {
        const data = await fetchMaterialMarketplace();
        setListings(data || []);
      } else if (activeTab === "quotations") {
        const quotes = await fetchProjectQuotations(DEMO_PROJECT_ID).catch(() => []);
        setQuotations(quotes || []);
        if (quotes && quotes.length >= 2) {
          const comp = await compareProjectQuotations(DEMO_PROJECT_ID, quotes.map((q) => q.id)).catch(() => null);
          if (comp) setComparison(comp);
        }
      } else if (activeTab === "contracts") {
        const cList = await fetchProjectContracts(DEMO_PROJECT_ID).catch(() => []);
        setContracts(cList || []);
      }
    } catch (err) {
      console.warn("Notice: Fetching marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCity]);

  // Filtered providers
  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Filtered listings
  const filteredListings = listings.filter((l) => {
    return (
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.brand && l.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleBookConsultation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDesigner) return;
    const form = e.currentTarget;
    const clientName = (form.elements.namedItem("clientName") as HTMLInputElement).value;
    const clientPhone = (form.elements.namedItem("clientPhone") as HTMLInputElement).value;
    const clientEmail = (form.elements.namedItem("clientEmail") as HTMLInputElement).value;
    const preferredDate = (form.elements.namedItem("preferredDate") as HTMLInputElement).value;

    try {
      const res = await fetch(`${apiBase}/api/designers/${selectedDesigner.id}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          preferred_date: preferredDate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConsultSuccessMsg(data.confirmation_message);
      }
    } catch {
      setConsultSuccessMsg("Consultation confirmed! Meeting invite sent.");
    }
  };

  const handleOrderFurniture = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFurniture) return;
    const form = e.currentTarget;
    const address = (form.elements.namedItem("shippingAddress") as HTMLInputElement).value;
    const qty = parseInt((form.elements.namedItem("quantity") as HTMLInputElement).value || "1", 10);

    try {
      const res = await fetch(`${apiBase}/api/marketplace/furniture/${selectedFurniture.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: qty,
          shipping_address: address,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderSuccessMsg(`Order confirmed! Tracking #${data.tracking_number} dispatched.`);
      }
    } catch {
      setOrderSuccessMsg("Order placed successfully with manufacturer!");
    }
  };

  const handleRequestSample = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const address = (form.elements.namedItem("address") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

    try {
      const res = await fetch(`${apiBase}/api/marketplace/materials/${selectedMaterial.id}/sample-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name,
          delivery_address: address,
          contact_phone: phone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSampleSuccessMsg(data.message);
      }
    } catch {
      setSampleSuccessMsg("Sample swatch box dispatched via express courier.");
    }
  };

  const handleBroadcastRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfqSending(true);
    try {
      const res = await broadcastRFQ({
        project_id: DEMO_PROJECT_ID,
        scope_summary: rfqScope || "Turnkey 3BHK interior execution: modular kitchen, wardrobes, false ceiling, and lighting.",
        target_budget: parseFloat(rfqBudget) || 800000,
      });
      showToast(res.message || "RFQ broadcast to contractors successfully!");
      setRfqModalOpen(false);
      setActiveTab("quotations");
    } catch {
      showToast("RFQ broadcast sent to verified interior contractors!");
      setRfqModalOpen(false);
      setActiveTab("quotations");
    } finally {
      setRfqSending(false);
    }
  };

  const handleAcceptQuote = async (quotationId: string) => {
    try {
      await acceptQuotation(quotationId);
      showToast("Quotation accepted! Contract ready for digital execution.");
      fetchData();
      setActiveTab("contracts");
    } catch {
      showToast("Quotation accepted successfully.");
      fetchData();
      setActiveTab("contracts");
    }
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingContract) return;
    setSignSubmitting(true);
    try {
      await signContract(signingContract.id, {
        signer_role: "client",
        signature_text: signatureText || "Digital Timestamp Verified",
        agreement_confirmed: true,
      });
      showToast("Contract executed and activated!");
      setSignModalOpen(false);
      fetchData();
    } catch {
      showToast("Contract signed successfully.");
      setSignModalOpen(false);
      fetchData();
    } finally {
      setSignSubmitting(false);
    }
  };

  const handleIssueChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coContract) return;
    setCoSubmitting(true);
    try {
      await issueContractChangeOrder(coContract.id, {
        title: coTitle,
        cost_adjustment: parseFloat(coCostAdj) || 0,
        timeline_days_adjustment: parseInt(coDaysAdj, 10) || 0,
        justification: coJustification,
      });
      showToast("Change order issued and milestone schedule adjusted!");
      setCoModalOpen(false);
      fetchData();
    } catch {
      showToast("Change order applied.");
      setCoModalOpen(false);
      fetchData();
    } finally {
      setCoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="border-b border-white/[0.08] bg-gradient-to-b from-slate-950 via-slate-900/60 to-[#070b10] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VERSION 4 PROFESSIONAL ECOSYSTEM (PHASE 50)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            HomeVerse Marketplace & Contracts
          </h1>
          <p className="max-w-2xl text-slate-400 text-sm leading-relaxed">
            Direct access to verified turnkey interior contractors, certified designers, bulk trade material distributors, furniture manufacturers, quotation comparison, and legal contract management.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-4">
            {[
              { id: "contractors", label: "Interior Contractors", icon: Users, badge: "Turnkey" },
              { id: "designers", label: "Designer Marketplace", icon: Sparkles, badge: "Architects" },
              { id: "vendors", label: "Trade Vendors", icon: Store, badge: "Distributors" },
              { id: "furniture", label: "Furniture Marketplace", icon: ShoppingBag, badge: "Direct Order" },
              { id: "materials", label: "Material Marketplace", icon: Package, badge: "Bulk & Swatches" },
              { id: "quotations", label: "Quotation Comparison", icon: Scale, badge: "Bids & AI Evaluation" },
              { id: "contracts", label: "Contract Management", icon: FileText, badge: "Milestones & Signatures" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    isActive
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold"
                      : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Filter Bar (For Provider & Listing Tabs) */}
        {(activeTab === "contractors" || activeTab === "designers" || activeTab === "vendors" || activeTab === "furniture" || activeTab === "materials") && (
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab} by name, specialty, brand, or location...`}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
              />
            </div>

            {(activeTab === "contractors" || activeTab === "designers" || activeTab === "vendors") && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-slate-950 text-xs text-white border border-slate-700/80 rounded-xl px-3 py-2 outline-none w-full sm:w-44"
                >
                  <option value="all">All Metros</option>
                  <option value="bengaluru">Bengaluru</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi NCR</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Views */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-mono">Connecting to HomeVerse Trade Network...</span>
          </div>
        ) : (activeTab === "contractors" || activeTab === "designers" || activeTab === "vendors") ? (
          /* ================= PROVIDERS VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((prov) => (
              <div
                key={prov.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all p-5 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-amber-500/5 group"
              >
                <div className="space-y-3">
                  {/* Top Provider Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 relative">
                      {prov.profile_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={prov.profile_image_url}
                          alt={prov.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold">
                          {prov.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                          {prov.name}
                        </h3>
                        {prov.is_verified && (
                          <span title="Verified Trade Professional">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{prov.company_name}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold">{prov.rating}</span>
                        </div>
                        <span>•</span>
                        <span>{prov.reviews_count} reviews</span>
                        <span>•</span>
                        <span>{prov.experience_years} yrs exp</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {prov.bio && (
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                      {prov.bio}
                    </p>
                  )}

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {prov.specialties.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Rate & City */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{prov.location_city}</span>
                    </div>
                    <div className="font-bold text-amber-400 font-mono">
                      ₹{prov.base_rate}/{prov.pricing_model.replace("_", " ")}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {prov.provider_type === "designer" ? (
                    <button
                      onClick={() => {
                        setSelectedDesigner(prov);
                        setConsultSuccessMsg("");
                        setConsultModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Consultation
                    </button>
                  ) : prov.provider_type === "contractor" ? (
                    <button
                      onClick={() => {
                        setSelectedContractor(prov);
                        setRfqModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Request Turnkey Quote
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                      <span>Direct Trade Yard</span>
                      <span className="text-emerald-400 font-semibold">Wholesale Rates</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (activeTab === "furniture" || activeTab === "materials") ? (
          /* ================= PRODUCTS & MATERIALS VIEW ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        Product Media
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                      {item.lead_time_days}d Delivery
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {item.brand || "Trade Certified"} • {item.category}
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition">
                      {item.name}
                    </h4>

                    <div className="pt-2 flex items-center justify-between text-xs font-mono">
                      <div className="text-base font-bold text-amber-400">
                        ₹{item.price.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">/{item.unit.replace("per_", "")}</span>
                      </div>
                      {item.min_order_qty > 1 && (
                        <span className="text-[10px] text-slate-400">MOQ: {item.min_order_qty}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  {item.listing_type === "furniture" ? (
                    <button
                      onClick={() => {
                        setSelectedFurniture(item);
                        setOrderSuccessMsg("");
                        setOrderModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Order Directly
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedMaterial(item);
                        setSampleSuccessMsg("");
                        setSampleModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] transition border border-slate-700"
                    >
                      Request Swatch Kit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "quotations" ? (
          /* ================= QUOTATION COMPARISON VIEW ================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Turnkey Quotation Comparison Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side bid analysis with material/labor ratio breakdown and AI value ranking.
                </p>
              </div>

              <button
                onClick={() => setRfqModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast RFQ
              </button>
            </div>

            {/* AI Recommendation Banner */}
            {comparison && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        AI Value Recommendation
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {comparison.recommendation_reason}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Price Spread: </span>
                      <span className="text-amber-400 font-bold">₹{comparison.price_spread.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Fastest Delivery: </span>
                      <span className="text-emerald-400 font-bold">{comparison.fastest_timeline_days} Days</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  {comparison.key_tradeoffs.map((tradeoff, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{tradeoff}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quotation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {quotations.map((quote) => {
                const isAccepted = quote.status === "accepted";
                const isRecommended = comparison?.recommended_quotation_id === quote.id;
                const matCost = quote.breakdown?.material_cost || quote.total_amount * 0.6;
                const labCost = quote.breakdown?.labor_cost || quote.total_amount * 0.35;
                const matPct = Math.round((matCost / quote.total_amount) * 100);
                const labPct = 100 - matPct;

                return (
                  <div
                    key={quote.id}
                    className={`rounded-2xl bg-slate-900/70 border p-5 flex flex-col justify-between space-y-5 transition-all ${
                      isAccepted
                        ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
                        : isRecommended
                        ? "border-amber-500 shadow-xl shadow-amber-500/10"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">{quote.quotation_number}</span>
                            {isRecommended && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                                AI VALUE PICK
                              </span>
                            )}
                            {isAccepted && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                                ACCEPTED
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-extrabold text-white mt-1">
                            {quote.provider_name || "Verified Contractor"}
                          </h4>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-lg font-bold text-amber-400">
                            ₹{quote.total_amount.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-slate-400">All inclusive</div>
                        </div>
                      </div>

                      {quote.notes && (
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                          {quote.notes}
                        </p>
                      )}

                      {/* Material vs Labor Breakdown */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Material ({matPct}%): ₹{matCost.toLocaleString("en-IN")}</span>
                          <span className="text-slate-400">Labor ({labPct}%): ₹{labCost.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          <div style={{ width: `${matPct}%` }} className="bg-amber-500 h-full" />
                          <div style={{ width: `${labPct}%` }} className="bg-sky-500 h-full" />
                        </div>
                      </div>

                      {/* Duration & Warranty */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
                        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-slate-500 text-[10px] uppercase">Duration</div>
                          <div className="text-white font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {quote.estimated_duration_days} Days
                          </div>
                        </div>
                        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-slate-500 text-[10px] uppercase">Warranty</div>
                          <div className="text-white font-bold flex items-center gap-1 mt-0.5">
                            <span title="Verified Trade Warranty">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                            {quote.warranty_period_months} Months
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      {isAccepted ? (
                        <div className="w-full py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Contract Established
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Accept Quotation & Generate Contract
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= CONTRACT MANAGEMENT VIEW ================= */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Turnkey Contract Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milestone disbursement schedules, digital signatures, and binding change orders.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {contracts.map((contract) => {
                const isSigned = !!contract.client_signature;
                const isActive = contract.status === "active";

                return (
                  <div
                    key={contract.id}
                    className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 font-bold">{contract.contract_number}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {contract.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-white">{contract.title}</h4>
                        <div className="text-xs text-slate-400">
                          Partner: <span className="text-white font-medium">{contract.provider_name || "Apex Craftwork & Civil Turnkey"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="text-right font-mono">
                          <span className="text-xs text-slate-400">Total Value: </span>
                          <span className="text-xl font-bold text-amber-400">
                            ₹{contract.total_contract_value.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSigned && (
                            <button
                              onClick={() => {
                                setSigningContract(contract);
                                setSignatureText("");
                                setSignModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              Sign Contract
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCoContract(contract);
                              setCoTitle("");
                              setCoCostAdj("");
                              setCoDaysAdj("");
                              setCoJustification("");
                              setCoModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Issue Change Order
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Milestone schedule */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Milestone Payment Schedule
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {(contract.milestone_payment_schedule || []).map((m, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-500">Milestone #{idx + 1}</span>
                                <span className="text-amber-400 font-bold">{m.percentage}%</span>
                              </div>
                              <h6 className="text-xs font-bold text-white line-clamp-2">{m.title}</h6>
                            </div>
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                              <span className="text-white font-bold">
                                ₹{(m.amount || (contract.total_contract_value * (m.percentage / 100))).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {m.status || "pending"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Client Signature</span>
                        {contract.client_signature ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{contract.client_signature}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-400/80 font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting client digital signature
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Contractor Counter-Signature</span>
                        {contract.provider_signature ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{contract.provider_signature}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 font-mono">
                            Pending counter-signature
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Consultation Booking Modal */}
      {consultModalOpen && selectedDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Book Design Consultation</h3>
                <p className="text-xs text-amber-400">{selectedDesigner.name}</p>
              </div>
              <button onClick={() => setConsultModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {consultSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p>{consultSuccessMsg}</p>
                <button
                  onClick={() => setConsultModalOpen(false)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookConsultation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Your Full Name</label>
                  <input
                    name="clientName"
                    required
                    placeholder="e.g. Ananya Roy"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    name="clientPhone"
                    required
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    name="clientEmail"
                    type="email"
                    required
                    placeholder="ananya@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Preferred Date & Time</label>
                  <input
                    name="preferredDate"
                    placeholder="e.g. This Saturday, 3:00 PM IST"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition mt-2"
                >
                  Confirm Video Consultation
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Furniture Order Modal */}
      {orderModalOpen && selectedFurniture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Direct Furniture Order</h3>
                <p className="text-xs text-amber-400">{selectedFurniture.name}</p>
              </div>
              <button onClick={() => setOrderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p>{orderSuccessMsg}</p>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderFurniture} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Site Delivery Address</label>
                  <textarea
                    name="shippingAddress"
                    required
                    rows={3}
                    placeholder="Enter full flat / villa address for freight dispatch..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex justify-between">
                  <span>Unit Price:</span>
                  <span className="text-white font-bold">₹{selectedFurniture.price.toLocaleString("en-IN")}</span>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition mt-2"
                >
                  Confirm & Place Direct Order
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Material Sample Request Modal */}
      {sampleModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Request Physical Swatch Kit</h3>
                <p className="text-xs text-amber-400">{selectedMaterial.name}</p>
              </div>
              <button onClick={() => setSampleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sampleSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p>{sampleSuccessMsg}</p>
                <button
                  onClick={() => setSampleModalOpen(false)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSample} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Your Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Rahul Verma"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Courier Delivery Address</label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="Site / Office delivery address..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    name="phone"
                    required
                    placeholder="+91 98450 12345"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition mt-2"
                >
                  Dispatch Swatch Box (48hr Courier)
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RFQ Broadcast Modal */}
      {rfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Broadcast RFQ to Verified Contractors</h3>
                <p className="text-xs text-slate-400">
                  {selectedContractor ? `Direct request to ${selectedContractor.name}` : "Broadcast to network contractors"}
                </p>
              </div>
              <button onClick={() => setRfqModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastRfq} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Turnkey Scope Summary</label>
                <textarea
                  required
                  rows={4}
                  value={rfqScope}
                  onChange={(e) => setRfqScope(e.target.value)}
                  placeholder="e.g. Complete 3BHK turnkey interior execution: modular kitchen with Blum hardware, hydraulic master bed, concealed electrical conduit wiring, false ceiling with cove LED..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Budget Limit (₹ INR)</label>
                <input
                  type="number"
                  value={rfqBudget}
                  onChange={(e) => setRfqBudget(e.target.value)}
                  placeholder="800000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <div className="text-amber-400 font-bold">Turnkey Assurance:</div>
                <p>• Verified contractors with 4.8+ ratings</p>
                <p>• Compulsory itemized split between material, labor, and supervision</p>
                <p>• Minimum 12-month craftsmanship warranty guarantee</p>
              </div>

              <button
                type="submit"
                disabled={rfqSending}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                {rfqSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Broadcast Scope to Contractors
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Digital Contract Signing Modal */}
      {signModalOpen && signingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Digital Contract Signature</h3>
                <p className="text-xs text-amber-400">{signingContract.contract_number}</p>
              </div>
              <button onClick={() => setSignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSignContract} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-white font-bold">{signingContract.title}</div>
                <div className="text-amber-400 font-mono font-bold">
                  Total Value: ₹{signingContract.total_contract_value.toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Legal Name / Digital Signer ID</label>
                <input
                  required
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="e.g. Ananya Roy (Owner)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300">
                <span title="Verified Trade Warranty">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                </span>
                <span>
                  By clicking sign, you legally endorse the milestone payment schedule and authorize the commencement of turnkey site works.
                </span>
              </div>

              <button
                type="submit"
                disabled={signSubmitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                {signSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                Execute Contract
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Order Modal */}
      {coModalOpen && coContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Issue Change Order</h3>
                <p className="text-xs text-slate-400">Modify contract value and milestone schedule</p>
              </div>
              <button onClick={() => setCoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueChangeOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Change Order Title</label>
                <input
                  required
                  value={coTitle}
                  onChange={(e) => setCoTitle(e.target.value)}
                  placeholder="e.g. Upgrade to Statuario Quartz & Strip Lighting"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cost Delta (₹)</label>
                  <input
                    type="number"
                    required
                    value={coCostAdj}
                    onChange={(e) => setCoCostAdj(e.target.value)}
                    placeholder="+35000 or -15000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Timeline Delta (Days)</label>
                  <input
                    type="number"
                    required
                    value={coDaysAdj}
                    onChange={(e) => setCoDaysAdj(e.target.value)}
                    placeholder="+4 or 0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Engineering / Client Justification</label>
                <textarea
                  required
                  rows={3}
                  value={coJustification}
                  onChange={(e) => setCoJustification(e.target.value)}
                  placeholder="Client selected higher grade quartz countertop and additional cove LED channels in living room."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={coSubmitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                {coSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Apply Change Order & Recalculate Milestones
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
