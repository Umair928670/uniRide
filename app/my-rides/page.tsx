'use client';

import { useState } from "react";
import { Calendar, History, Car, Users } from "lucide-react";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";

export  default function MyRidesPage() {
  const { myUpcomingRides, myPastRides, offeredRides, cancelRide, activeRole } = useApp();
  const [tab, setTab] = useState<"upcoming" | "past" | "offered">(
    activeRole === "driver" ? "offered" : "upcoming"
  );

  const tabs = [
    ...(activeRole !== "driver"
      ? [{ key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: myUpcomingRides.length }]
      : []),
    ...(activeRole !== "passenger"
      ? [{ key: "offered" as const, label: "Offered", icon: Car, count: offeredRides.length }]
      : []),
    { key: "past" as const, label: "Past", icon: History, count: myPastRides.length },
  ];

  // If role changed and current tab is hidden, reset
  const validKeys = tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : validKeys[0];

  const currentRides =
    activeTab === "upcoming" ? myUpcomingRides : activeTab === "offered" ? offeredRides : myPastRides;

  return (
    <div className="min-h-full bg-background pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1>My Rides</h1>
          <span className="px-2.5 py-1 rounded-full bg-[#00C9B1]/10 text-[#00C9B1] text-[11px] font-semibold capitalize">
            {activeRole === "both" ? "Driver & Passenger" : activeRole}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#F5F7FA] dark:bg-[#1C2333] rounded-2xl p-1 mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                activeTab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    activeTab === t.key
                      ? "bg-[#00C9B1] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ride List */}
        <div className="space-y-3">
          {currentRides.length > 0 ? (
            currentRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                isPast={activeTab === "past"}
                isBooked={activeTab === "upcoming"}
                onCancel={activeTab === "upcoming" ? cancelRide : undefined}
              />
            ))
          ) : (
            <EmptyState tab={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; sub: string }> = {
    upcoming: { title: "No upcoming rides", sub: "Book a ride from the home screen" },
    offered: { title: "No offered rides", sub: "Start sharing rides with fellow students" },
    past: { title: "No past rides", sub: "Your completed rides will appear here" },
  };
  const m = messages[tab] || messages.upcoming;

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Car className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <p className="font-medium text-muted-foreground">{m.title}</p>
      <p className="text-[13px] text-muted-foreground/60 mt-1">{m.sub}</p>
    </div>
  );
}