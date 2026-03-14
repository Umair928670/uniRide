'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar, History, Car, Users, ArrowLeft } from "lucide-react";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import { useGsap } from "@/lib/hooks/use-gsap";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/page-transition";
import useSWR from "swr";

const fetcher = async () => {
  const { getMyRides } = await import("@/lib/actions/ride.actions");
  return getMyRides();
};

export default function MyRidesPage() {
  const { activeRole, addNotification } = useApp();
  const isDriverMode = activeRole === "driver";
  const gsap = useGsap();
  const router = useRouter();

  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"upcoming" | "past" | "offered">(
    isDriverMode ? "offered" : "upcoming"
  );

  useEffect(() => {
    if (activeRole === "driver" && tab === "upcoming") setTab("offered");
    if (activeRole === "passenger" && tab === "offered") setTab("upcoming");
  }, [activeRole, tab]);

  const { data, isLoading, error, mutate } = useSWR('myRides', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    refreshInterval: 15000,
  });

  if (error) {
    console.error(error);
    addNotification("warning", "Failed to load your rides.");
  }

  // ✅ GSAP: entrance animations
  useEffect(() => {
    const timer = setTimeout(() => {
      const g = gsap.current;
      if (!g) return;
      const tl = g.timeline();
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }
      if (tabsRef.current) {
        tl.fromTo(tabsRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
          "-=0.2"
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // ✅ GSAP: animate cards on load
  useEffect(() => {
    if (!isLoading && listRef.current) {
      const timer = setTimeout(() => {
        const g = gsap.current;
        if (!g) return;
        const cards = listRef.current?.querySelectorAll('.ride-card-anim');
        if (cards && cards.length > 0) {
          g.fromTo(cards,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.08 }
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, tab]);

  // ✅ GSAP: animate tab switch
  const handleTabChange = (key: "upcoming" | "past" | "offered") => {
    const g = gsap.current;
    if (g && listRef.current) {
      g.fromTo(listRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
    setTab(key);
  };

  const handleCancelRide = async (rideId: string) => {
    mutate((currentData: any) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        bookedRides: currentData.bookedRides.filter((r: any) => r._id !== rideId)
      };
    }, false);
    try {
      const { cancelRideBooking } = await import("@/lib/actions/request.actions");
      await cancelRideBooking(rideId);
      addNotification("info", "Ride cancelled successfully.");
      mutate();
    } catch (error: any) {
      addNotification("warning", error.message || "Failed to cancel ride.");
      mutate();
    }
  };

  const processedRides = useMemo(() => {
    if (!data) return { upcoming: [], activeOffered: [], pastBooked: [], pastOffered: [] };

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
    <PageTransition  className="min-h-full bg-background flex flex-col">

      {/* ✅ Colored header — navy bg with back arrow, title, role badge */}
      <div ref={headerRef} className="bg-[#1A3C6E] dark:bg-[#0f2548] px-5 pt-5 rounded-bl-[30px] rounded-br-[30px] pb-6 relative overflow-hidden shrink-0">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        {/* Teal glow accent */}
        <div className="absolute -bottom-4 right-6 w-28 h-28 rounded-full bg-[#00C9B1]/20 blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-5">
          {/* Left: back arrow + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-xl font-bold">My Rides</h1>
          </div>

          {/* Right: role badge */}
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isDriverMode
              ? "bg-white/15 text-white"
              : "bg-[#00C9B1]/25 text-[#00C9B1]"
          }`}>
            {isDriverMode ? <Car className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {activeRole} Mode
          </span>
        </div>

        {/* Tabs — inside header */}
        <div ref={tabsRef} className="relative flex bg-white/10 rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-95 ${
                activeTab === t.key
                  ? "bg-white text-[#1A3C6E] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeTab === t.key ? "bg-[#00C9B1] text-white" : "bg-white/20 text-white"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Content area — ride list only */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-4">


          {/* Ride list */}
          <div ref={listRef} className="space-y-3">
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
                <div key={ride.id} className="ride-card-anim">
                  <RideCard
                    ride={ride}
                    isPast={activeTab === "past"}
                    isBooked={activeTab === "upcoming"}
                    onCancel={activeTab === "upcoming" ? handleCancelRide : undefined}
                  />
                </div>
              ))
            ) : (
              <EmptyState tab={activeTab} isDriverMode={isDriverMode} />
            )}
          </div>

        </div>
      </div>
    </PageTransition >
  );
}

function EmptyState({ tab, isDriverMode }: { tab: string; isDriverMode: boolean }) {
  const messages: Record<string, { title: string; sub: string }> = {
    upcoming: { title: "No upcoming rides", sub: "Book a ride from the home screen" },
    offered: { title: "No offered rides", sub: "Start sharing rides with fellow students" },
    past: {
      title: "No past rides",
      sub: isDriverMode ? "Rides you have driven will appear here" : "Rides you have taken will appear here",
    },
  };
  const m = messages[tab] || messages.upcoming;

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
        {isDriverMode
          ? <Car className="w-8 h-8 text-muted-foreground/40" />
          : <Users className="w-8 h-8 text-muted-foreground/40" />}
      </div>
      <p className="font-semibold text-[16px] text-foreground">{m.title}</p>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-[200px] mx-auto">{m.sub}</p>
    </div>
  );
}