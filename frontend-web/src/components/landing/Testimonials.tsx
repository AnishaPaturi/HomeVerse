"use client";

import React from "react";
import { Star, Quote, CheckCircle2, MapPin } from "lucide-react";

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: "Priya & Rohan Sharma",
      role: "Homeowners",
      location: "Whitefield, Bangalore",
      property: "3BHK Duplex Penthouse",
      budget: "₹34 Lakhs Budget Locked",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      rating: 5,
      content:
        "The live budget delta simulator was an absolute game changer. We wanted Italian marble in the living room, and HomeVerse instantly showed us we could offset it by choosing premium matte laminates in the guest room. Zero contractor surprises!",
    },
    {
      name: "Ar. Vikramaditya Sen",
      role: "Principal Architect, Studio Sen",
      location: "Bandra West, Mumbai",
      property: "Luxury Residential Practice",
      budget: "12 Client Projects Modeled",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
      rating: 5,
      content:
        "We used to spend 3 weeks generating client 3D views. With HomeVerse, we upload our AutoCAD layouts, let the Gemini engine isolate dimensions, and present a fully interactive Three.js 3D space in client meetings. Revision rounds dropped by 70%.",
    },
    {
      name: "Ananya Nambiar",
      role: "Villa Owner",
      location: "Jubilee Hills, Hyderabad",
      property: "4-Level Independent Villa",
      budget: "₹82 Lakhs Turnkey Project",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      rating: 5,
      content:
        "Being able to walk through our 4 floors in first-person 3D on my laptop and then open the exact same scene on my phone at the construction site gave us complete peace of mind. Every single electrical switch and wardrobe clearance was spot on.",
    },
    {
      name: "Karthik Venkatesh",
      role: "First-Time Home Buyer",
      location: "OMR, Chennai",
      property: "2.5 BHK Apartment",
      budget: "₹18 Lakhs Strict Envelope",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
      rating: 5,
      content:
        "I was terrified of contractor horror stories where the final bill is 40% higher than the quote. HomeVerse generated the exact Bill of Materials with local Indian vendor rates. My contractor signed off on the exact numbers.",
    },
  ];

  return (
    <section id="testimonials" className="py-24 px-6 lg:px-12 bg-[#070b10] relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Quote className="w-3.5 h-3.5" />
            <span>REAL HOMES · REAL BUDGETS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-editorial">
            Loved By 2,800+ Indian Homeowners & Architects
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Read how families and top architecture studios take the stress out of spatial design and budget control.
          </p>
        </div>

        {/* 4 Testimonial Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="glass-morphism rounded-3xl p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-emerald-500/40 transition-all duration-300 relative group"
            >
              {/* Star Rating & Budget Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-emerald-400">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{r.budget}</span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed italic">
                "{r.content}"
              </p>

              {/* User Bio */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center gap-4">
                <img
                  src={r.image}
                  alt={r.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30"
                />
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-sm">
                    {r.name}
                  </div>
                  <div className="text-xs text-slate-400 font-light">
                    {r.role} · {r.property}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400/90 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{r.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
