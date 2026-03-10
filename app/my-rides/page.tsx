'use client';

import { useState, useEffect } from "react";
import { Calendar, History, Car, Loader2 } from "lucide-react";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import { getMyRides } from "@/lib/actions/ride.actions";

export default function MyRidesPage() {
  const { cancelRide, activeRole, addNotification } = useApp();
  
  // Database States
  const [liveUpcomingRides, setLiveUpcomingRides] = useState<any[]>([]);
  const [liveOfferedRides, setLiveOfferedRides] = useState<any[]>([]);
  const [livePastRides, setLivePastRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<"upcoming" | "past" | "offered">(
    activeRole === "driver" ? "offered" : "upcoming"
  );

  useEffect(() => {
    const fetchLiveRides = async () => {
      setIsLoading(true);
      try {
        const data = await getMyRides();
        const now = new Date();

        // Data formatter to match your RideCard component exactly
        const formatRide = (ride: any) => {
          // 1. Convert DB Date ("2024-03-08" -> "Mar 8")
          const [year, month, day] = ride.date.split('-');
          const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
          const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // 2. Convert DB Time ("14:30" -> "2:30 PM")
          const [hours, minutes] = ride.time.split(':');
          const hourNum = parseInt(hours, 10);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const formattedHour = hourNum % 12 || 12;
          const displayTime = `${formattedHour}:${minutes} ${ampm}`;

          return {
            id: ride._id,
            from: ride.origin,
            to: ride.destination,
            fromCoords: [ride.originCoords.lat, ride.originCoords.lng],
            toCoords: [ride.destinationCoords.lat, ride.destinationCoords.lng],
            driverName: `${ride.driver?.firstName || "Unknown"} ${ride.driver?.lastName || ""}`.trim(),
            driverAvatar: ride.driver?.photo || "/default-avatar.png",
            rating: ride.driver?.rating || 5.0,
            price: ride.price,
            
            // Put the newly formatted strings into the UI
            departureTime: displayTime, 
            date: displayDate,          
            
            seatsLeft: ride.availableSeats,
            totalSeats: ride.totalSeats,
            status: ride.status,
            rawDate: new Date(ride.departureTime) 
          };
        };

        const formattedOffered = data.offeredRides.map(formatRide);
        const formattedBooked = data.bookedRides.map(formatRide);

        // Sort Booked Rides into Upcoming vs Past
        const upcoming: any[] = [];
        const past: any[] = [];

        formattedBooked.forEach((ride: any) => {
          if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
            past.push(ride);
          } else {
            upcoming.push(ride);
          }
        });

        // Also add past offered rides to the "Past" tab
        formattedOffered.forEach((ride: any) => {
            if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
                // Ensure no duplicates if they were both driver and somehow passenger (should be impossible)
                if(!past.find(p => p.id === ride.id)) past.push(ride);
            }
        });

        // Keep only future/active offered rides in the Offered tab
        const activeOffered = formattedOffered.filter((ride: any) => ride.rawDate >= now && ride.status !== "cancelled" && ride.status !== "completed");

        // 1. Sort Upcoming & Offered: Soonest rides at the top (Ascending)
        upcoming.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
        activeOffered.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());

        // 2. Sort Past: Most recently completed rides at the top (Descending)
        past.sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime());

        setLiveUpcomingRides(upcoming);
        setLiveOfferedRides(activeOffered);
        setLivePastRides(past);

      } catch (error) {
        console.error("Failed to load rides:", error);
        addNotification("warning", "Failed to load your rides.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveRides();
  }, [addNotification]);

  const tabs = [
    ...(activeRole !== "driver"
      ? [{ key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: liveUpcomingRides.length }]
      : []),
    ...(activeRole !== "passenger"
      ? [{ key: "offered" as const, label: "Offered", icon: Car, count: liveOfferedRides.length }]
      : []),
    { key: "past" as const, label: "Past", icon: History, count: livePastRides.length },
  ];

  // If role changed and current tab is hidden, reset
  const validKeys = tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : validKeys[0];

  const currentRides =
    activeTab === "upcoming" ? liveUpcomingRides : activeTab === "offered" ? liveOfferedRides : livePastRides;

  return (
    <div className="min-h-full bg-background pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-2xl font-bold">My Rides</h1>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00C9B1]" />
                <p>Loading your rides...</p>
            </div>
          ) : currentRides.length > 0 ? (
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