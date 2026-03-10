'use client';

import { useState, useMemo, useEffect } from "react";
import { MapPin, Circle, Home, GraduationCap,ArrowRight, Star, Search, ChevronUp, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";
import dynamic from 'next/dynamic';
import Pusher from "pusher-js";
import { getActiveRide } from "@/lib/actions/ride.actions";

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

export default function HomePage() {
  const router = useRouter();
  const { availableRides, isDarkMode, savedPlaces } = useApp();
  const [sheetOpen, setSheetOpen] = useState(true);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [activeRide, setActiveRide] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);

  // 1. Check for an active ride when the home page loads
  useEffect(() => {
    const checkActiveRide = async () => {
      const ride = await getActiveRide();
      if (ride) setActiveRide(ride);
    };
    checkActiveRide();
  }, []);

  // 2. If there is an active ride, listen to Pusher!
  useEffect(() => {
    if (!activeRide) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`ride-${activeRide._id}`);

    // If I'm the passenger, listen for the driver
    channel.bind("driver-update", (data: { lat: number, lng: number }) => {
      setLiveLocation(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`ride-${activeRide._id}`);
    };
  }, [activeRide]);

  // Show ride markers on the map
  const markers = useMemo(() => {
    const m: { position: [number, number]; type: MarkerType }[] = [
      { position: USER_LOCATION, type: "user" },
    ];
    availableRides.slice(0, 5).forEach((ride) => {
      m.push({ position: ride.fromCoords, type: "start" });
    });
    if (!activeRide) {
      return m;
    }
    // IF ACTIVE RIDE EXISTS: Take over the map!
    const markers: any[] = [
      { position: [activeRide.originCoords.lat, activeRide.originCoords.lng], type: "start" },
      { position: [activeRide.destinationCoords.lat, activeRide.destinationCoords.lng], type: "end" },
    ];

    // Add the moving car or the latest known location from the database
    if (liveLocation) {
      markers.push({ position: [liveLocation.lat, liveLocation.lng], type: "user" });
    } else if (activeRide.currentLocation) {
      // Fallback: If Pusher hasn't sent an update yet, show the last saved DB location
      markers.push({ position: [activeRide.currentLocation.lat, activeRide.currentLocation.lng], type: "user" });
    }

    return markers;
  }, [activeRide, liveLocation]);

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
      {activeRide && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-[#1A3C6E] text-white p-4 rounded-2xl shadow-lg flex justify-between items-center cursor-pointer" onClick={() => router.push(`/ride/${activeRide._id}`)}>
           <div>
             <p className="text-xs text-[#00C9B1] font-bold tracking-wider uppercase mb-1">Ride in Progress</p>
             <p className="font-medium text-sm">Heading to {activeRide.destination}</p>
           </div>
           <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
             <ArrowRight className="w-4 h-4 text-white" />
           </div>
        </div>
      )}
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
        className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out ${sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"
          }`}
      >
        {/* Drag Handle */}
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          className="w-full flex justify-center pt-2 pb-1"
        >
          <div className="flex flex-col items-center gap-0.5">
            <ChevronUp
              className={`w-5 h-5 text-muted-foreground transition-transform ${sheetOpen ? "rotate-180" : ""
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