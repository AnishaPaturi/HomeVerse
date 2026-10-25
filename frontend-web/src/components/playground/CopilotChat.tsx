"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Wand2, 
  Check, 
  ArrowRight, 
  Lightbulb, 
  DollarSign, 
  Palette,
  Eye,
  Bot,
  Layers,
  TrendingDown,
} from "lucide-react";
import {
  UnifiedSceneState,
  ActionProposal,
  classifyUnifiedIntent,
  getStylePreset,
} from "@/lib/playgroundOrchestrator";

export interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  proposal?: ActionProposal;
}

export interface CopilotChatProps {
  designId?: string;
  onCopilotAction: (actionType: string, payload: any) => void;
  onRefresh?: () => void;
  currentStyle?: string;
  roomPhotosCount?: number;

  // Shared Orchestrator Props
  sharedSceneState?: UnifiedSceneState;
  onApplyProposal?: (proposal: ActionProposal) => void;
  incomingProposalTrigger?: {
    prompt: string;
    proposal: ActionProposal;
    timestamp: number;
  } | null;
}

export default function CopilotChat({
  designId = "demo",
  onCopilotAction,
  onRefresh,
  currentStyle = "Japandi",
  roomPhotosCount = 0,
  sharedSceneState,
  onApplyProposal,
  incomingProposalTrigger,
}: CopilotChatProps) {
  const activeStyle = sharedSceneState?.style || currentStyle || "Japandi";
  const activePreset = getStylePreset(activeStyle);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "copilot",
      text: `Hello! I am your AI Spatial Design Copilot connected to the Unified Orchestrator. What would you like to plan, analyze, or optimize for your ${activeStyle} space?`,
      timestamp: "Just now",
      proposal: {
        id: "prop-init",
        title: `Recommended ${activeStyle} Architectural Baseline`,
        changes: [
          `Synchronize surfaces with authentic ${activeStyle} aesthetics (${activePreset.wallName})`,
          "Balance natural day-lighting with 2700K warm ambient accents",
          "Optimize walkway clearance between coffee table and primary seating",
        ],
        applied: false,
        actionType: "enhance_ambience",
        payload: { flooring: activePreset.floorMaterial, wall: activePreset.wallColor },
        costImpact: {
          before: sharedSceneState?.budget.spentAmount || 315000,
          after: sharedSceneState?.budget.spentAmount || 315000,
          delta: 0,
        },
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Synchronize when AURA routes a voice-initiated proposal to Copilot
  useEffect(() => {
    if (incomingProposalTrigger?.proposal) {
      const userMsg: ChatMessage = {
        id: `routed-usr-${Date.now()}`,
        sender: "user",
        text: incomingProposalTrigger.prompt,
        timestamp: "via AURA Voice",
      };
      const copilotMsg: ChatMessage = {
        id: `routed-cop-${Date.now()}`,
        sender: "copilot",
        text: `AURA routed your voice request to me. I've prepared a structured proposal with itemized cost and architectural diffs:`,
        timestamp: "Just now",
        proposal: incomingProposalTrigger.proposal,
      };
      setMessages((prev) => [...prev, userMsg, copilotMsg]);
    }
  }, [incomingProposalTrigger]);

  // Action chips dynamically generated from current shared scene state
  const actionChips = [
    {
      label: `💰 Make 15% cheaper (${activeStyle})`,
      prompt: `Can you make this design 15% cheaper without losing the ${activeStyle} look?`,
    },
    ...(roomPhotosCount > 0
      ? [
          {
            label: "📸 Match Step 10 Photo",
            prompt: "Synchronize the 3D room materials, window daylighting, and furniture clearances to match the intake photos captured in Step 10.",
          },
        ]
      : []),
    {
      label: `✨ Enhance ${activeStyle} DNA`,
      prompt: `Refine this room strictly following authentic ${activeStyle} interior architecture.`,
    },
    {
      label: "🪵 Natural Oak Parquet",
      prompt: "Switch materials to organic European white oak parquet.",
    },
    {
      label: "🏛 Switch to Modern Luxury",
      prompt: "Transform this room into Modern Luxury style with Statuario marble and cove lighting.",
    },
    {
      label: "💡 Warm 2700K Lighting",
      prompt: "Adjust scene illumination to warm 2700K ambient lighting.",
    },
  ];

  const handleApplyProposal = (msgId: string, proposal: ActionProposal) => {
    // 1. Delegate to shared orchestrator
    if (onApplyProposal) {
      onApplyProposal(proposal);
    } else {
      onCopilotAction(proposal.actionType, proposal.payload);
    }

    // 2. Mark proposal as applied in local message list
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

    // 3. Add confirmation note from Copilot mentioning AURA's voice announcement
    const confirmMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "copilot",
      text: `✓ Applied ${proposal.changes.length} architectural changes to your 3D digital twin. AURA has announced the updated cost and scene status via voice.`,
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

    const fallbackScene: UnifiedSceneState = sharedSceneState || {
      style: activeStyle,
      walls: { color: activePreset.wallColor, material: activePreset.wallMaterial, name: activePreset.wallName },
      flooring: { material: activePreset.floorMaterial, name: activePreset.floorName, costDelta: activePreset.floorCostDelta },
      lighting: { preset: activePreset.lightingPreset, intensity: 0.8 },
      camera: { view: "3d" },
      budget: { totalBudget: 350000, spentAmount: 315000, remaining: 35000, currency: "INR" },
      actionHistory: [],
    };

    // Classify through Unified Orchestrator
    const intent = classifyUnifiedIntent(textToSend, fallbackScene, "copilot");

    setTimeout(() => {
      let replyIntro = intent.voiceReply || "I analyzed your spatial configuration and prepared the following design adjustments:";
      
      const copilotResponse: ChatMessage = {
        id: Math.random().toString(),
        sender: "copilot",
        text: replyIntro,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        proposal: intent.proposal,
      };

      setMessages((prev) => [...prev, copilotResponse]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#070b10] border-l border-white/[0.08] text-xs font-mono select-none">
      
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#090e15] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>AI DESIGN COPILOT</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                The Brain
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5">
              <span>Unified AI Orchestrator</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-medium">{activeStyle} DNA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {roomPhotosCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              📸 {roomPhotosCount} Photo{roomPhotosCount > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synced</span>
          </div>
        </div>
      </div>

      {/* Shared Orchestrator Scene State & Cross-Assistant Awareness HUD */}
      <div className="px-3.5 py-2.5 bg-[#05080c] border-b border-white/[0.08] text-[10.5px] font-sans">
        <div className="flex items-center justify-between text-slate-400 mb-1.5 font-mono text-[9.5px]">
          <span className="flex items-center gap-1 text-emerald-400 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Shared Scene State
          </span>
          <span className="text-amber-400 font-bold">
            Est. ₹{(sharedSceneState?.budget.spentAmount || 315000).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[9px] uppercase">Style DNA</div>
            <div className="text-slate-200 font-medium truncate">{sharedSceneState?.style || activeStyle}</div>
          </div>
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[9px] uppercase">Wall Finish</div>
            <div className="flex items-center gap-1 text-slate-200 font-medium truncate">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: sharedSceneState?.walls.color || activePreset.wallColor }}
              />
              <span className="truncate">{sharedSceneState?.walls.name || activePreset.wallName}</span>
            </div>
          </div>
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-500 text-[9px] uppercase">Flooring</div>
            <div className="text-slate-200 font-medium truncate">{sharedSceneState?.flooring.name || activePreset.floorName}</div>
          </div>
        </div>

        {sharedSceneState?.lastAction && (
          <div className="mt-2 text-[9.5px] flex items-center gap-1.5 text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <span className="font-mono uppercase font-bold text-amber-400 shrink-0">
              ⚡ {sharedSceneState.lastAction.source === "aura" ? "AURA Voice" : "Copilot"}:
            </span>
            <span className="truncate">{sharedSceneState.lastAction.summary}</span>
          </div>
        )}
      </div>

      {/* Action Chips Bar */}
      <div className="p-2.5 bg-[#05080c] border-b border-white/[0.06] overflow-x-auto">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-mono flex items-center gap-1">
          <Wand2 className="w-3 h-3 text-emerald-400" />
          <span>Recommended Action Proposals</span>
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
              className={`max-w-[92%] p-3.5 rounded-2xl ${
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

                  {/* Cost Impact Diff Preview if present */}
                  {msg.proposal.costImpact && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-400">Budget Impact:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 line-through">₹{msg.proposal.costImpact.before.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-300 font-bold">₹{msg.proposal.costImpact.after.toLocaleString("en-IN")}</span>
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono ${msg.proposal.costImpact.delta < 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {msg.proposal.costImpact.delta < 0 ? `-${Math.abs(msg.proposal.costImpact.percent || 15)}%` : `+₹${msg.proposal.costImpact.delta.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                    </div>
                  )}

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
                      </>
                    ) : (
                      <div className="text-emerald-400 flex items-center gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Changes active in 3D scene • Announced by AURA</span>
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
          className="flex items-center gap-2 bg-[#05080c] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-emerald-500/50 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot (e.g. 'Make this 15% cheaper')..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
