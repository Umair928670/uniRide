'use client';

import { useState, useMemo } from "react";
import { MapPin, Circle, Home, GraduationCap, Star, Search, ChevronUp, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";
import dynamic from 'next/dynamic';

type MarkerType = "start" | "end" | "user" | "default";

type MapViewProps = {
  center: [number, number];
  zoom: number;
  markers: { position: [number, number]; type: MarkerType }[];
  interactive?: boolean;
  darkMode?: boolean;
  className?: string;
};

const MapView = dynamic<MapViewProps>(
  () => import('@/components/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

const USER_LOCATION: [number, number] = [37.4275, -122.1697];

export  default function HomePage() {
  const router = useRouter();
  const { availableRides, isDarkMode, savedPlaces } = useApp();
  const [sheetOpen, setSheetOpen] = useState(true);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  // Show ride markers on the map
const markers = useMemo(() => {
    const m: { position: [number, number]; type: MarkerType }[] = [
      { position: USER_LOCATION, type: "user" },
    ];
    availableRides.slice(0, 5).forEach((ride) => {
      m.push({ position: ride.fromCoords, type: "start" });
    });
    return m;
  }, [availableRides]);

  const handleFindRide = () => {
    const combined = [destination, pickup].filter(Boolean).join(" ");
    const params = new URLSearchParams();
    if (combined) params.set("q", combined);
    router.push(`/search?${params.toString()}`);
  };

  const handleQuickPlace = (label: string) => {
    const place = savedPlaces.find((p) => p.label === label);
    if (place) {
      setDestination(place.address);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Interactive Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView
          center={USER_LOCATION}
          zoom={14}
          markers={markers}
          interactive={true}
          darkMode={isDarkMode}
          className="w-full h-full"
        />
      </div>

      {/* Locate me button */}
      <button
        className="absolute top-20 right-4 z-20 w-11 h-11 bg-card rounded-xl shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        title="My Location"
      >
        <Navigation className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
      </button>

      {/* Bottom Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out ${
          sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"
        }`}
      >
        {/* Drag Handle */}
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          className="w-full flex justify-center pt-2 pb-1"
        >
          <div className="flex flex-col items-center gap-0.5">
            <ChevronUp
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                sheetOpen ? "rotate-180" : ""
              }`}
            />
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </button>

        <div className="bg-card rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] max-w-lg mx-auto">
          <div className="px-5 pt-4 pb-28 space-y-4">
            {/* Destination Input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00C9B1]" />
              <input
                type="text"
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Pickup Input */}
            <div className="relative">
              <Circle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3C6E]" />
              <input
                type="text"
                placeholder="Pickup point"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#1A3C6E] focus:ring-2 focus:ring-[#1A3C6E]/20 outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Quick Action Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => handleQuickPlace("Home")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FA] dark:bg-[#1C2333] border border-border hover:border-[#00C9B1] transition-colors whitespace-nowrap active:scale-95"
              >
                <Home className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                <span className="text-[13px]">Home</span>
              </button>
              <button
                onClick={() => handleQuickPlace("University")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FA] dark:bg-[#1C2333] border border-border hover:border-[#00C9B1] transition-colors whitespace-nowrap active:scale-95"
              >
                <GraduationCap className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                <span className="text-[13px]">University</span>
              </button>
              <button
                onClick={() => handleQuickPlace("Gym")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FA] dark:bg-[#1C2333] border border-border hover:border-[#00C9B1] transition-colors whitespace-nowrap active:scale-95"
              >
                <Star className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                <span className="text-[13px]">Saved Places</span>
              </button>
            </div>

            {/* Available rides count */}
            {/* <div className="flex items-center justify-between px-1">
              <p className="text-[13px] text-muted-foreground">
                <span className="text-[#00C9B1] font-semibold">{availableRides.length}</span> rides available nearby
              </p>
              <button
                onClick={() => navigate("/search")}
                className="text-[13px] text-[#1A3C6E] dark:text-[#00C9B1] font-medium"
              >
                Browse all →
              </button>
            </div> */}

            {/* Find Ride CTA */}
            <button
              onClick={handleFindRide}
              className="w-full py-4 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1A3C6E]/25"
            >
              <Search className="w-5 h-5" />
              Find Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}