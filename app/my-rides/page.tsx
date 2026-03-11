'use client';

import { useState, useEffect } from "react";
import { Calendar, History, Car, Loader2, Users } from "lucide-react";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import { getMyRides } from "@/lib/actions/ride.actions";

export default function MyRidesPage() {
  // 1. Pull the ACTIVE App Mode, entirely ignoring their permanent database role
  const { activeRole, cancelRide, addNotification } = useApp();
  const isDriverMode = activeRole === "driver";
  
  // Database States
  const [liveUpcomingRides, setLiveUpcomingRides] = useState<any[]>([]);
  const [liveOfferedRides, setLiveOfferedRides] = useState<any[]>([]);
  const [livePastBooked, setLivePastBooked] = useState<any[]>([]);
  const [livePastOffered, setLivePastOffered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default the starting tab based on their active role
  const [tab, setTab] = useState<"upcoming" | "past" | "offered">(
    isDriverMode ? "offered" : "upcoming"
  );

  // If they switch roles globally, force the tab to correct itself
  useEffect(() => {
    if (activeRole === "driver" && tab === "upcoming") setTab("offered");
    if (activeRole === "passenger" && tab === "offered") setTab("upcoming");
  }, [activeRole, tab]);

  useEffect(() => {
    const fetchLiveRides = async () => {
      setIsLoading(true);
      try {
        const data = await getMyRides();
        const now = new Date();

        const formatRide = (ride: any) => {
          const [year, month, day] = ride.date.split('-');
          const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
          const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
            departureTime: displayTime, 
            date: displayDate,          
            seatsLeft: ride.availableSeats,
            totalSeats: ride.totalSeats,
            status: ride.status,
            rawDate: new Date(ride.departureTime),
            driverId: ride.driver?._id || ride.driver
          };
        };

        const formattedOffered = data.offeredRides.map(formatRide);
        const formattedBooked = data.bookedRides.map(formatRide);

        const upcoming: any[] = [];
        const pastBooked: any[] = [];
        formattedBooked.forEach((ride: any) => {
          if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
            pastBooked.push(ride);
          } else {
            upcoming.push(ride);
          }
        });

        const activeOffered: any[] = [];
        const pastOffered: any[] = [];
        formattedOffered.forEach((ride: any) => {
            if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
               pastOffered.push(ride);
            } else {
               activeOffered.push(ride);
            }
        });

        upcoming.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
        activeOffered.sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());
        pastBooked.sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime());
        pastOffered.sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime());

        setLiveUpcomingRides(upcoming);
        setLiveOfferedRides(activeOffered);
        setLivePastBooked(pastBooked);
        setLivePastOffered(pastOffered);

      } catch (error) {
        console.error("Failed to load rides:", error);
        addNotification("warning", "Failed to load your rides.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveRides();
  }, [addNotification]);

  // 2. STRICTLY build the tabs based on the active role only
  const tabs = isDriverMode ? [
    { key: "offered" as const, label: "Offered", icon: Car, count: liveOfferedRides.length },
    { key: "past" as const, label: "Past", icon: History, count: livePastOffered.length },
  ] : [
    { key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: liveUpcomingRides.length },
    { key: "past" as const, label: "Past", icon: History, count: livePastBooked.length },
  ];

  const validKeys = tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : validKeys[0];

  // 3. Ensure the past tab shows the right history based on role
  const currentRides =
    activeTab === "upcoming" ? liveUpcomingRides : 
    activeTab === "offered" ? liveOfferedRides : 
    (isDriverMode ? livePastOffered : livePastBooked);

  return (
    <div className="min-h-full bg-background pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4">
        
        {/* Dynamic Header Badge */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-2xl font-bold">My Rides</h1>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${isDriverMode ? "bg-[#1A3C6E]/10 text-[#1A3C6E] dark:bg-[#00C9B1]/10 dark:text-[#00C9B1]" : "bg-[#00C9B1]/10 text-[#00C9B1]"}`}>
            {isDriverMode ? <Car className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {activeRole} Mode
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
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === t.key ? "bg-[#00C9B1] text-white" : "bg-muted text-muted-foreground"}`}>
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
            <EmptyState tab={activeTab} isDriverMode={isDriverMode} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab, isDriverMode }: { tab: string, isDriverMode: boolean }) {
  const messages: Record<string, { title: string; sub: string }> = {
    upcoming: { title: "No upcoming rides", sub: "Book a ride from the home screen" },
    offered: { title: "No offered rides", sub: "Start sharing rides with fellow students" },
    past: { title: "No past rides", sub: isDriverMode ? "Rides you have driven will appear here" : "Rides you have taken will appear here" },
  };
  const m = messages[tab] || messages.upcoming;

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        {isDriverMode ? <Car className="w-8 h-8 text-muted-foreground/40" /> : <Users className="w-8 h-8 text-muted-foreground/40" />}
      </div>
      <p className="font-medium text-foreground">{m.title}</p>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-[200px] mx-auto">{m.sub}</p>
    </div>
  );
}