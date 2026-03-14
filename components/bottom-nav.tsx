// 'use client';

// import { Home, Search, Plus, MessageCircle, User, Car, MapPin } from "lucide-react";
// import { usePathname, useRouter } from "next/navigation";
// import { useApp } from "./app-context";

// export function BottomNav() {
//   const pathname = usePathname() || "";
//   const router = useRouter();
  
//   // We read the active app mode, not their database role
//   const { activeRole, appNotifications } = useApp();
//   const isDriverMode = activeRole === "driver";

//   const isHidden = 
//     pathname.startsWith("/ride/") || 
//     pathname.startsWith("/call/");

//   if (isHidden) return null;

//   const unreadCount = appNotifications.filter((n) => !n.read).length;

//   return (
//     <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
//       <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-3">
        
//         {/* 1. HOME */}
//         <button onClick={() => router.push("/")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
//           <Home className="w-6 h-6" />
//           <span className="text-[10px] font-medium">Home</span>
//         </button>

//         {/* 2. RIDES */}
//         <button onClick={() => router.push("/my-rides")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/my-rides" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
//           <MapPin className="w-6 h-6" />
//           <span className="text-[10px] font-medium">Rides</span>
//         </button>

//         {/* 3. CENTER ACTION BUTTON (Static visual, smart routing) */}
//         <div className="relative">
//           <button 
//             // SMART ROUTING: Decides where to go based on active mode!
//             onClick={() => router.push(isDriverMode ? "/offerRide" : "/search")} 
//             className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 text-white bg-[#b9b9b9] shadow-[#c6c5cb]/30 hover:bg-[#de0b12]"
//           >
//             {/* A universal Plus icon looks professional for both "Requesting" and "Offering" */}
//              {isDriverMode ? <Plus className="w-7 h-7" /> : <Search className="w-7 h-7" />}
//           </button>
//         </div>

//         {/* 4. INBOX */}
//         <button onClick={() => router.push("/notifications")} className={`relative flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/notifications" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
//           <div className="relative">
//             <MessageCircle className="w-6 h-6" />
//             {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-card" />}
//           </div>
//           <span className="text-[10px] font-medium">Inbox</span>
//         </button>

//         {/* 5. PROFILE */}
//         <button onClick={() => router.push("/profile")} className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === "/profile" ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"}`}>
//           <User className="w-6 h-6" />
//           <span className="text-[10px] font-medium">Profile</span>
//         </button>

//       </div>
//     </div>
//   );
// }

'use client';

import { Home, Search, Plus, MessageCircle, User, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./app-context";
import { useEffect, useRef } from "react";
import { useGsap } from "@/lib/hooks/use-gsap";

export function BottomNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const gsap = useGsap(); // ✅ clean, reusable, no SSR crash

  const navRef = useRef<HTMLDivElement>(null);
  const centerBtnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { activeRole, appNotifications } = useApp();
  const isDriverMode = activeRole === "driver";

  const isHidden =
    pathname.startsWith("/ride/") ||
    pathname.startsWith("/call/");

  // Animate nav on mount
  useEffect(() => {
    if (isHidden) return;
    const timer = setTimeout(() => {
      const g = gsap.current;
      if (!g) return;

      if (navRef.current) {
        g.fromTo(navRef.current,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
      }

      const validItems = itemRefs.current.filter(Boolean);
      if (validItems.length > 0) {
        g.fromTo(validItems,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.07, delay: 0.15 }
        );
      }

      if (centerBtnRef.current) {
        g.fromTo(centerBtnRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", delay: 0.3 }
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isHidden]);

  // Animate active item on route change
  useEffect(() => {
    const g = gsap.current;
    if (!g) return;
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const isActive = el.dataset.path === pathname;
      g.to(el, { scale: isActive ? 1.08 : 1, duration: 0.25, ease: "power2.out" });
    });
  }, [pathname]);

  if (isHidden) return null;

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  // Reusable press animation
  const handleNavPress = (el: HTMLButtonElement | null, callback: () => void) => {
    const g = gsap.current;
    if (!g || !el) { callback(); return; }
    g.timeline()
      .to(el, { scale: 0.88, duration: 0.1, ease: "power2.in" })
      .to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1.2, 0.5)" });
    setTimeout(callback, 80);
  };

  // Center button hover
  const handleCenterHover = (entering: boolean) => {
    const g = gsap.current;
    if (!g || !centerBtnRef.current) return;
    g.to(centerBtnRef.current, {
      scale: entering ? 1.12 : 1,
      duration: 0.3,
      ease: entering ? "power2.out" : "power3.out",
    });
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home", index: 0 },
    { path: "/my-rides", icon: MapPin, label: "Rides", index: 1 },
    { path: "/notifications", icon: MessageCircle, label: "Inbox", index: 3, badge: unreadCount > 0 },
    { path: "/profile", icon: User, label: "Profile", index: 4 },
  ];

  return (
    <div
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-3">

        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              ref={(el) => { itemRefs.current[item.index] = el; }}
              data-path={item.path}
              onClick={(e) => handleNavPress(e.currentTarget, () => router.push(item.path))}
              className={`flex flex-col items-center gap-1 min-w-[56px] relative ${
                isActive ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00C9B1]" />
              )}
            </button>
          );
        })}

        <div className="relative">
          <button
            ref={centerBtnRef}
            onClick={(e) => handleNavPress(e.currentTarget, () => router.push(isDriverMode ? "/offerRide" : "/search"))}
            onMouseEnter={() => handleCenterHover(true)}
            onMouseLeave={() => handleCenterHover(false)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#1A3C6E] shadow-lg shadow-[#1A3C6E]/30 hover:bg-[#1A3C6E]/90"
          >
            {isDriverMode ? <Plus className="w-7 h-7" /> : <Search className="w-7 h-7" />}
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              ref={(el) => { itemRefs.current[item.index] = el; }}
              data-path={item.path}
              onClick={(e) => handleNavPress(e.currentTarget, () => router.push(item.path))}
              className={`relative flex flex-col items-center gap-1 min-w-[56px] ${
                isActive ? "text-[#00C9B1]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-card" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00C9B1]" />
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
}