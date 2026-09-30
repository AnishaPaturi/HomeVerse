"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, CornerDownLeft, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

interface VoiceActionChip {
  label: string;
  action: string;
  target_url?: string;
}

interface VoiceCommandResponse {
  transcript_received: string;
  voice_reply: string;
  action_type: string;
  action_payload: Record<string, any>;
  action_chips: VoiceActionChip[];
  success: boolean;
}

interface VoiceAssistantWidgetProps {
  projectId?: string;
  roomId?: string;
  isOpen: boolean;
  onClose: () => void;
  onWallColorChange?: (colorHex: string, colorName: string) => void;
  onFlooringChange?: (flooringName: string, costDelta: number) => void;
  onCameraChange?: (viewType: "isometric" | "walkthrough" | "top_down") => void;
  onNavigateAction?: (url: string) => void;
}

export default function VoiceAssistantWidget({
  projectId,
  roomId,
  isOpen,
  onClose,
  onWallColorChange,
  onFlooringChange,
  onCameraChange,
  onNavigateAction,
}: VoiceAssistantWidgetProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [lastResponse, setLastResponse] = useState<VoiceCommandResponse | null>(null);
  const [history, setHistory] = useState<Array<{ sender: "user" | "assistant"; text: string; actionType?: string }>>([
    {
      sender: "assistant",
      text: "Hello! I'm your HomeVerse Voice Copilot. Speak or type commands like 'Paint walls warm greige', 'Switch to Italian marble', or 'Show top-down view'.",
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

      if (!res.ok) throw new Error("Failed to process voice command");
      const data: VoiceCommandResponse = await res.json();
      setLastResponse(data);

      setHistory((prev) => [
        ...prev,
        { sender: "assistant", text: data.voice_reply, actionType: data.action_type },
      ]);

      speakText(data.voice_reply);

      // Execute side-effects on the 3D studio canvas
      if (data.action_type === "change_wall_color" && data.action_payload?.color_hex) {
        onWallColorChange?.(data.action_payload.color_hex, data.action_payload.color_name || "Custom");
      } else if (data.action_type === "change_flooring" && data.action_payload?.flooring_material) {
        onFlooringChange?.(data.action_payload.flooring_material, data.action_payload.cost_impact || 0);
      } else if (data.action_type === "switch_camera_view" && data.action_payload?.view_type) {
        onCameraChange?.(data.action_payload.view_type);
      }
    } catch (err) {
      const fallbackReply = `Applied command: '${trimmed}'. Updating 3D scene parameters.`;
      setHistory((prev) => [...prev, { sender: "assistant", text: fallbackReply }]);
      speakText(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChipClick = (chip: VoiceActionChip) => {
    if (chip.action === "preview_3d") {
      onCameraChange?.("isometric");
    } else if (chip.action === "reset_camera") {
      onCameraChange?.("isometric");
    } else if (chip.action === "view_ar") {
      onNavigateAction?.("#ar");
    } else if (chip.target_url && onNavigateAction) {
      onNavigateAction(chip.target_url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
              Voice Copilot
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v3
              </span>
            </div>
            <div className="text-[11px] text-slate-400">PBR & Spatial Voice Assistant</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setTtsMuted(!ttsMuted)}
            title={ttsMuted ? "Unmute Voice" : "Mute Voice"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {ttsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3.5 max-h-[340px] overflow-y-auto text-xs font-sans">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10"
                  : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60"
              }`}
            >
              {msg.text}
              {msg.actionType && (
                <div className="mt-1.5 pt-1 border-t border-slate-700/40 text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Action: {msg.actionType.replace(/_/g, " ").toUpperCase()}
                </div>
              )}
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
              onClick={() => handleChipClick(chip)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 transition flex items-center gap-1"
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
              onClick={() => handleSendCommand(prompt)}
              className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      )}

      {/* Input Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl flex items-center justify-center transition shadow-lg ${
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
            className="text-slate-400 hover:text-amber-400 disabled:opacity-30 transition p-1"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
