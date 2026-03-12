'use client';

import { useState, useEffect, useMemo } from "react";
import { Calendar, History, Car, Users } from "lucide-react";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import useSWR from "swr";

const fetcher = async () => {
  const { getMyRides } = await import("@/lib/actions/ride.actions");
  return getMyRides();
};

export default function MyRidesPage() {
  const { activeRole, addNotification } = useApp(); // Notice we removed cancelRide from here!
  const isDriverMode = activeRole === "driver";
  
  const [tab, setTab] = useState<"upcoming" | "past" | "offered">(
    isDriverMode ? "offered" : "upcoming"
  );

  useEffect(() => {
    if (activeRole === "driver" && tab === "upcoming") setTab("offered");
    if (activeRole === "passenger" && tab === "offered") setTab("upcoming");
  }, [activeRole, tab]);

  // Grab 'mutate' from SWR so we can manipulate the cache
  const { data, isLoading, error, mutate } = useSWR('myRides', fetcher, {
    revalidateOnFocus: false, 
    dedupingInterval: 10000,  
    refreshInterval: 15000,   
  });

  if (error) {
    console.error(error);
    addNotification("warning", "Failed to load your rides.");
  }

  // --- THE NEW CANCELLATION ENGINE ---
  const handleCancelRide = async (rideId: string) => {
    // 1. Optimistic UI: Instantly remove the ride from the screen so the user doesn't wait
    mutate((currentData: any) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        bookedRides: currentData.bookedRides.filter((r: any) => r._id !== rideId)
      };
    }, false);

    try {
      // 2. Talk to the actual database
      const { cancelRideBooking } = await import("@/lib/actions/request.actions");
      await cancelRideBooking(rideId);
      
      addNotification("info", "Ride cancelled successfully.");
      
      // 3. Re-sync with the database just to be 100% sure
      mutate();
    } catch (error: any) {
      // If the database fails, put the ride back on the screen
      addNotification("warning", error.message || "Failed to cancel ride.");
      mutate(); 
    }
  };

  const processedRides = useMemo(() => {
    if (!data) return { upcoming: [], offered: [], pastBooked: [], pastOffered: [] };

    const now = new Date();
    const upcoming: any[] = [];
    const activeOffered: any[] = [];
    const pastBooked: any[] = [];
    const pastOffered: any[] = [];

    const formatRide = (ride: any) => {
      const [year, month, day] = ride.date.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const [hours, minutes] = ride.time.split(':');
      const hourNum = parseInt(hours, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = hourNum % 12 || 12;
      
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
        departureTime: `${formattedHour}:${minutes} ${ampm}`, 
        date: displayDate,          
        seatsLeft: ride.availableSeats,
        totalSeats: ride.totalSeats,
        status: ride.status,
        rawDate: new Date(ride.departureTime),
        driverId: ride.driver?._id || ride.driver
      };
    };

    data.bookedRides?.forEach((rawRide: any) => {
      const ride = formatRide(rawRide);
      if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
        pastBooked.push(ride);
      } else {
        upcoming.push(ride);
      }
    });

    data.offeredRides?.forEach((rawRide: any) => {
      const ride = formatRide(rawRide);
      if (ride.rawDate < now || ride.status === "completed" || ride.status === "cancelled") {
        pastOffered.push(ride);
      } else {
        activeOffered.push(ride);
      }
    });

    upcoming.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    activeOffered.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    pastBooked.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    pastOffered.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    return { upcoming, activeOffered, pastBooked, pastOffered };
  }, [data]);

  const tabs = isDriverMode ? [
    { key: "offered" as const, label: "Offered", icon: Car, count: (processedRides.activeOffered ?? []).length },
    { key: "past" as const, label: "Past", icon: History, count: (processedRides.pastOffered ?? []).length },
  ] : [
    { key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: processedRides.upcoming.length },
    { key: "past" as const, label: "Past", icon: History, count: processedRides.pastBooked.length },
  ];

  const validKeys = tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : validKeys[0];

  const currentRides = (
    activeTab === "upcoming" ? processedRides.upcoming : 
    activeTab === "offered" ? processedRides.activeOffered : 
    (isDriverMode ? processedRides.pastOffered : processedRides.pastBooked)
  ) ?? [];

  return (
    <div className="min-h-full bg-background pt-16 pb-24">
      <div className="max-w-lg mx-auto px-4">
        
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-2xl font-bold">My Rides</h1>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${isDriverMode ? "bg-[#1A3C6E]/10 text-[#1A3C6E] dark:bg-[#00C9B1]/10 dark:text-[#00C9B1]" : "bg-[#00C9B1]/10 text-[#00C9B1]"}`}>
            {isDriverMode ? <Car className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {activeRole} Mode
          </span>
        </div>

        <div className="flex bg-[#f2f5fc] dark:bg-[#1C2333] rounded-2xl p-1 mb-5">
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

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-[180px] rounded-3xl bg-card border border-border animate-pulse flex flex-col p-4">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div className="space-y-2">
                          <div className="w-24 h-3 rounded bg-muted" />
                          <div className="w-16 h-2 rounded bg-muted" />
                        </div>
                     </div>
                     <div className="w-16 h-6 rounded-full bg-muted" />
                   </div>
                   <div className="w-3/4 h-3 rounded bg-muted mb-2" />
                   <div className="w-1/2 h-3 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : currentRides.length > 0 ? (
            currentRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                isPast={activeTab === "past"}
                isBooked={activeTab === "upcoming"}
                onCancel={activeTab === "upcoming" ? handleCancelRide : undefined} // Updated!
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
    <div className="text-center py-16 animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
        {isDriverMode ? <Car className="w-8 h-8 text-muted-foreground/40" /> : <Users className="w-8 h-8 text-muted-foreground/40" />}
      </div>
      <p className="font-semibold text-[16px] text-foreground">{m.title}</p>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-[200px] mx-auto">{m.sub}</p>
    </div>
  );
}