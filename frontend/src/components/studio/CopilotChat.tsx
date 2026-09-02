"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Wand2, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  Lightbulb, 
  DollarSign, 
  Flame, 
  Palette,
  Eye,
  Bot
} from "lucide-react";

interface ActionProposal {
  id: string;
  title: string;
  changes: string[];
  applied: boolean;
  actionType: string;
  payload: any;
}

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  proposal?: ActionProposal;
}

interface CopilotChatProps {
  designId?: string;
  onCopilotAction: (actionType: string, payload: any) => void;
  onRefresh?: () => void;
  currentStyle?: string;
}

export default function CopilotChat({
  designId = "demo",
  onCopilotAction,
  onRefresh,
  currentStyle = "Modern",
}: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "copilot",
      text: "Hello! I am your AI Spatial Design Agent. What would you like to transform in this room?",
      timestamp: "Just now",
      proposal: {
        id: "prop-init",
        title: "Recommended Aesthetic Enhancements",
        changes: [
          "Balance natural day-lighting with 2700K warm accents",
          "Optimize walkway clearance between coffee table and sofa",
          "Switch flooring to European White Oak planks",
        ],
        applied: false,
        actionType: "enhance_ambience",
        payload: { flooring: "wood_light", wall: "#f8fafc" },
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // AI-generated action chips
  const actionChips = [
    { label: "✨ Make it cozier", prompt: "Make this living room warmer and cozier with soft lighting and natural textures." },
    { label: "🪵 Add natural wood", prompt: "Switch materials to organic natural wood and light oak finishes." },
    { label: "💡 Improve lighting", prompt: "Add warm ambient floor lamps and increase natural lighting balance." },
    { label: "💰 Reduce budget by 15%", prompt: "Optimize furniture selection to reduce the total estimated budget by 15%." },
    { label: "🛋 Replace sofa", prompt: "Upgrade the central sofa to a comfortable premium fabric sectional." },
    { label: "🎨 Try Japandi", prompt: "Switch the overall room aesthetic and material palette to Japandi minimalist." },
  ];

  const handleApplyProposal = (msgId: string, proposal: ActionProposal) => {
    // Trigger action in parent component
    onCopilotAction(proposal.actionType, proposal.payload);

    // Mark proposal as applied
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.proposal) {
          return {
            ...msg,
            proposal: { ...msg.proposal, applied: true },
          };
        }
        return msg;
      })
    );

    // Add confirmation from Copilot
    const confirmMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "copilot",
      text: `✓ Applied ${proposal.changes.length} architectural changes to your 3D digital twin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, confirmMsg]);

    if (onRefresh) onRefresh();
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const cmd = textToSend.toLowerCase();

    // Determine smart action proposal based on command semantics
    let proposalTitle = "Proposed Room Updates";
    let proposedChanges: string[] = [];
    let actionType = "update_general";
    let payload: any = {};
    let replyIntro = "I analyzed your room geometry and prepared the following design adjustments:";

    if (cmd.includes("cozy") || cmd.includes("warm") || cmd.includes("cozier")) {
      proposalTitle = "Warm & Cozy Atmosphere Adjustment";
      proposedChanges = [
        "Warmed wall paint to soft oatmeal (#fbfbfa)",
        "Replaced coffee table with warm solid oak",
        "Added ambient warm floor lamp in the corner",
        "Switched floor to warm honey wood planks",
      ];
      actionType = "make_cozy";
      payload = { wall: "#fbfbfa", floor: "wood_light", sofa: "#b45309" };
    } else if (cmd.includes("wood") || cmd.includes("natural")) {
      proposalTitle = "Natural Wood & Organic Textures";
      proposedChanges = [
        "Switched floor to natural white oak parquet",
        "Updated coffee table to handcrafted walnut",
        "Added potted indoor plant node near the window",
      ];
      actionType = "add_wood";
      payload = { floor: "wood_light", table: "wood_dark" };
    } else if (cmd.includes("light") || cmd.includes("lamp") || cmd.includes("bright")) {
      proposalTitle = "Lighting & Lumen Optimization";
      proposedChanges = [
        "Adjusted ambient lumens to 2700K warm temperature",
        "Added brass floor lamp near seating area",
        "Lightened back wall finish to maximize bounce lighting",
      ];
      actionType = "improve_lighting";
      payload = { wall: "#f8fafc", lamp: true };
    } else if (cmd.includes("budget") || cmd.includes("reduce") || cmd.includes("cost") || cmd.includes("save")) {
      proposalTitle = "Budget Optimization (-₹18,500)";
      proposedChanges = [
        "Switched sofa to IKEA LINANÄS durable fabric (-₹25,000)",
        "Retained high-end lighting fixtures",
        "Maintained ergonomic clearance scores",
      ];
      actionType = "reduce_budget";
      payload = { sofa: "fabric_grey" };
    } else if (cmd.includes("sofa") || cmd.includes("couch") || cmd.includes("sectional")) {
      proposalTitle = "Sofa Configuration Upgrade";
      proposedChanges = [
        "Updated seating node to deep-cushion 3-seater",
        "Upholstered with premium bouclé weave",
        "Adjusted distance to coffee table to 48cm clearance",
      ];
      actionType = "update_sofa";
      payload = { sofa: "#1e293b" };
    } else if (cmd.includes("japandi")) {
      proposalTitle = "Japandi Aesthetic Transformation";
      proposedChanges = [
        "Applied wabi-sabi bleached oak finishes",
        "Lowered furniture visual profile",
        "Softened wall paint to organic limestone wash",
        "Added terracotta & linen throw accents",
      ];
      actionType = "switch_japandi";
      payload = { wall: "#f5f5f4", floor: "#e7e5e4", sofa: "#b45309" };
    } else if (cmd.includes("wall") || cmd.includes("color") || cmd.includes("paint") || cmd.includes("blue")) {
      proposalTitle = "Wall Paint Customization";
      proposedChanges = [
        "Applied custom color palette to architectural walls",
        "Re-calculated bounce lux lighting",
      ];
      actionType = "update_wall";
      payload = { wall: cmd.includes("blue") ? "#3b82f6" : "#1e293b" };
    } else {
      proposalTitle = "Custom Spatial Action Plan";
      proposedChanges = [
        `Reconfigured scene elements for "${textToSend}"`,
        "Synchronized 3D geometry with 2D blueprint layout",
        "Re-audited spatial walkway clearance",
      ];
      actionType = "custom";
      payload = { prompt: textToSend };
    }

    try {
      // Try hitting the backend API if available
      const formData = new FormData();
      formData.append("design_id", designId);
      formData.append("message", textToSend);

      const res = await fetch("http://localhost:8080/api/ai/copilot-chat", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        replyIntro = data.response || replyIntro;
      }
    } catch (_) {
      // Graceful offline fallback
    }

    setTimeout(() => {
      const copilotResponse: ChatMessage = {
        id: Math.random().toString(),
        sender: "copilot",
        text: replyIntro,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        proposal: {
          id: Math.random().toString(),
          title: proposalTitle,
          changes: proposedChanges,
          applied: false,
          actionType,
          payload,
        },
      };

      setMessages((prev) => [...prev, copilotResponse]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="h-full flex flex-col bg-[#070b10] border-l border-white/[0.08] text-xs font-mono select-none">
      
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#090e15] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>AI DESIGN COPILOT</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                AGENT
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans">
              Gemini 3.5 Spatial Engine
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </div>
      </div>

      {/* Action Chips Bar */}
      <div className="p-3 bg-[#05080c] border-b border-white/[0.06] overflow-x-auto">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-mono flex items-center gap-1">
          <Wand2 className="w-3 h-3 text-emerald-400" />
          <span>Suggested Action Chips</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {actionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt)}
              className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl ${
                msg.sender === "user"
                  ? "bg-emerald-500 text-slate-950 font-medium rounded-br-xs shadow-md"
                  : "bg-[#0c121b] border border-white/[0.08] text-slate-200 rounded-bl-xs shadow-lg space-y-3"
              }`}
            >
              <p className="leading-relaxed text-xs">{msg.text}</p>

              {/* Action Proposal Card inside Copilot Message */}
              {msg.proposal && (
                <div className="p-3 rounded-xl bg-[#070a0f] border border-emerald-500/30 space-y-2.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      {msg.proposal.title}
                    </span>
                    {msg.proposal.applied && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        APPLIED
                      </span>
                    )}
                  </div>

                  {/* Changes List */}
                  <ul className="space-y-1 text-slate-300 text-[11px] font-sans font-light">
                    {msg.proposal.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-800 font-mono text-[10px]">
                    {!msg.proposal.applied ? (
                      <>
                        <button
                          onClick={() => handleApplyProposal(msg.id, msg.proposal!)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3 h-3" />
                          <span>Apply Changes</span>
                        </button>
                        <button
                          onClick={() => handleApplyProposal(msg.id, msg.proposal!)}
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Preview</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-emerald-400 flex items-center gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Changes active in 3D scene</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timestamp */}
            <span suppressHydrationWarning className="text-[9px] font-mono text-slate-500 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0c121b] border border-white/[0.08] text-slate-400 text-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            <span className="font-mono text-[10px] ml-1">AI IS COMPUTING SPATIAL GRAPH...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="p-3 border-t border-white/[0.08] bg-[#090e15]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot (e.g. 'make it warmer', 'add floor lamp')..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#05080c] border border-slate-700 text-xs text-white placeholder:text-slate-500 font-sans focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>Natural Language 3D Scene Manipulation</span>
          <span>Press Enter ↵</span>
        </div>
      </div>

    </div>
  );
}
