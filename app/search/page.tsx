'use client';

import { Suspense, useState, useMemo } from "react";
import { ArrowLeft, SlidersHorizontal, Search, X, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/app-context";
import { RideCard } from "@/components/ride-card";
import { LOCATION_COORDS } from "@/components/locations";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import('@/components/map-view').then(mod => mod.MapView || mod.default), { 
  ssr: false 
});

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { availableRides, isDarkMode } = useApp();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || searchParams.get("pickup") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "mid" | "high">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [showMap, setShowMap] = useState(false);

  const filteredRides = useMemo(() => {
    return availableRides.filter((ride) => {
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
      if (timeFilter !== "all") {
        const hour = parseInt(ride.departureTime);
        const isPM = ride.departureTime.includes("PM");
        const h24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
        if (timeFilter === "morning") matchesTime = h24 >= 5 && h24 < 12;
        else if (timeFilter === "afternoon") matchesTime = h24 >= 12 && h24 < 17;
        else if (timeFilter === "evening") matchesTime = h24 >= 17 || h24 < 5;
      }

      return matchesSearch && matchesPrice && matchesTime;
    });
  }, [availableRides, searchQuery, priceFilter, timeFilter]);

  const mapMarkers = useMemo(() => {
    const m: { position: [number, number]; type: "start" | "end" | "user" | "default" }[] = [];
    filteredRides.forEach((ride) => {
      m.push({ position: ride.fromCoords, type: "start" });
      m.push({ position: ride.toCoords, type: "end" });
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
            <div className="space-y-3 pb-3">
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
          <span className="font-semibold text-foreground">{filteredRides.length}</span> rides available
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
      {showMap && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-border">
            <MapView
              markers={mapMarkers}
              darkMode={isDarkMode}
              interactive={true}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-24 space-y-3 flex-1">
        {filteredRides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
        {filteredRides.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No rides found</p>
            <p className="text-[13px] text-muted-foreground/60 mt-1">
              Try adjusting your search or filters
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
        Loading search...
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}