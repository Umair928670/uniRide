'use client';

import { Home, Search, Plus, MessageCircle, User, Car, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./app-context";

export function BottomNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  
  // We read the active app mode, not their database role
  const { activeRole, appNotifications } = useApp();
  const isDriverMode = activeRole === "driver";

  const isHidden = 
    pathname.startsWith("/ride/") || 
    pathname.startsWith("/call/");

  if (isHidden) return null;

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-3">
        
        {/* 1. HOME */}
        <button onClick={() => router.push("/")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* 2. RIDES */}
        <button onClick={() => router.push("/my-rides")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/my-rides" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
          <MapPin className="w-6 h-6" />
          <span className="text-[10px] font-medium">Rides</span>
        </button>

        {/* 3. CENTER ACTION BUTTON (Static visual, smart routing) */}
        <div className="relative">
          <button 
            // SMART ROUTING: Decides where to go based on active mode!
            onClick={() => router.push(isDriverMode ? "/offerRide" : "/search")} 
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 text-white bg-[#b9b9b9] shadow-[#c6c5cb]/30 hover:bg-[#de0b12]"
          >
            {/* A universal Plus icon looks professional for both "Requesting" and "Offering" */}
             {isDriverMode ? <Plus className="w-7 h-7" /> : <Search className="w-7 h-7" />}
          </button>
        </div>

        {/* 4. INBOX */}
        <button onClick={() => router.push("/notifications")} className={`relative flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/notifications" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-card" />}
          </div>
          <span className="text-[10px] font-medium">Inbox</span>
        </button>

        {/* 5. PROFILE */}
        <button onClick={() => router.push("/profile")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/profile" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>

      </div>
    </div>
  );
}