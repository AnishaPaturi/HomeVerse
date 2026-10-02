"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Sparkles, TrendingUp, Truck, CheckCircle2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Budget Allocation Optimal",
    message: "65% of allocated living room budget has been utilized. Remaining contingency: ₹2.80L.",
    type: "budget_alert",
    read: false,
    created_at: "10 mins ago",
  },
  {
    id: "n2",
    title: "Milestone Verified",
    message: "Civil and Demolition structural shell completed. Ready for electrical rough-in.",
    type: "milestone",
    read: false,
    created_at: "1 hour ago",
  },
  {
    id: "n3",
    title: "Material Dispatched",
    message: "L-Shape Modular Sectional Sofa is in transit from Havenly Living. Tracking: HV-88219.",
    type: "delivery",
    read: false,
    created_at: "3 hours ago",
  },
  {
    id: "n4",
    title: "Value Engineering Insight",
    message: "Switching to engineered walnut coffee table saves ₹9,500 with matching finish warmth.",
    type: "recommendation",
    read: true,
    created_at: "Yesterday",
  },
];

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(3);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/notifications/summary");
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
        }
      }
    } catch {
      // Keep canonical default notifications
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("http://localhost:8080/api/notifications/read-all", { method: "PUT" });
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: "PUT" });
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "budget_alert":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            Budget
          </span>
        );
      case "milestone":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Milestone
          </span>
        );
      case "delivery":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-teal-500/10 border border-teal-500/30 text-teal-400">
            Logistics
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            AI Copilot
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full glass-morphism hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
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
          <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-3xl glass-morphism-card border border-white/15 bg-[#090e15]/95 backdrop-blur-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm font-editorial">
                  Studio Activity & Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3 rounded-2xl border text-xs transition cursor-pointer ${
                    n.read
                      ? "bg-transparent border-white/[0.06] text-slate-400 hover:bg-white/[0.03]"
                      : "bg-emerald-500/[0.05] border-emerald-500/25 text-slate-200 hover:bg-emerald-500/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(n.type)}
                      <span className="font-semibold text-white">{n.title}</span>
                    </div>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-light">{n.message}</p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    {n.created_at}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/[0.08] text-center">
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
