"use client";

import React, { useState, useEffect } from "react";

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
    title: "Budget Alert",
    message: "65% of allocated living room budget has been utilized. Remaining contingency: ₹2.80L.",
    type: "budget_alert",
    read: false,
    created_at: "10 mins ago",
  },
  {
    id: "n2",
    title: "Milestone Achieved",
    message: "Civil and Demolition works completed ahead of schedule. Ready for electrical rough-in.",
    type: "milestone",
    read: false,
    created_at: "1 hour ago",
  },
  {
    id: "n3",
    title: "Order Dispatched",
    message: "L-Shape Modular Sectional Sofa is on the way from Havenly Living. Tracking: HV-88219.",
    type: "delivery",
    read: false,
    created_at: "3 hours ago",
  },
  {
    id: "n4",
    title: "Value Engineering Tip",
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
      // Keep canonical default notifications if API is running elsewhere
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("http://localhost:8080/api/notifications/read-all", { method: "PUT" });
    } catch {
      // Handled in state
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: "PUT" });
    } catch {
      // Handled in state
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "budget_alert":
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">Budget</span>;
      case "milestone":
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">Milestone</span>;
      case "delivery":
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">Delivery</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">AI Tip</span>;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        title="Notifications"
        aria-label="View notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition"
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
                  className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                    n.read
                      ? "bg-transparent border-gray-100 dark:border-zinc-800/60 text-gray-600 dark:text-zinc-400"
                      : "bg-indigo-50/40 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-gray-900 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(n.type)}
                      <span className="font-semibold text-gray-900 dark:text-white">{n.title}</span>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600 dark:text-zinc-300 leading-relaxed">{n.message}</p>
                  <div className="mt-2 text-[10px] text-gray-400 dark:text-zinc-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 text-center">
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">HomeVerse Notification Engine</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
