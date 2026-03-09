"use client";

import { Star, Car, Settings, LogOut, Moon, Sun, ChevronRight, Shield, Award, Bell, HelpCircle, Users, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp, UserRole } from "@/components/app-context";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useClerk } from "@clerk/nextjs";

const ROLE_OPTIONS: { key: UserRole; label: string; icon: typeof Car; description: string }[] = [
  { key: "passenger", label: "Passenger", icon: Users, description: "Find & book rides" },
  { key: "driver", label: "Driver", icon: Car, description: "Offer rides to others" },
  { key: "both", label: "Both", icon: RefreshCw, description: "Drive & ride" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, activeRole, isDarkMode, toggleDarkMode, logout, switchRole, appNotifications } = useApp();

  if (!user) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const unreadCount = appNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-full bg-background pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4">
        {/* Profile Header */}
        <div className="pt-4 pb-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <ImageWithFallback
              src={user.photo || "/default-avatar.png"}
              alt="Profile"
              className="w-full h-full rounded-3xl object-cover shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#00C9B1] rounded-xl flex items-center justify-center border-3 border-background">
              <span className="text-white text-[12px] font-bold">✓</span>
            </div>
          </div>
          <h2>{user.firstName} {user.lastName}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-4 h-4 text-[#00C9B1]" />
            <span className="text-[13px] text-[#00C9B1]">Verified Student</span>
          </div>
          <p className="text-muted-foreground text-[13px] mt-1">
            {user.university} · {user.department}
          </p>
          <p className="text-muted-foreground text-[12px] mt-0.5">{user.email}</p>
        </div>

        {/* Role Switcher */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
            <h3 className="font-semibold text-[14px]">My Role</h3>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">
            Switch how you use UniRide. You can be a passenger, a driver, or both!
          </p>
          <div className="flex bg-[#F5F7FA] dark:bg-[#1C2333] rounded-2xl p-1 gap-1">
            {ROLE_OPTIONS.map((option) => {
              const isActive = activeRole === option.key;
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  onClick={() => switchRole(option.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[12px] transition-all ${
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#00C9B1]" : ""}`} />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{option.description}</span>
                </button>
              );
            })}
          </div>
          {activeRole === "driver" && !user.vehicleInfo && (
            <button
              onClick={() => router.push("/settings")}
              className="mt-3 w-full py-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[13px] font-medium hover:bg-orange-500/15 transition-colors"
            >
              ⚠ Add vehicle info to start driving →
            </button>
          )}
          {activeRole === "driver" && user.vehicleInfo && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00C9B1]/10">
              <Car className="w-4 h-4 text-[#00C9B1]" />
              <span className="text-[12px] text-foreground">
                {user.vehicleInfo.color} {user.vehicleInfo.make} {user.vehicleInfo.model} · {user.vehicleInfo.licensePlate}
              </span>
            </div>
          )}
          {activeRole === "both" && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10">
              <Shield className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
              <span className="text-[12px] text-foreground">
                You can find rides and offer your own — full flexibility!
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
            <Users className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
            <p className="text-xl font-bold">{user.ridesTaken}</p>
            <p className="text-[12px] text-muted-foreground">As Passenger</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
            <Car className="w-5 h-5 text-[#00C9B1] mx-auto mb-1" />
            <p className="text-xl font-bold">{user.ridesOffered}</p>
            <p className="text-[12px] text-muted-foreground">As Driver</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{user.rating}</p>
            <p className="text-[12px] text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
            <h3 className="font-semibold text-[14px]">Badges</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Road Warrior", emoji: "🚗", unlocked: user.ridesTaken >= 10, hint: "Take 10+ rides" },
              { label: "Top Rated", emoji: "⭐", unlocked: user.rating >= 4.5, hint: "Maintain 4.5+ rating" },
              { label: "Eco Champion", emoji: "🌱", unlocked: user.ridesOffered >= 5, hint: "Offer 5+ rides" },
              { label: "Verified", emoji: "🎓", unlocked: user.verified, hint: "Verify .edu email" },
              { label: "Dual Role", emoji: "🔄", unlocked: user.ridesTaken >= 5 && user.ridesOffered >= 3, hint: "Active as driver & passenger" },
            ].map((badge) => (
              <span
                key={badge.label}
                title={badge.unlocked ? badge.label : `${badge.hint} to unlock`}
                className={`px-3 py-1.5 rounded-full border text-[12px] transition-colors ${
                  badge.unlocked
                    ? "bg-[#00C9B1]/10 border-[#00C9B1]/30 text-foreground"
                    : "bg-muted border-border text-muted-foreground opacity-50"
                }`}
              >
                {badge.emoji} {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden mb-6">
          <MenuItem
            icon={isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-[#1A3C6E] dark:text-muted-foreground" />}
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
            onClick={() => signOut({ redirectUrl: '/' })}
          />
        </div>

        {/* App Version */}
        <p className="text-center text-[12px] text-muted-foreground pb-4">
          UniRide v1.0.0 · Made for students
        </p>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  labelClass = "",
  onClick,
  badge,
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