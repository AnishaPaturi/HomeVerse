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
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export interface VoiceActionChip {
  label: string;
  action: string;
  target_url?: string;
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
}

/**
 * Classifies whether a voice or text command represents a relevant room/design change.
 * Non-relevant text is strictly ignored and the user is informed with actionable alternatives.
 */
export function classifyVoiceCommand(transcript: string): VoiceCommandResponse {
  const text = transcript.trim();
  const textLower = text.toLowerCase();

  // 1. Wall Color / Paint / Finish
  if (/wall|paint|color|colour|wallpaper|stucco/.test(textLower)) {
    let colorHex = "#D8D0C5";
    let colorName = "Designer Warm Greige";
    if (/greige|warm/.test(textLower)) {
      colorHex = "#D8D0C5";
      colorName = "Designer Warm Greige";
    } else if (/charcoal|dark|black/.test(textLower)) {
      colorHex = "#2C302E";
      colorName = "Studio Charcoal Accent";
    } else if (/white|alabaster/.test(textLower)) {
      colorHex = "#EDEAE0";
      colorName = "Alabaster Architectural White";
    } else if (/sage|green/.test(textLower)) {
      colorHex = "#B2BCA2";
      colorName = "Muted Sage Mineral";
    } else if (/navy|blue/.test(textLower)) {
      colorHex = "#1E293B";
      colorName = "Deep Midnight Navy";
    }
    return {
      transcript_received: text,
      voice_reply: `Applying ${colorName} to walls in your 3D view.`,
      action_type: "change_wall_color",
      action_payload: { color_hex: colorHex, color_name: colorName },
      action_chips: [
        { label: "Preview in 3D", action: "preview_3d" },
        { label: "Compare Finishes", action: "materials" },
      ],
      success: true,
    };
  }

  // 2. Camera View & Blueprint
  if (/view|camera|top-down|top down|walkthrough|isometric|perspective|floor plan|blueprint|bird's eye|overhead/.test(textLower)) {
    let viewType: "isometric" | "walkthrough" | "top_down" = "isometric";
    let reply = "Orienting camera to 3D isometric overview.";
    if (/top|down|plan|blueprint/.test(textLower)) {
      viewType = "top_down";
      reply = "Switching to top-down architectural blueprint view.";
    } else if (/walk|first|person/.test(textLower)) {
      viewType = "walkthrough";
      reply = "Entering first-person walkthrough perspective.";
    }
    return {
      transcript_received: text,
      voice_reply: reply,
      action_type: "switch_camera_view",
      action_payload: { view_type: viewType },
      action_chips: [
        { label: "Reset Camera", action: "reset_camera" },
        { label: "View in AR", action: "view_ar" },
      ],
      success: true,
    };
  }

  // 3. Flooring Material
  if (/flooring|marble|tile|tiles|wood floor|hardwood|oak|terrazzo|parquet|carpet|laminate|herringbone/.test(textLower) || (/floor/.test(textLower) && !/plan/.test(textLower))) {
    let materialName = "European White Oak (Herringbone)";
    let costImpact = 0;
    let reply = "Updating flooring to natural European White Oak in a herringbone layout.";
    if (/marble/.test(textLower)) {
      materialName = "Italian Statuario Marble Slabs";
      costImpact = 90720;
      reply = "Switching flooring to Italian Statuario Marble. Cost impact is approximately +₹90,000.";
    } else if (/tile|vitrified/.test(textLower)) {
      materialName = "Large-Format Glazed Vitrified Tiles";
      costImpact = -35000;
      reply = "Swapping flooring to Glazed Vitrified Tiles, saving ₹35,000.";
    } else if (/terrazzo/.test(textLower)) {
      materialName = "Venetian Terrazzo";
      costImpact = -15000;
      reply = "Updating floor to Venetian Terrazzo with satin polished finish.";
    }
    return {
      transcript_received: text,
      voice_reply: reply,
      action_type: "change_flooring",
      action_payload: { flooring_material: materialName, cost_impact: costImpact },
      action_chips: [
        { label: "Simulate Cost Impact", action: "cost_impact" },
        { label: "Material Specs", action: "materials" },
      ],
      success: true,
    };
  }

  // 4. Budget & Financial Query
  if (/budget|cost|spend|spent|remaining|contingency|save|money|expense|cheaper|expensive|price/.test(textLower)) {
    return {
      transcript_received: text,
      voice_reply: "Active room budget is tracked. Expenses and allocations are synchronized with your Financial Guardrails.",
      action_type: "budget_query",
      action_payload: { query: text },
      action_chips: [
        { label: "Open Budget Manager", action: "budget" },
        { label: "View Expense Table", action: "expenses" },
      ],
      success: true,
    };
  }

  // 5. Furniture & Spatial Layout
  if (/sofa|couch|seating|table|chair|bed|wardrobe|cabinet|shelf|furniture|cozy|rearrange|layout|minimalist|add furniture/.test(textLower)) {
    return {
      transcript_received: text,
      voice_reply: "Reconfiguring room layout with updated furniture specifications.",
      action_type: "modify_furniture",
      action_payload: { furniture_action: "update", description: text },
      action_chips: [
        { label: "Preview in 3D", action: "preview_3d" },
        { label: "Check Budget Delta", action: "budget" },
      ],
      success: true,
    };
  }

  // 6. Lighting & Ambiance
  if (/lighting|light preset|warm light|neutral light|luxury light|ambient|daylight|brighten|dim/.test(textLower)) {
    const preset = /luxury|ambient/.test(textLower) ? "luxury" : /neutral|day/.test(textLower) ? "neutral" : "warm";
    return {
      transcript_received: text,
      voice_reply: `Adjusted 3D scene lighting to ${preset} ambiance preset.`,
      action_type: "change_lighting",
      action_payload: { lighting_preset: preset },
      action_chips: [{ label: "Preview in 3D", action: "preview_3d" }],
      success: true,
    };
  }

  // 7. Execution Timeline
  if (/timeline|milestone|schedule|progress|civil|electrical|finish|completion|deadline|duration/.test(textLower)) {
    return {
      transcript_received: text,
      voice_reply: "Milestone status: Site measurement & preliminary 3D drafting complete. Design customization in progress.",
      action_type: "timeline_query",
      action_payload: { progress_percentage: 50.0 },
      action_chips: [{ label: "Track Timeline", action: "execution" }],
      success: true,
    };
  }

  // 8. STRICTLY IGNORE: Non-relevant text / Irrelevant command
  return {
    transcript_received: text,
    voice_reply: `Command ignored: "${text}" does not specify a relevant room or design change, so no updates were applied. Please request a relevant design change such as painting walls, switching flooring materials, rearranging furniture, adjusting camera views, or checking your budget.`,
    action_type: "ignored_command",
    action_payload: { ignored: true, reason: "non_relevant_text", query: text },
    action_chips: [
      { label: "Try: 'Paint walls warm greige'", action: "prompt_sample" },
      { label: "Try: 'Italian marble floor'", action: "prompt_sample" },
      { label: "Try: 'Top-down blueprint view'", action: "prompt_sample" },
      { label: "Try: 'Check remaining budget'", action: "prompt_sample" },
    ],
    success: false,
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
      text: "Hello! I'm AURA, your HomeVerse Voice Copilot. Speak or type design commands like 'Paint walls warm greige', 'Switch to Italian marble', or 'Show top-down view'. Note: Non-design requests are automatically ignored.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
          // If we have transcript upon ending, send it
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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback: simulate voice speech prompt
      const samplePrompts = [
        "Paint walls designer warm greige",
        "Switch the flooring to Italian statuario marble",
        "Show me top-down architectural floor plan view",
        "How much budget is remaining?",
        "Switch to European white oak floor",
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

  const handleSendCommand = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    const trimmed = queryText.trim();
    setInputQuery("");
    setIsProcessing(true);

    setHistory((prev) => [...prev, { sender: "user", text: trimmed }]);

    let data: VoiceCommandResponse;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/voice/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: trimmed,
          project_id: projectId || null,
          room_id: roomId || null,
        }),
      });

      if (!res.ok) throw new Error("API call failed");
      data = await res.json();
    } catch (_) {
      // Fallback: Use robust client-side classification
      data = classifyVoiceCommand(trimmed);
    }

    setLastResponse(data);

    const isIgnored =
      data.action_type === "ignored_command" ||
      data.success === false ||
      data.action_payload?.ignored === true;

    setHistory((prev) => [
      ...prev,
      {
        sender: "assistant",
        text: data.voice_reply,
        actionType: data.action_type,
        isIgnored,
      },
    ]);

    // Speak aloud via TTS so the user is informed by voice as well
    speakText(data.voice_reply);

    if (isIgnored) {
      // STRICTLY IGNORE: Inform parent that command was ignored; do NOT alter room or budget!
      onVoiceCommand?.(trimmed, false, "ignored_command", data.action_payload);
      setIsProcessing(false);
      return;
    }

    // Execute relevant side-effects on the 3D studio canvas
    if (data.action_type === "change_wall_color" && data.action_payload?.color_hex) {
      onWallColorChange?.(data.action_payload.color_hex, data.action_payload.color_name || "Custom");
    } else if (data.action_type === "change_flooring" && data.action_payload?.flooring_material) {
      onFlooringChange?.(data.action_payload.flooring_material, data.action_payload.cost_impact || 0);
    } else if (data.action_type === "switch_camera_view" && data.action_payload?.view_type) {
      onCameraChange?.(data.action_payload.view_type);
    } else if (data.action_type === "change_lighting" && data.action_payload?.lighting_preset) {
      onLightingChange?.(data.action_payload.lighting_preset);
    }

    onVoiceCommand?.(trimmed, true, data.action_type, data.action_payload);
    setIsProcessing(false);
  };

  const handleChipClick = (chip: VoiceActionChip) => {
    if (chip.action === "prompt_sample") {
      const cleanPrompt = chip.label.replace(/^Try:\s*['"]?|['"]?$/g, "");
      handleSendCommand(cleanPrompt);
    } else if (chip.action === "preview_3d") {
      onCameraChange?.("isometric");
    } else if (chip.action === "reset_camera") {
      onCameraChange?.("isometric");
    } else if (chip.action === "view_ar") {
      onNavigateAction?.("#ar");
    } else if (chip.target_url && onNavigateAction) {
      onNavigateAction(chip.target_url);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Actual Voice Assistant Panel - Displayed ONLY when open */}
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
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    v3
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">PBR & Spatial Voice Assistant</div>
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
                      : msg.isIgnored || msg.actionType === "ignored_command"
                      ? "bg-rose-950/40 text-rose-100 rounded-tl-none border border-rose-500/40"
                      : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.text}
                  {msg.isIgnored || msg.actionType === "ignored_command" ? (
                    <div className="mt-2 pt-1.5 border-t border-rose-500/30 text-[10.5px] font-mono text-rose-300 flex items-center gap-1.5 bg-rose-950/60 px-2 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Command Ignored • Only room & design changes are accepted</span>
                    </div>
                  ) : msg.actionType ? (
                    <div className="mt-1.5 pt-1 border-t border-slate-700/40 text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Action: {msg.actionType.replace(/_/g, " ").toUpperCase()}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isListening && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-[11px] font-medium">Listening... {transcript || "Say a command"}</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Analyzing spatial command & cost impact...
              </div>
            )}
          </div>

          {/* Suggested Action Chips */}
          {lastResponse?.action_chips && lastResponse.action_chips.length > 0 && (
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex flex-wrap gap-1.5">
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
                "Paint walls warm greige",
                "Italian statuario marble floor",
                "Top-down blueprint view",
                "Remaining budget",
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
                placeholder="Speak or type (e.g. 'Marble floor')..."
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

      {/* Floating Website-Style Chat / AURA Voice Copilot Button */}
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
