"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  CornerDownLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  Radio,
} from "lucide-react";
import {
  classifyUnifiedIntent,
  UnifiedSceneState,
  ActionProposal,
} from "@/lib/playgroundOrchestrator";

export interface VoiceActionChip {
  label: string;
  action: string;
  target_url?: string;
  promptText?: string;
}

export interface VoiceCommandResponse {
  transcript_received: string;
  voice_reply: string;
  action_type: string;
  action_payload: Record<string, any>;
  action_chips: VoiceActionChip[];
  success: boolean;
}

export interface VoiceAssistantWidgetProps {
  projectId?: string;
  roomId?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onClose?: () => void;
  onWallColorChange?: (colorHex: string, colorName: string) => void;
  onFlooringChange?: (flooringName: string, costDelta: number) => void;
  onCameraChange?: (viewType: "isometric" | "walkthrough" | "top_down") => void;
  onLightingChange?: (preset: "warm" | "neutral" | "luxury") => void;
  onNavigateAction?: (url: string) => void;
  onVoiceCommand?: (
    cmd: string,
    isRelevant?: boolean,
    actionType?: string,
    payload?: any
  ) => void;
  position?: "bottom-left" | "bottom-right";
  className?: string;

  // Shared Orchestrator Props
  sharedSceneState?: UnifiedSceneState;
  onApplyImmediateAction?: (actionType: string, payload: any, summary: string) => void;
  onTriggerProposalRequest?: (prompt: string, proposal: ActionProposal) => void;
  externalSpeechEvent?: { id: string; text: string; source?: "copilot" | "system" } | null;
}

/**
 * Classifies whether a voice or text command represents a relevant room/design change.
 */
export function classifyVoiceCommand(
  transcript: string,
  sceneState?: UnifiedSceneState
): VoiceCommandResponse {
  const defaultScene: UnifiedSceneState = sceneState || {
    style: "Japandi",
    walls: { color: "#EAE5D9", material: "limestone_wash", name: "Limestone Wash" },
    flooring: { material: "wood_light", name: "European Natural Oak", costDelta: 18000 },
    lighting: { preset: "warm", intensity: 0.8 },
    camera: { view: "3d" },
    budget: { totalBudget: 350000, spentAmount: 315000, remaining: 35000, currency: "INR" },
    actionHistory: [],
  };

  const res = classifyUnifiedIntent(transcript, defaultScene, "aura");

  let chips: VoiceActionChip[] = [
    { label: "Change to Japandi style", action: "prompt_sample", promptText: "Change the room to Japandi style" },
    { label: "Make 15% cheaper", action: "prompt_sample", promptText: "Can you make this design 15% cheaper without losing the Japandi look?" },
    { label: "Italian marble floor", action: "prompt_sample", promptText: "Switch flooring to Italian statuario marble" },
    { label: "Top-down blueprint", action: "prompt_sample", promptText: "Show top-down blueprint view" },
  ];

  if (res.actionType === "apply_instant_style") {
    chips = [
      { label: "Make 15% cheaper", action: "prompt_sample", promptText: "Can you make this design 15% cheaper without losing the Japandi look?" },
      { label: "Top-down view", action: "preview_3d", promptText: "Show top-down view" },
      { label: "Warm ambient lighting", action: "prompt_sample", promptText: "Set warm ambient lighting" },
    ];
  } else if (!res.isRelevant) {
    chips = [
      { label: "Try: 'Change to Japandi style'", action: "prompt_sample", promptText: "Change the room to Japandi style" },
      { label: "Try: 'Make this 15% cheaper'", action: "prompt_sample", promptText: "Can you make this design 15% cheaper without losing the Japandi look?" },
      { label: "Try: 'Paint walls warm greige'", action: "prompt_sample", promptText: "Paint walls warm greige" },
      { label: "Try: 'Italian marble floor'", action: "prompt_sample", promptText: "Switch to Italian marble floor" },
    ];
  }

  return {
    transcript_received: transcript,
    voice_reply: res.voiceReply,
    action_type: res.actionType,
    action_payload: res.payload,
    action_chips: chips,
    success: res.success,
  };
}

