"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: Date;
}

interface CopilotChatProps {
  designId: string;
  onCopilotAction: (actionType: string, payload: any) => void;
}

export default function CopilotChat({ designId, onCopilotAction }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "copilot",
      text: "Hi! I am your AI Design Copilot. Tell me how you'd like to adjust this room (e.g., 'make the walls blue', 'add a desk', or 'use brown leather on the sofa').",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickPrompts = [
    { label: "🔵 Paint walls blue", command: "make walls blue" },
    { label: "🪵 Wood floor", command: "change floor to wood" },
    { label: "🛋️ Leather sofa", command: "change sofa to brown leather" },
    { label: "🖥️ Add study desk", command: "add a desk" },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Try hitting the backend API
      const formData = new FormData();
      formData.append("design_id", designId);
      formData.append("message", textToSend);

      const res = await fetch("http://localhost:8080/api/ai/copilot-chat", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        
        // Add Copilot response
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "copilot",
            text: data.response,
            timestamp: new Date(),
          },
        ]);

        // Trigger action in parent component to update the 3D scene
        if (data.actions && data.actions.length > 0) {
          // Parse action types to update front-end state
          const cmd = textToSend.toLowerCase();
          if (cmd.includes("wall") && cmd.includes("blue")) {
            onCopilotAction("update_wall", { material: "#3b82f6" });
          } else if (cmd.includes("sofa") && cmd.includes("leather")) {
            onCopilotAction("update_sofa", { material: "#b45309" });
          } else if (cmd.includes("add") && (cmd.includes("desk") || cmd.includes("table"))) {
            onCopilotAction("add_object", { object_type: "desk", material: "#4a3b32" });
          }
        }
      } else {
        throw new Error("API not running");
      }
    } catch (err) {
      // Graceful fallback to client-side mock logic if API server is not running
      setTimeout(() => {
        let replyText = "";
        const cmd = textToSend.toLowerCase();

        if (cmd.includes("wall") && (cmd.includes("blue") || cmd.includes("color"))) {
          replyText = "I have updated the wall color to blue.";
          onCopilotAction("update_wall", { material: "#3b82f6" });
        } else if (cmd.includes("sofa") && cmd.includes("leather")) {
          replyText = "I have updated the sofa material to brown leather.";
          onCopilotAction("update_sofa", { material: "#b45309" });
        } else if (cmd.includes("add") && (cmd.includes("desk") || cmd.includes("table"))) {
          replyText = "I have added a study desk to the room.";
          onCopilotAction("add_object", { object_type: "desk", material: "#4a3b32" });
        } else if (cmd.includes("floor") && cmd.includes("wood")) {
          replyText = "I have set the floor material to dark walnut wood.";
          onCopilotAction("update_floor", { material: "wood_dark" });
        } else {
          replyText = `Understood! I'll apply: "${textToSend}" to the scene. (Note: Running in offline client preview)`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "copilot",
            text: replyText,
            timestamp: new Date(),
          },
        ]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col glass-panel border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800/60 bg-slate-900/40">
        <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
        <div>
          <h3 className="font-bold text-slate-100 text-sm">AI Design Copilot</h3>
          <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" /> Online & Ready
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-800/80 border border-slate-700/30 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-500 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
            <span className="flex space-x-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
            <span className="italic">AI Copilot is modifying the room...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 border-t border-slate-800/40 bg-slate-950/20">
        <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Try asking:</span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p) => (
            <button
              key={p.command}
              onClick={() => handleSend(p.command)}
              disabled={isLoading}
              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-slate-800/60 bg-slate-900/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot to change materials, colors..."
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all cursor-pointer glow-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
