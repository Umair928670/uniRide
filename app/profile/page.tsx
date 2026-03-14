"use client";

import { Car, Settings, LogOut, Moon, Sun, ChevronRight, Shield, Award, Bell, HelpCircle, Users, RefreshCw, MapPin, Clock, TrendingUp, Wallet, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useClerk } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, activeRole, isDarkMode, toggleDarkMode, switchRole, appNotifications } = useApp();
  const [emailVisible, setEmailVisible] = useState(false);
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ Hide immediately on first paint, then animate in once user data + cards exist
  useEffect(() => {
    if (!user) return;

    // Hide header + avatar right away
    if (headerRef.current) {
      headerRef.current.style.opacity = "0";
      headerRef.current.style.transform = "translateY(-30px)";
    }
    if (avatarRef.current) {
      avatarRef.current.style.opacity = "0";
      avatarRef.current.style.transform = "scale(0.5)";
    }

    // Hide cards — they exist in DOM now because user is loaded
    if (contentRef.current) {
      contentRef.current.querySelectorAll<HTMLElement>(".anim-card").forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(24px)";
      });
    }

    // Animate in
    import("gsap").then(({ gsap: g }) => {
      const tl = g.timeline();
      if (headerRef.current)
        tl.to(headerRef.current, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
      if (avatarRef.current)
        tl.to(avatarRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }, "-=0.3");
      if (contentRef.current) {
        const cards = contentRef.current.querySelectorAll(".anim-card");
        if (cards.length > 0)
          tl.to(cards, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.07, clearProps: "transform,opacity" }, "-=0.1");
      }
    });
  }, [user]); // ← re-runs when user loads so cards are in DOM

  const baseRole = user?.role || "both";

  // SKELETON LOADER
  if (!user) {
    return (
      <div className="min-h-full bg-background pb-24 animate-pulse">
        <div className="bg-[#1A3C6E] dark:bg-[#0f2548] px-5 pt-5 pb-8">
          <div className="flex flex-col items-center pt-2">
            <div className="w-20 h-20 rounded-3xl bg-white/20 mb-3" />
            <div className="w-32 h-5 bg-white/20 rounded-full mb-2" />
            <div className="w-24 h-3 bg-white/15 rounded-full mb-1" />
            <div className="w-40 h-3 bg-white/15 rounded-full mb-1" />
            <div className="w-36 h-3 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pt-5">
          <div className="bg-card rounded-2xl border border-border h-28 mb-4 animate-pulse" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1,2,3].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-24" />)}
          </div>
          <div className="bg-card rounded-2xl border border-border h-64" />
        </div>
      </div>
    );
  }

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  const badges = [
    { label: "Road Warrior", emoji: "🚗", unlocked: user.ridesTaken >= 10, hint: "Take 10+ rides to unlock" },
    { label: "Top Rated", emoji: "⭐", unlocked: user.rating >= 4.5, hint: "Maintain 4.5+ rating to unlock" },
    { label: "Eco Champion", emoji: "🌱", unlocked: user.ridesOffered >= 5, hint: "Offer 5+ rides to unlock" },
    { label: "Verified", emoji: "🎓", unlocked: user.verified, hint: "Verify your .edu email to unlock" },
    { label: "Dual Role", emoji: "🔄", unlocked: user.ridesTaken >= 5 && user.ridesOffered >= 3, hint: "Be active as both driver & passenger" },
  ];
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  // Masked email helper
  const maskedEmail = user?.email
    ? user.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <div className="min-h-full bg-background flex flex-col pb-24">

      {/* ── NAVY HEADER (same pattern as My Rides) ── */}
      <div ref={headerRef} className="bg-[#1A3C6E] dark:bg-[#0f2548] px-5 pt-5 pb-7 relative overflow-hidden shrink-0">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        {/* Teal glow */}
        <div className="absolute -bottom-6 right-8 w-36 h-36 rounded-full bg-[#00C9B1]/20 blur-2xl pointer-events-none" />
        <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Avatar + identity */}
        <div className="relative flex flex-col items-center pt-2 text-center">
          <div ref={avatarRef} className="relative mb-3">
            <ImageWithFallback
              src={user?.photo || "/default-avatar.png"}
              alt="Profile"
              className="w-20 h-20 rounded-3xl object-cover border-2 border-white/20"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#00C9B1] rounded-xl flex items-center justify-center border-2 border-[#1A3C6E]">
              <span className="text-white text-[11px] font-bold">✓</span>
            </div>
          </div>

          <h2 className="text-white text-xl font-bold leading-tight">
            {user?.firstName} {user?.lastName}
          </h2>

          <div className="flex items-center gap-1.5 mt-1">
            <Shield className="w-3.5 h-3.5 text-[#00C9B1]" />
            <span className="text-[#00C9B1] text-[12px] font-medium">Verified Student</span>
          </div>

          <p className="text-white/60 text-[12px] mt-1">
            {user?.university} · {user?.department}
          </p>

          {/* Email with privacy toggle */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-white/50 text-[11px]">
              {emailVisible ? user?.email : maskedEmail}
            </span>
            <button
              onClick={() => setEmailVisible(v => !v)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {emailVisible
                ? <EyeOff className="w-3 h-3" />
                : <Eye className="w-3 h-3" />}
            </button>
          </div>

          {/* Member since */}
          {user?.createdAt && (
            <p className="text-white/35 text-[10px] mt-0.5 uppercase tracking-wider">
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-lg mx-auto px-4 pt-5">

          {/* ── ROLE SWITCHER / BADGE ── */}
          {baseRole === "both" ? (
            <div className="anim-card bg-card rounded-2xl shadow-sm border border-border p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                <h3 className="font-semibold text-[14px]">App Mode</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Switch how you want to use UniRide right now.
              </p>
              <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border/50">
                <button
                  onClick={() => { switchRole("passenger"); router.push("/"); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeRole === "passenger"
                      ? "bg-white dark:bg-[#1C2333] shadow-md text-[#00C9B1] border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="w-4 h-4" /> Passenger
                </button>
                <button
                  onClick={() => { switchRole("driver"); router.push("/"); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeRole === "driver"
                      ? "bg-white dark:bg-[#1C2333] shadow-md text-[#1A3C6E] dark:text-[#00C9B1] border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Car className="w-4 h-4" /> Driver
                </button>
              </div>
              {activeRole === "driver" && !user.vehicleInfo && (
                <button
                  onClick={() => router.push("/settings?section=vehicle")}
                  className="mt-3 w-full py-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[13px] font-medium hover:bg-orange-500/15 transition-colors"
                >
                  ⚠ Add vehicle info to start driving →
                </button>
              )}
            </div>
          ) : (
            <div className="anim-card bg-card rounded-2xl shadow-sm border border-border p-4 mb-5 text-center">
              <div className="flex justify-center mb-2">
                {baseRole === "driver"
                  ? <Car className="w-6 h-6 text-[#1A3C6E] dark:text-[#00C9B1]" />
                  : <Users className="w-6 h-6 text-[#00C9B1]" />}
              </div>
              <h3 className="font-semibold text-[14px] mb-1">Your Role</h3>
              <p className="text-[12px] text-muted-foreground">
                You are registered as a <strong className="capitalize">{baseRole}</strong> on UniRide.
              </p>
              {baseRole === "driver" && !user.vehicleInfo && (
                <button
                  onClick={() => router.push("/settings?section=vehicle")}
                  className="mt-3 w-full py-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[13px] font-medium hover:bg-orange-500/15 transition-colors"
                >
                  ⚠ Add vehicle info to start driving →
                </button>
              )}
            </div>
          )}

          {/* ── PASSENGER STATS (shown when passenger mode) ── */}
          {activeRole === "passenger" && (
            <div className="anim-card grid grid-cols-3 gap-3 mb-5">
              <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
                <Users className="w-5 h-5 text-[#00C9B1] mx-auto mb-1" />
                <p className="text-xl font-bold">{user.ridesTaken ?? 0}</p>
                <p className="text-[12px] text-muted-foreground">Rides Taken</p>
              </div>
              <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
                <MapPin className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
                <p className="text-xl font-bold">{user.savedPlaces?.length ?? 0}</p>
                <p className="text-[12px] text-muted-foreground">Saved Places</p>
              </div>
              <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
                <Clock className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
                <p className="text-xl font-bold">{user.ridesOffered ?? 0}</p>
                <p className="text-[12px] text-muted-foreground">Rides Shared</p>
              </div>
            </div>
          )}

          {/* ── DRIVER SECTION ── */}
          {activeRole === "driver" && (
            <>
              {/* Earnings shortcut — stats live on the earnings page itself */}
              <button
                onClick={() => router.push("/earnings")}
                className="anim-card w-full bg-card rounded-2xl shadow-sm border border-border p-4 mb-5 flex items-center justify-between hover:bg-muted/30 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5 text-[#1A3C6E] dark:text-[#00C9B1]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold">Earnings</p>
                    <p className="text-[11px] text-muted-foreground">View your ride income</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Badges */}
              <div className="anim-card bg-card rounded-2xl shadow-sm border border-border p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
                  <h3 className="font-semibold text-[14px]">Driver Badges</h3>
                  <span className="ml-auto text-[11px] text-muted-foreground">Tap to see how to unlock</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badges.map((badge) => (
                    <div key={badge.label} className="relative">
                      <button
                        onClick={() => setExpandedBadge(expandedBadge === badge.label ? null : badge.label)}
                        className={`px-3 py-1.5 rounded-full border text-[12px] transition-all ${
                          badge.unlocked
                            ? "bg-[#00C9B1]/10 border-[#00C9B1]/30 text-foreground"
                            : "bg-muted border-border text-muted-foreground opacity-50"
                        }`}
                      >
                        {badge.emoji} {badge.label}
                      </button>
                      {expandedBadge === badge.label && (
                        <div className="absolute bottom-full left-0 mb-2 z-10 bg-card border border-border rounded-xl px-3 py-2 text-[11px] text-foreground shadow-lg whitespace-nowrap">
                          {badge.unlocked ? "✓ Unlocked!" : badge.hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── SETTINGS MENU ── */}
          <div className="anim-card bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-5">
            <MenuItem
              icon={isDarkMode
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5 text-[#1A3C6E] dark:text-muted-foreground" />}
              label={isDarkMode ? "Light Mode" : "Dark Mode"}
              onClick={toggleDarkMode}
            />
            <Divider />
            <MenuItem
              icon={<Bell className="w-5 h-5 text-[#1A3C6E] dark:text-muted-foreground" />}
              label="Notifications"
              onClick={() => router.push("/notifications")}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
            <Divider />
            <MenuItem
              icon={<Settings className="w-5 h-5 text-[#1A3C6E] dark:text-muted-foreground" />}
              label="Settings"
              onClick={() => router.push("/settings")}
            />
            <Divider />
            <MenuItem
              icon={<HelpCircle className="w-5 h-5 text-[#1A3C6E] dark:text-muted-foreground" />}
              label="Help & Support"
              onClick={() => router.push("/help")}
            />
            <Divider />
            <MenuItem
              icon={<LogOut className="w-5 h-5 text-red-500" />}
              label="Log Out"
              labelClass="text-red-500"
              onClick={() => signOut({ redirectUrl: "/" })}
            />
          </div>

          <p className="text-center text-[12px] text-muted-foreground pb-4">
            UniRide v1.0.0 · Made for students 🎓
          </p>

        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon, label, labelClass = "", onClick, badge,
}: {
  icon: React.ReactNode;
  label: string;
  labelClass?: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className={`text-[14px] ${labelClass}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#00C9B1] text-white text-[11px] font-semibold min-w-[20px] text-center">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}