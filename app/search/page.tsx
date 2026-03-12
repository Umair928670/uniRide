'use client';

import { Suspense, useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, Search, X, MapPin, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import dynamic from "next/dynamic";
// 1. IMPORT SWR
import useSWR from "swr";

const MapView = dynamic(() => import('@/components/map-view').then(mod => mod.MapView ), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00C9B1]" /></div>
});

// 2. THE SWR FETCHER
const fetchAvailableRides = async () => {
  const { getAvailableRides } = await import("@/lib/actions/ride.actions");
  const data = await getAvailableRides();

  // Format data exactly as before so it matches RideCard
  return data.map((ride: any) => {
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
  });
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useApp(); 

  // 3. THE SWR ENGINE
  // Fetches available rides. We check frequently (every 10s) because rides fill up fast!
  const { data: liveRides = [], isLoading, error } = useSWR('availableRides', fetchAvailableRides, {
    revalidateOnFocus: true, 
    dedupingInterval: 5000,
    refreshInterval: 10000, // Check for new rides every 10 seconds
  });

  if (error) console.error("Failed to fetch rides:", error);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || searchParams.get("pickup") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "mid" | "high">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [showMap, setShowMap] = useState(false);

  // 4. Client-side filtering (Instantly filters the SWR cache)
  const filteredRides = useMemo(() => {
    return liveRides.filter((ride: any) => {
      // Word-level matching against ride's from, to, and driver name
      const words = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      const matchesSearch =
        words.length === 0 ||
        words.some(
          (word) =>
            ride.to.toLowerCase().includes(word) ||
            ride.from.toLowerCase().includes(word) ||
            ride.driverName.toLowerCase().includes(word)
        );

      let matchesPrice = true;
      if (priceFilter === "low") matchesPrice = ride.price <= 5;
      else if (priceFilter === "mid") matchesPrice = ride.price > 5 && ride.price <= 10;
      else if (priceFilter === "high") matchesPrice = ride.price > 10;

      let matchesTime = true;
      if (timeFilter !== "all" && ride.departureTime) {
        const hour = parseInt(ride.departureTime);
        const isPM = ride.departureTime.includes("PM");
        const h24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
        if (timeFilter === "morning") matchesTime = h24 >= 5 && h24 < 12;
        else if (timeFilter === "afternoon") matchesTime = h24 >= 12 && h24 < 17;
        else if (timeFilter === "evening") matchesTime = h24 >= 17 || h24 < 5;
      }

      return matchesSearch && matchesPrice && matchesTime;
    });
  }, [liveRides, searchQuery, priceFilter, timeFilter]);

  const mapMarkers = useMemo(() => {
    const m: { position: [number, number]; type: "start" | "end" | "user" | "default" }[] = [];
    filteredRides.forEach((ride: any) => {
      if (ride.fromCoords) m.push({ position: ride.fromCoords, type: "start" });
      if (ride.toCoords) m.push({ position: ride.toCoords, type: "end" });
    });
    return m;
  }, [filteredRides]);

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 pt-[env(safe-area-inset-top)]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 pt-3 pb-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#00C9B1] outline-none transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                showFilters ? "bg-[#1A3C6E] text-white" : "hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="space-y-3 pb-3 animate-in slide-in-from-top-2">
              <div>
                <p className="text-[12px] text-muted-foreground mb-1.5">Price Range</p>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "low", "mid", "high"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPriceFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                        priceFilter === f
                          ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                          : "border-border hover:border-[#00C9B1]"
                      }`}
                    >
                      {f === "all" ? "All" : f === "low" ? "Under $5" : f === "mid" ? "$5-$10" : "$10+"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground mb-1.5">Time</p>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "morning", "afternoon", "evening"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTimeFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors capitalize ${
                        timeFilter === f
                          ? "bg-[#1A3C6E] text-white border-[#1A3C6E]"
                          : "border-border hover:border-[#00C9B1]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Map / List */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">{isLoading ? "..." : filteredRides.length}</span> rides available
        </p>
        <button
          onClick={() => setShowMap(!showMap)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
            showMap
              ? "bg-[#00C9B1] text-white border-[#00C9B1]"
              : "border-border hover:border-[#00C9B1]"
          }`}
        >
          <MapPin className="w-3 h-3" />
          {showMap ? "List View" : "Map View"}
        </button>
      </div>

      {/* Map View */}
      {showMap && !isLoading && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3 animate-in fade-in">
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-border">
            <MapView
             center={filteredRides.length > 0 && filteredRides[0].fromCoords ? [filteredRides[0].fromCoords[0], filteredRides[0].fromCoords[1]] : [33.6844, 73.0479]}
                  zoom={12}
              markers={mapMarkers}
              darkMode={isDarkMode}
              interactive={true}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-24 space-y-3 flex-1">
        {isLoading ? (
          // 5. SKELETON LOADER
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-[140px] rounded-3xl bg-card border border-border animate-pulse flex flex-col p-4">
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
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride: any) => (
            <div key={ride.id} className="animate-in fade-in slide-in-from-bottom-2">
               <RideCard ride={ride} />
            </div>
          ))
        ) : (
          <div className="text-center py-16 animate-in fade-in">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground">No rides found</p>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-[250px] mx-auto">
              Try adjusting your search criteria or changing the filters to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#00C9B1]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}