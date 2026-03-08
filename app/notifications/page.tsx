'use client';

import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Car,
  MessageCircle,
  Shield,
  Gift,
  XCircle,
  CheckCheck,
  Trash2,
  BellOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp, AppNotification } from "../../components/app-context";

const ICON_MAP: Record<AppNotification["type"], { icon: typeof Bell; color: string; bg: string }> = {
  ride_booked: { icon: Car, color: "text-[#00C9B1]", bg: "bg-[#00C9B1]/10" },
  ride_cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ride_request: { icon: Car, color: "text-[#1A3C6E] dark:text-blue-400", bg: "bg-[#1A3C6E]/10 dark:bg-blue-400/10" },
  message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
  system: { icon: Shield, color: "text-[#1A3C6E] dark:text-[#00C9B1]", bg: "bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10" },
  promo: { icon: Gift, color: "text-orange-500", bg: "bg-orange-500/10" },
};

type FilterType = "all" | "unread" | AppNotification["type"];

export default function NotificationsPage() {
  const router = useRouter();
  const {
    appNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllAppNotifications,
    deleteAppNotification,
  } = useApp();

  const [filter, setFilter] = useState<FilterType>("all");
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  const filteredNotifications = appNotifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "ride_booked", label: "Rides" },
    { key: "message", label: "Messages" },
    { key: "system", label: "System" },
  ];

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2>Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#00C9B1] text-white text-[11px] font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-5 h-5 text-[#00C9B1]" />
              </button>
            )}
            {appNotifications.length > 0 && (
              <button
                onClick={clearAllAppNotifications}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-[#1A3C6E] text-white dark:bg-[#00C9B1]"
                  : "bg-[#F5F7FA] dark:bg-[#1C2333] text-muted-foreground border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="font-medium text-muted-foreground">No notifications</p>
            <p className="text-[13px] text-muted-foreground/60 mt-1">
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notif) => {
              const iconInfo = ICON_MAP[notif.type];
              const Icon = iconInfo.icon;

              return (
                <div
                  key={notif.id}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {/* Delete button behind */}
                  {swipedId === notif.id && (
                    <button
                      onClick={() => {
                        deleteAppNotification(notif.id);
                        setSwipedId(null);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center rounded-r-2xl"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!notif.read) markNotificationRead(notif.id);
                      if (swipedId === notif.id) {
                        setSwipedId(null);
                      } else {
                        setSwipedId(notif.id);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
                      notif.read
                        ? "bg-card border-border"
                        : "bg-card border-[#00C9B1]/20 shadow-sm"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconInfo.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${iconInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-[14px] truncate ${
                              notif.read ? "" : "font-semibold"
                            }`}
                          >
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-[#00C9B1]" />
                            )}
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {formatTime(notif.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
