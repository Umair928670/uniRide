'use client';

import { Bell, GraduationCap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "./app-context";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopBarProps {
  transparent?: boolean;
}

export function TopBar({ transparent = false }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, appNotifications } = useApp();

  const hiddenPaths = [
    "/notifications",
    "/settings",
    "/help",
    "/search",
    "/offer-ride"
  ];

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${transparent
          ? "bg-white/70 dark:bg-[#0D1117]/70 backdrop-blur-xl"
          : "bg-card/95 backdrop-blur-lg border-b border-border"
        }`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1A3C6E] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-[#1A3C6E] dark:text-[#00C9B1]">
            UniRide
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/notifications")}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-[#00C9B1] text-white text-[10px] font-semibold flex items-center justify-center border-2 border-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#00C9B1]/30 flex-shrink-0"
          >
            <Avatar className="w-full h-full">
                <AvatarImage
                  src={user?.photo || "/default-avatar.png"
                    
                  }
                  alt="Profile"
                  className="object-cover"
                />
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
