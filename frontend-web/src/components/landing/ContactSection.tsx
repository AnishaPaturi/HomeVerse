"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Phone, MapPin, Send, CheckCircle2, Clock } from "lucide-react";

export const ContactSection: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "3BHK Apartment",
    budgetRange: "₹25L – ₹50L",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section id="contact" className="py-24 px-6 lg:px-12 bg-[#05080c] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL CONCIERGE & SUPPORT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Speak With Our Spatial Design Advisors
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Need guidance setting up your floor plan, structuring a multi-crore villa budget, or onboarding your architecture studio? We're here to help.
          </p>
        </div>

        {/* 2-Column Contact Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Direct Channels & Atelier Details */}
          <div className="lg:col-span-5 glass-morphism rounded-3xl p-8 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white font-editorial">
                Direct Channels
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                Connect directly with our Bengaluru and Mumbai architecture engineering hubs. Average response time under 15 minutes during business hours.
              </p>

              {/* Channel Items */}
              <div className="space-y-4 pt-2">
                <a
                  href="https://wa.me/918047269900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/40 flex items-center gap-4 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-emerald-400 uppercase">
                      WhatsApp Concierge (Instant)
                    </div>
                    <div className="text-sm font-bold text-white">
                      +91 80 4726 9900
                    </div>
                  </div>
                </a>

                <a
                  href="mailto:concierge@homeverse.ai"
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/40 flex items-center gap-4 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-emerald-400 uppercase">
                      Architectural Inquiries
                    </div>
                    <div className="text-sm font-bold text-white">
                      concierge@homeverse.ai
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Studio Locations */}
            <div className="pt-6 border-t border-white/[0.08] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Operating Hours: Mon–Sat, 9:00 AM – 7:30 PM IST</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bengaluru Hub</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-light">
                    100ft Road, Indiranagar, Bengaluru 560038
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mumbai Atelier</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-light">
                    Bandra Kurla Complex (BKC), Mumbai 400051
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Form */}
          <div className="lg:col-span-7 glass-morphism rounded-3xl p-8 sm:p-10 relative">
            {formSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-12 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-white font-editorial">
                  Inquiry Received With Precision
                </h4>
                <p className="text-sm text-slate-300 font-light max-w-md leading-relaxed">
                  Thank you, <span className="font-semibold text-white">{formData.name || "Homeowner"}</span>. One of our senior spatial architects will review your project details and contact you within 2 hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="text-xs font-mono text-emerald-400 hover:underline pt-2 cursor-pointer"
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white font-editorial">
                    Schedule a 1-on-1 Spatial Consultation
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-1">
                    Tell us about your home and our team will prepare a preliminary 3D spatial & budget preview.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">House Type</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                      className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white bg-[#090e15]"
                    >
                      <option value="2BHK Apartment">2BHK Apartment</option>
                      <option value="3BHK Apartment">3BHK Apartment</option>
                      <option value="4BHK Duplex">4BHK Duplex / Penthouse</option>
                      <option value="Independent Villa">Independent Villa</option>
                      <option value="Commercial Studio">Architecture / Studio Practice</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Target Budget Tier</label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white bg-[#090e15]"
                  >
                    <option value="₹10L – ₹25L">₹10 Lakhs – ₹25 Lakhs (Moderate)</option>
                    <option value="₹25L – ₹50L">₹25 Lakhs – ₹50 Lakhs (Premium)</option>
                    <option value="₹50L – ₹1Cr">₹50 Lakhs – ₹1 Crore (Luxury)</option>
                    <option value="₹1Cr+">₹1 Crore+ (Bespoke Villa)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Project Requirements or Questions</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about your floor plan, key focus rooms, or specific design style preferences..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="glass-morphism-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Spatial Preview & Consultation</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
