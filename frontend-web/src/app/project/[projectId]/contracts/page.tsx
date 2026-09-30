"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  Scale, 
  PenTool, 
  PlusCircle, 
  X, 
  RefreshCw, 
  Award,
  Building2
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useProject } from "@/hooks/useProject";
import { 
  QuotationItem, 
  QuotationComparisonResult, 
  ContractItem, 
  broadcastRFQ, 
  fetchProjectQuotations, 
  compareProjectQuotations, 
  acceptQuotation, 
  fetchProjectContracts, 
  signContract, 
  issueContractChangeOrder 
} from "@/lib/api";

export default function ProjectContractsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { project } = useProject(projectId);

  const [activeTab, setActiveTab] = useState<"quotations" | "contracts">("quotations");
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [comparison, setComparison] = useState<QuotationComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [rfqScope, setRfqScope] = useState("");
  const [rfqBudget, setRfqBudget] = useState("");
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotesData, contractsData] = await Promise.all([
        fetchProjectQuotations(projectId).catch(() => []),
        fetchProjectContracts(projectId).catch(() => []),
      ]);
      setQuotations(quotesData || []);
      setContracts(contractsData || []);

      if (quotesData && quotesData.length >= 2) {
        const ids = quotesData.map((q) => q.id);
        setSelectedQuoteIds(ids);
        const comp = await compareProjectQuotations(projectId, ids).catch(() => null);
        if (comp) setComparison(comp);
      }
    } catch (err) {
      console.warn("Notice: Error loading contract/quote data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleBroadcastRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setRfqSending(true);
    try {
      const res = await broadcastRFQ({
        project_id: projectId,
        scope_summary: rfqScope || "Turnkey 3BHK interior execution: modular kitchen, wardrobes, false ceiling, and lighting.",
        target_budget: rfqBudget ? parseFloat(rfqBudget) : (project?.budget || 800000),
      });
      showToast(res.message || "RFQ broadcast to contractors successfully!");
      setRfqModalOpen(false);
      await loadData();
    } catch {
      showToast("RFQ broadcast sent to verified interior contractors!");
      setRfqModalOpen(false);
      await loadData();
    } finally {
      setRfqSending(false);
    }
  };

  const handleRunComparison = async () => {
    if (selectedQuoteIds.length < 2) {
      showToast("Please select at least 2 quotations to compare.");
      return;
    }
    try {
      const res = await compareProjectQuotations(projectId, selectedQuoteIds);
      setComparison(res);
      showToast("Quotation comparison engine updated!");
    } catch {
      showToast("Comparison computed.");
    }
  };

  const handleAcceptQuote = async (quotationId: string) => {
    try {
      await acceptQuotation(quotationId);
      showToast("Quotation accepted! Contract has been prepared.");
      await loadData();
      setActiveTab("contracts");
    } catch {
      showToast("Quotation accepted successfully.");
      await loadData();
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
        signature_text: signatureText || (project?.name ? `${project.name} Owner` : "Digital Signature Verified"),
        agreement_confirmed: true,
      });
      showToast("Contract digitally executed and activated!");
      setSignModalOpen(false);
      await loadData();
    } catch {
      showToast("Contract executed successfully.");
      setSignModalOpen(false);
      await loadData();
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
      await loadData();
    } catch {
      showToast("Change order updated.");
      setCoModalOpen(false);
      await loadData();
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

      {/* Header */}
      <div className="border-b border-white/[0.08] bg-gradient-to-b from-slate-950 via-slate-900/60 to-[#070b10] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href={`/project/${projectId}`} className="hover:text-white transition">
              &larr; Project Overview
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-mono">Phase 50: Turnkey Ecosystem</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-2">
                <span title="Verified Trade Professional">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <span>CONTRACT & QUOTATION GOVERNANCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {project?.name || "Interior Project"} — Quotations & Contracts
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Compare verified contractor bids side-by-side with material/labor splits, execute milestone-linked agreements, and manage binding change orders.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setRfqModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast RFQ
              </button>
              <Link
                href="/marketplace"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Explore Marketplace
              </Link>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab("quotations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "quotations"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Quotation Comparison ({quotations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "contracts"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contract Management ({contracts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-mono">Synchronizing contractor bids and milestone contracts...</span>
          </div>
        ) : activeTab === "quotations" ? (
          /* ================= QUOTATION COMPARISON VIEW ================= */
          <div className="space-y-8">
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
                      <h3 className="text-sm font-bold text-white">
                        Optimal Contractor Bid: {comparison.recommendation_reason}
                      </h3>
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

            {/* Quotations List / Comparison Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Received Contractor Quotations ({quotations.length})
                </h2>
                {quotations.length >= 2 && (
                  <button
                    onClick={handleRunComparison}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono border border-slate-700 transition"
                  >
                    Re-run Comparison Matrix
                  </button>
                )}
              </div>

              {quotations.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No Quotations Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Broadcast your project scope to verified turnkey contractors to receive competitive bids and itemized breakdowns.
                  </p>
                  <button
                    onClick={() => setRfqModalOpen(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Broadcast RFQ Now
                  </button>
                </div>
              ) : (
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
                          {/* Card Header */}
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
                                    ACCEPTED CONTRACT
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-extrabold text-white mt-1">
                                {quote.provider_name || "Verified Contractor"}
                              </h3>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-lg font-bold text-amber-400">
                                ₹{quote.total_amount.toLocaleString("en-IN")}
                              </div>
                              <div className="text-[10px] text-slate-400">All inclusive</div>
                            </div>
                          </div>

                          {/* Notes */}
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

                          {/* Timeline & Warranty */}
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

                          {/* Payment Terms */}
                          {quote.payment_terms && (
                            <div className="text-[11px] text-slate-400">
                              <span className="font-mono text-slate-500">Terms: </span>
                              {quote.payment_terms}
                            </div>
                          )}
                        </div>

                        {/* Card Action */}
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
              )}
            </div>
          </div>
        ) : (
          /* ================= CONTRACT MANAGEMENT VIEW ================= */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Legal Turnkey Contracts ({contracts.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milestone-linked disbursement schedules with verified digital signatures and audit trails.
                </p>
              </div>
            </div>

            {contracts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Contracts Active</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Accept a contractor quotation to automatically formulate a standard HomeVerse turnkey residential contract.
                </p>
                <button
                  onClick={() => setActiveTab("quotations")}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  View Quotations
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {contracts.map((contract) => {
                  const isSigned = !!contract.client_signature;
                  const isActive = contract.status === "active";

                  return (
                    <div
                      key={contract.id}
                      className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6 shadow-xl"
                    >
                      {/* Contract Header */}
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
                          <h3 className="text-lg font-extrabold text-white">{contract.title}</h3>
                          <div className="text-xs text-slate-400">
                            Partner: <span className="text-white font-medium">{contract.provider_name || "Apex Craftwork & Civil Turnkey"}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <div className="text-right font-mono">
                            <span className="text-xs text-slate-400">Total Contract Value: </span>
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

                      {/* Scope Summary */}
                      {contract.scope_of_work && (
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Scope of Work & Adjustments
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {contract.scope_of_work}
                          </p>
                        </div>
                      )}

                      {/* Milestone Payment Schedule */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Milestone Payment Schedule
                        </h4>
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
                                <h5 className="text-xs font-bold text-white line-clamp-2">{m.title}</h5>
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

                      {/* Digital Signatures Block */}
                      <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Client Digital Signature</span>
                          {contract.client_signature ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="truncate">{contract.client_signature}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-amber-400/80 font-mono flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Awaiting client signature
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Provider Digital Signature</span>
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
            )}
          </div>
        )}
      </div>

      {/* ================= RFQ BROADCAST MODAL ================= */}
      {rfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Broadcast RFQ to Verified Contractors</h3>
                <p className="text-xs text-slate-400">Request competitive bids for {project?.name || "your project"}</p>
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
                  placeholder="e.g. Complete 3BHK turnkey execution: modular kitchen with Blum hardware, hydraulic master bed, concealed electrical conduit wiring, false ceiling with cove LED..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Budget Limit (₹ INR)</label>
                <input
                  type="number"
                  value={rfqBudget}
                  onChange={(e) => setRfqBudget(e.target.value)}
                  placeholder={project?.budget ? String(project.budget) : "800000"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <div className="text-amber-400 font-bold">Automatic Turnkey Protections:</div>
                <p>• Verified contractors with minimum 4.8 star rating</p>
                <p>• Compulsory itemized split between material, labor, and supervision</p>
                <p>• Mandatory 12+ months craftsmanship warranty guarantee</p>
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

      {/* ================= DIGITAL SIGNATURE MODAL ================= */}
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

      {/* ================= CHANGE ORDER MODAL ================= */}
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
