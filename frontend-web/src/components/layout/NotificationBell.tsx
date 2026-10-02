"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  Check, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  Trash2,
  X,
  Layers,
  IndianRupee,
  RefreshCw
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const u = getStoredUser();
      const params = new URLSearchParams();
      if (u?.id && u.id !== "u-demo-123" && u.id !== "d0000000-0000-0000-0000-000000000000") {
        params.append("user_id", u.id);
      } else if (u?.email) {
        params.append("email", u.email);
      }
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`http://localhost:8080/api/notifications/summary${q}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch (err) {
      console.warn("Could not fetch live notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Dynamic polling every 20 seconds so alerts update live
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      const u = getStoredUser();
      const params = new URLSearchParams();
      if (u?.id && u.id !== "u-demo-123" && u.id !== "d0000000-0000-0000-0000-000000000000") {
        params.append("user_id", u.id);
      } else if (u?.email) {
        params.append("email", u.email);
      }
      const q = params.toString() ? `?${params.toString()}` : "";
      await fetch(`http://localhost:8080/api/notifications/read-all${q}`, { method: "PUT" });
    } catch (err) {
      console.warn("Failed to mark all read:", err);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: "PUT" });
    } catch (err) {
      console.warn("Failed to mark single read:", err);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "budget_alert":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-400">
            Budget
          </span>
        );
      case "milestone":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            Milestone
          </span>
        );
      case "delivery":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-teal-500/15 border border-teal-500/40 text-teal-400">
            Logistics
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            AI Copilot
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-emerald-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-mono font-bold text-slate-950 ring-2 ring-[#06090e] shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Solid, completely opaque, non-invisible container */}
          <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-[#0c1017] !bg-opacity-100 border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm font-editorial tracking-tight">
                  Studio Activity & Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline transition cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`group relative p-3 rounded-2xl border text-xs transition cursor-pointer ${
                      n.read
                        ? "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80"
                        : "bg-emerald-950/20 border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(n.type)}
                        <span className="font-semibold text-white truncate max-w-[200px]">
                          {n.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        )}
                        <button
                          onClick={(e) => deleteNotification(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                          title="Dismiss alert"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-light">
                      {n.message}
                    </p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      {formatRelativeTime(n.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-white font-mono text-xs font-semibold">No New Notifications</p>
                  <p className="text-slate-400 text-[11px] font-light max-w-xs mx-auto">
                    Your studio spaces and budget envelopes are fully up to date.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 font-mono">
                HomeVerse Spatial OS Intelligence
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
