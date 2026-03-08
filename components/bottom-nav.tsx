'use client';

import { Map, Car, Plus, User, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/components/app-context";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeRole } = useApp();

  if (pathname === "/login") return null;

  const showOffer = activeRole !== "passenger";

  const leftItems = [
    { icon: Map, label: "Home", path: "/" },
    { icon: Search, label: "Browse", path: "/search" },
  ];

  const rightItems = [
    { icon: Car, label: "My Rides", path: "/my-rides" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const allItems = showOffer
    ? [...leftItems, ...rightItems]
    : [...leftItems, ...rightItems];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-around py-1.5 px-1">
            {/* Left items */}
            {leftItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <NavButton
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  onClick={() => router.push(item.path)}
                />
              );
            })}

            {/* Center Offer Ride FAB */}
            {showOffer && (
              <div className="relative -mt-6">
                <button
                  onClick={() => router.push("/offerRide")}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    pathname === "/offer-ride"
                      ? "bg-[#1A3C6E] shadow-[#1A3C6E]/30"
                      : "bg-gradient-to-br from-[#00C9B1] to-[#00A896] shadow-[#00C9B1]/30 hover:shadow-[#00C9B1]/50"
                  }`}
                >
                  <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                </button>
                <span
                  className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap transition-colors ${
                    pathname === "/offer-ride"
                      ? "text-[#00C9B1]"
                      : "text-muted-foreground"
                  }`}
                >
                  Offer
                </span>
              </div>
            )}

            {/* Right items */}
            {rightItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <NavButton
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  onClick={() => router.push(item.path)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] relative group"
    >
      {/* Active pill indicator */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#00C9B1]" />
      )}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          isActive
            ? "bg-[#00C9B1]/12 dark:bg-[#00C9B1]/20"
            : "group-hover:bg-muted"
        }`}
      >
        <Icon
          className={`w-[20px] h-[20px] transition-colors ${
            isActive
              ? "text-[#00C9B1] stroke-[2.5]"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
      </div>
      <span
        className={`text-[10px] transition-colors ${
          isActive
            ? "text-[#00C9B1]"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
