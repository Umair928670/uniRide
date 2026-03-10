"use client";

import { useState } from "react";
import { User, Car, Users, Loader2 } from "lucide-react";
import { updateUserRole } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

export function OnboardingOverlay() {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleSelectRole = async (role: "passenger" | "driver" | "both") => {
    setIsUpdating(true);
    try {
      await updateUserRole(role);
      // Hard refresh to reload the layout and remove the overlay
      window.location.href = "/"; 
    } catch (error) {
      console.error(error);
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1A3C6E] dark:text-white">Welcome to UniRide!</h1>
          <p className="text-muted-foreground">How are you planning to use the app?</p>
        </div>

        <div className="space-y-4">
          {/* Passenger Card */}
          <button 
            onClick={() => handleSelectRole("passenger")}
            disabled={isUpdating}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-border bg-card hover:border-[#00C9B1] hover:bg-[#00C9B1]/5 transition-all active:scale-[0.98] text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00C9B1]/10 flex items-center justify-center group-hover:bg-[#00C9B1] transition-colors">
              <User className="w-7 h-7 text-[#00C9B1] group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Passenger</h3>
              <p className="text-sm text-muted-foreground">I want to find and book rides.</p>
            </div>
          </button>

          {/* Driver Card */}
          <button 
            onClick={() => handleSelectRole("driver")}
            disabled={isUpdating}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-border bg-card hover:border-[#1A3C6E] hover:bg-[#1A3C6E]/5 transition-all active:scale-[0.98] text-left group dark:hover:border-blue-400 dark:hover:bg-blue-400/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1A3C6E]/10 flex items-center justify-center group-hover:bg-[#1A3C6E] transition-colors dark:bg-blue-400/10 dark:group-hover:bg-blue-400">
              <Car className="w-7 h-7 text-[#1A3C6E] group-hover:text-white transition-colors dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Driver</h3>
              <p className="text-sm text-muted-foreground">I want to offer rides and earn.</p>
            </div>
          </button>

          {/* Both Card */}
          <button 
            onClick={() => handleSelectRole("both")}
            disabled={isUpdating}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-border bg-card hover:border-purple-500 hover:bg-purple-500/5 transition-all active:scale-[0.98] text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <Users className="w-7 h-7 text-purple-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Both</h3>
              <p className="text-sm text-muted-foreground">I will drive sometimes and ride sometimes.</p>
            </div>
          </button>
        </div>

        {isUpdating && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse pt-4">
            <Loader2 className="w-5 h-5 animate-spin" /> Saving your preference...
          </div>
        )}
      </div>
    </div>
  );
}