export default function VoiceAssistantWidget({
  projectId,
  roomId,
  isOpen: isOpenProp,
  defaultOpen = false,
  onClose,
  onWallColorChange,
  onFlooringChange,
  onCameraChange,
  onLightingChange,
  onNavigateAction,
  onVoiceCommand,
  position = "bottom-left",
  className = "",
  sharedSceneState,
  onApplyImmediateAction,
  onTriggerProposalRequest,
  externalSpeechEvent,
}: VoiceAssistantWidgetProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(defaultOpen);
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? isOpenProp : isOpenInternal;

  const handleToggle = () => {
    if (!isControlled) {
      setIsOpenInternal((prev) => !prev);
    } else {
      if (isOpen) {
        onClose?.();
      }
    }
  };

  const handleClose = () => {
    if (!isControlled) {
      setIsOpenInternal(false);
    }
    onClose?.();
  };

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [lastResponse, setLastResponse] = useState<VoiceCommandResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{
      sender: "user" | "assistant";
      text: string;
      actionType?: string;
      isIgnored?: boolean;
    }>
  >([
    {
      sender: "assistant",
      text: "Hello! I'm AURA, your HomeVerse Voice Copilot. Speak design commands like 'Change room to Japandi style', 'Paint walls warm greige', or 'Switch to Italian marble'.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };
        recognition.onerror = (err: any) => {
          console.warn("Speech recognition notice:", err);
          setIsListening(false);
        };
        recognition.onend = () => {
          setIsListening(false);
          setTranscript((finalTranscript) => {
            if (finalTranscript.trim()) {
              handleSendCommand(finalTranscript);
            }
            return "";
          });
        };
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll chat history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isProcessing]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const speakText = (text: string) => {
    if (ttsMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis notice:", e);
    }
  };

  // Synchronized Voice Announcements triggered by the Shared Orchestrator (e.g. Copilot proposal applied)
  useEffect(() => {
    if (externalSpeechEvent?.text) {
      speakText(externalSpeechEvent.text);
      setHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: `[From AI Design Copilot] ${externalSpeechEvent.text}`,
          actionType: "copilot_proposal_applied",
        },
      ]);
    }
  }, [externalSpeechEvent]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback: simulate voice speech prompt
      const samplePrompts = [
        "Change the room to Japandi style",
        "Make this design 15% cheaper without losing the Japandi look",
        "Paint walls designer warm greige",
        "Switch the flooring to Italian statuario marble",
        "Show me top-down architectural floor plan view",
      ];
      const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
      handleSendCommand(randomPrompt);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setTranscript("");
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition start warning:", e);
      }
    }
  };

  const handleSendCommand = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    const trimmed = queryText.trim();
    setInputQuery("");
    setIsProcessing(true);

    setHistory((prev) => [...prev, { sender: "user", text: trimmed }]);

    const fallbackScene: UnifiedSceneState = sharedSceneState || {
      style: "Japandi",
      walls: { color: "#EAE5D9", material: "limestone_wash", name: "Limestone Wash" },
      flooring: { material: "wood_light", name: "European Natural Oak", costDelta: 18000 },
      lighting: { preset: "warm", intensity: 0.8 },
      camera: { view: "3d" },
      budget: { totalBudget: 350000, spentAmount: 315000, remaining: 35000, currency: "INR" },
      actionHistory: [],
    };

    // Use unified orchestrator intent classifier
    const intent = classifyUnifiedIntent(trimmed, fallbackScene, "aura");

    const isIgnored = !intent.isRelevant || intent.executionMode === "ignored";

    setHistory((prev) => [
      ...prev,
      {
        sender: "assistant",
        text: intent.voiceReply,
        actionType: intent.actionType,
        isIgnored,
      },
    ]);

    // Speak aloud via TTS so the user is informed by voice
    speakText(intent.voiceReply);

    setLastResponse({
      transcript_received: trimmed,
      voice_reply: intent.voiceReply,
      action_type: intent.actionType,
      action_payload: intent.payload,
      action_chips: [
        { label: "Change to Japandi", action: "prompt_sample", promptText: "Change the room to Japandi style" },
        { label: "Make 15% cheaper", action: "prompt_sample", promptText: "Can you make this design 15% cheaper without losing the Japandi look?" },
        { label: "Italian marble floor", action: "prompt_sample", promptText: "Switch flooring to Italian statuario marble" },
        { label: "Top-down view", action: "preview_3d", promptText: "Show top-down blueprint view" },
      ],
      success: intent.success,
    });

    if (isIgnored) {
      onVoiceCommand?.(trimmed, false, "ignored_command", intent.payload);
      setIsProcessing(false);
      return;
    }

    if (intent.executionMode === "immediate") {
      // Execute immediate spatial updates
      if (intent.actionType === "apply_instant_style") {
        onApplyImmediateAction?.("apply_instant_style", intent.payload, intent.summary);
      } else if (intent.actionType === "change_wall_color") {
        onWallColorChange?.(intent.payload.color_hex, intent.payload.color_name || "Custom");
        onApplyImmediateAction?.("change_wall_color", intent.payload, intent.summary);
      } else if (intent.actionType === "change_flooring") {
        onFlooringChange?.(intent.payload.flooring_material, intent.payload.cost_impact || 0);
        onApplyImmediateAction?.("change_flooring", intent.payload, intent.summary);
      } else if (intent.actionType === "switch_camera_view") {
        onCameraChange?.(intent.payload.view_type);
        onApplyImmediateAction?.("switch_camera_view", intent.payload, intent.summary);
      } else if (intent.actionType === "change_lighting") {
        onLightingChange?.(intent.payload.lighting_preset);
        onApplyImmediateAction?.("change_lighting", intent.payload, intent.summary);
      }
      onVoiceCommand?.(trimmed, true, intent.actionType, intent.payload);
    } else if (intent.executionMode === "proposal") {
      // Route complex proposal-based request to AI Design Copilot
      if (intent.proposal && onTriggerProposalRequest) {
        onTriggerProposalRequest(trimmed, intent.proposal);
      }
      onVoiceCommand?.(trimmed, true, intent.actionType, intent.payload);
    }

    setIsProcessing(false);
  };

  const handleChipClick = (chip: VoiceActionChip) => {
    if (chip.promptText) {
      handleSendCommand(chip.promptText);
    } else if (chip.action === "preview_3d") {
      onCameraChange?.("isometric");
    } else if (chip.target_url && onNavigateAction) {
      onNavigateAction(chip.target_url);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* AURA Voice Panel - Displayed when open */}
      {isOpen && (
        <div
          className={`absolute bottom-14 ${
            position === "bottom-right" ? "right-0" : "left-0"
          } z-50 w-[380px] sm:w-[410px] max-w-[calc(100vw-6rem)] rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-amber-500/30 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-1.5 font-sans">
                  AURA
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Unified AI
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Hands & Voice Engine • Synced</div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setTtsMuted(!ttsMuted)}
                title={ttsMuted ? "Unmute Voice" : "Mute Voice"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                {ttsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Minimize AURA"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 p-4 space-y-3.5 max-h-[320px] overflow-y-auto text-xs font-sans">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10"
                      : msg.isIgnored
                      ? "bg-rose-950/40 text-rose-200 border border-rose-500/30 rounded-tl-none"
                      : msg.actionType === "copilot_proposal_applied"
                      ? "bg-emerald-950/40 text-emerald-200 border border-emerald-500/30 rounded-tl-none font-sans"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {isListening && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
                <Mic className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="italic font-mono text-[11px]">
                  {transcript ? `"${transcript}"` : "Listening for design command..."}
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Orchestrating scene mutation...</span>
              </div>
            )}
          </div>

          {/* Action Chips */}
          {lastResponse?.action_chips && lastResponse.action_chips.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50 flex flex-wrap gap-1.5">
              {lastResponse.action_chips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 transition flex items-center gap-1 cursor-pointer"
                >
                  {chip.label}
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Prompt Suggestions */}
          {!lastResponse && (
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex flex-wrap gap-1.5">
              {[
                "Change room to Japandi style",
                "Make this 15% cheaper",
                "Italian marble floor",
                "Top-down blueprint view",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendCommand(prompt)}
                  className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          )}

          {/* Input Controls */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl flex items-center justify-center transition shadow-lg cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white shadow-rose-500/30 animate-pulse ring-2 ring-rose-400/50"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              }`}
              title={isListening ? "Stop listening" : "Click to speak"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand(inputQuery);
              }}
              className="flex-1 flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 focus-within:border-amber-500/60 transition"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Speak or type (e.g. 'Japandi style')..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isProcessing}
                className="text-slate-400 hover:text-amber-400 disabled:opacity-30 transition p-1 cursor-pointer"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating AURA Voice Copilot Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? "Close AURA" : "Open AURA"}
        title={isOpen ? "Close AURA" : "AURA • Click to speak or chat"}
        className={`relative flex items-center gap-2.5 shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95 group select-none ${
          isOpen
            ? "h-12 w-12 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white justify-center shadow-black/60"
            : "h-12 px-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold shadow-amber-500/25 hover:shadow-amber-500/40 border border-amber-300/40"
        } ${isListening ? "ring-4 ring-rose-500/50 animate-pulse" : ""}`}
      >
        {isOpen ? (
          <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <>
            {/* Live pulsating status dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>

            {/* Icon */}
            <div className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-slate-950" />
            </div>

            {/* Label */}
            <span className="font-mono text-xs font-bold tracking-tight">AURA</span>
          </>
        )}

        {/* Listening notification badge when minimized and recording */}
        {isListening && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </button>
    </div>
  );
}
