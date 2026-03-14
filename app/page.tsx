// 'use client';

// import { useState, useMemo, useEffect, useRef } from "react";
// import { MapPin, Circle, Home, GraduationCap, ArrowRight, Star, Search, ChevronUp, Navigation, X, Loader2, Plus, Bookmark, Edit2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useApp } from "@/components/app-context";
// import dynamic from 'next/dynamic';
// import Pusher from "pusher-js";
// import { updateUser } from "@/lib/actions/user.actions";
// import useSWR from "swr";
// import { gsap } from "gsap";

// type MarkerType = "start" | "end" | "user" | "default";
// type MapViewProps = {
//   center: [number, number];
//   zoom: number;
//   markers: { position: [number, number]; type: MarkerType }[];
//   routePoints?: [number, number][];
//   interactive?: boolean;
//   darkMode?: boolean;
//   className?: string;
// };

// const MapView = dynamic<MapViewProps>(
//   () => import('@/components/map-view').then((mod) => mod.MapView),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="w-full h-full bg-[#E5E3DF] dark:bg-[#1A1A1A] flex flex-col items-center justify-center animate-pulse">
//         <Loader2 className="w-8 h-8 animate-spin text-[#00C9B1] mb-2" />
//         <p className="text-muted-foreground text-[13px] font-medium tracking-wide">Connecting to GPS...</p>
//       </div>
//     )
//   }
// );

// const DEFAULT_LOCATION: [number, number] = [33.6844, 73.0479];

// const fetchActiveRide = async () => {
//   const { getActiveRide } = await import("@/lib/actions/ride.actions");
//   return getActiveRide();
// };

// export default function HomePage() {
//   const router = useRouter();
//   const { user, isDarkMode, updateProfile, addNotification, activeRole } = useApp();
//   const savedPlaces = user?.savedPlaces || [];
//   const isDriverMode = user?.role === "driver" || activeRole === "driver";

//   // ✅ GSAP refs
//   const sheetRef = useRef<HTMLDivElement>(null);
//   const ridebannerRef = useRef<HTMLDivElement>(null);
//   const navBtnRef = useRef<HTMLButtonElement>(null);
//   const inputsRef = useRef<HTMLDivElement>(null);
//   const chipsRef = useRef<HTMLDivElement>(null);
//   const findRideBtnRef = useRef<HTMLButtonElement>(null);
//   const modalRef = useRef<HTMLDivElement>(null);
//   const saveModalRef = useRef<HTMLDivElement>(null);

//   const customSavedPlaces = savedPlaces.filter((p: any) => {
//     const identifier = p.label || p.name;
//     return identifier !== "Home" && identifier !== "University";
//   });
//   const homePlace = savedPlaces.find((p: any) => (p.label || p.name) === "Home");
//   const uniPlace = savedPlaces.find((p: any) => (p.label || p.name) === "University");

//   const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_LOCATION);
//   const [mapZoom, setMapZoom] = useState(13);
//   const [sheetOpen, setSheetOpen] = useState(true);
//   const [pickup, setPickup] = useState("");
//   const [destination, setDestination] = useState("");
//   const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);
//   const [showSavedPlacesList, setShowSavedPlacesList] = useState(false);
//   const [savingPlaceLabel, setSavingPlaceLabel] = useState<string | null>(null);
//   const [newPlaceName, setNewPlaceName] = useState("");
//   const [newPlaceAddress, setNewPlaceAddress] = useState("");
//   const [isSavingPlace, setIsSavingPlace] = useState(false);
//   const [newPlaceCoords, setNewPlaceCoords] = useState<[number, number] | null>(null);
//   const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
//   const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
//   const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);

//   const { data: activeRide, isLoading: isRideLoading } = useSWR('activeRide', fetchActiveRide, {
//     revalidateOnFocus: true,
//     dedupingInterval: 5000,
//     refreshInterval: 15000,
//   });

//   // ✅ GSAP: Animate bottom sheet and UI on mount
//   useEffect(() => {
//     const tl = gsap.timeline({ delay: 0.1 });

//     // Sheet slides up
//     if (sheetRef.current) {
//       tl.fromTo(
//         sheetRef.current,
//         { y: 120, opacity: 0 },
//         { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
//       );
//     }

//     // Inputs fade in with stagger
//     if (inputsRef.current) {
//       const inputs = inputsRef.current.querySelectorAll('.anim-input');
//       tl.fromTo(
//         inputs,
//         { y: 16, opacity: 0 },
//         { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 },
//         "-=0.3"
//       );
//     }

//     // Chips slide in from left
//     if (chipsRef.current) {
//       const chips = chipsRef.current.querySelectorAll('.anim-chip');
//       tl.fromTo(
//         chips,
//         { x: -20, opacity: 0 },
//         { x: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.08 },
//         "-=0.2"
//       );
//     }

//     // Find ride button pops in
//     if (findRideBtnRef.current) {
//       tl.fromTo(
//         findRideBtnRef.current,
//         { scale: 0.92, opacity: 0 },
//         { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" },
//         "-=0.1"
//       );
//     }

//     // Nav location button
//     if (navBtnRef.current) {
//       tl.fromTo(
//         navBtnRef.current,
//         { scale: 0, opacity: 0 },
//         { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
//         "-=0.3"
//       );
//     }
//   }, []);

//   // ✅ GSAP: Active ride banner animates in when data arrives
//   useEffect(() => {
//     if (activeRide && ridebannerRef.current) {
//       gsap.fromTo(
//         ridebannerRef.current,
//         { y: -30, opacity: 0, scale: 0.95 },
//         { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }
//       );
//     }
//   }, [activeRide]);

//   // ✅ GSAP: Sheet open/close animation
//   const handleSheetToggle = () => {
//     if (!sheetRef.current) { setSheetOpen(!sheetOpen); return; }
//     setSheetOpen((prev) => !prev);
//   };

//   // ✅ GSAP: Modal open animation
//   useEffect(() => {
//     if (showSavedPlacesList && modalRef.current) {
//       gsap.fromTo(
//         modalRef.current.querySelector('.modal-card'),
//         { y: 40, opacity: 0, scale: 0.96 },
//         { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }
//       );
//     }
//   }, [showSavedPlacesList]);

//   useEffect(() => {
//     if (savingPlaceLabel && saveModalRef.current) {
//       gsap.fromTo(
//         saveModalRef.current.querySelector('.modal-card'),
//         { y: 40, opacity: 0, scale: 0.96 },
//         { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }
//       );
//     }
//   }, [savingPlaceLabel]);

//   // ✅ GSAP: Button press micro-animation
//   const animatePress = (el: HTMLElement | null, callback?: () => void) => {
//     if (!el) { callback?.(); return; }
//     gsap.timeline()
//       .to(el, { scale: 0.94, duration: 0.1, ease: "power2.in" })
//       .to(el, { scale: 1, duration: 0.35, ease: "elastic.out(1.2, 0.5)" });
//     setTimeout(() => callback?.(), 80);
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => {
//           setMapCenter([pos.coords.latitude, pos.coords.longitude]);
//           setMapZoom(15);
//         },
//         () => console.log("GPS denied or unavailable.")
//       );
//     }
//   }, []);

//   const searchLocation = async (query: string, setter: any) => {
//     if (query.length < 3) { setter([]); return; }
//     try {
//       const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
//       const data = await res.json();
//       setter(data.map((item: any) => ({
//         name: item.display_name,
//         lat: parseFloat(item.lat),
//         lng: parseFloat(item.lon)
//       })));
//     } catch (e) {
//       console.error("Geocoding error", e);
//     }
//   };

//   useEffect(() => {
//     const delay = setTimeout(() => {
//       if (newPlaceAddress && !newPlaceCoords) searchLocation(newPlaceAddress, setAddressSuggestions);
//     }, 800);
//     return () => clearTimeout(delay);
//   }, [newPlaceAddress, newPlaceCoords]);

//   useEffect(() => {
//     if (!activeRide) return;
//     const fetchRoadRoute = async () => {
//       try {
//         const { originCoords, destinationCoords } = activeRide;
//         const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`);
//         const data = await res.json();
//         if (data.routes?.length > 0) {
//           setRoadRoute(data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]));
//         }
//       } catch (error) {
//         console.error("Failed to fetch road route:", error);
//       }
//     };
//     fetchRoadRoute();
//   }, [activeRide]);

//   useEffect(() => {
//     if (!activeRide) return;
//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
//       cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//     });
//     const channel = pusher.subscribe(`ride-${activeRide._id}`);
//     channel.bind("driver-update", (data: { lat: number, lng: number }) => {
//       setLiveLocation(data);
//     });
//     return () => {
//       channel.unbind_all();
//       pusher.unsubscribe(`ride-${activeRide._id}`);
//     };
//   }, [activeRide]);

//   const markers = useMemo(() => {
//     if (!activeRide) return [];
//     const m: any[] = [
//       { position: [activeRide.originCoords.lat, activeRide.originCoords.lng], type: "start" },
//       { position: [activeRide.destinationCoords.lat, activeRide.destinationCoords.lng], type: "end" },
//     ];
//     if (liveLocation) m.push({ position: [liveLocation.lat, liveLocation.lng], type: "user" });
//     else if (activeRide.currentLocation) m.push({ position: [activeRide.currentLocation.lat, activeRide.currentLocation.lng], type: "user" });
//     return m;
//   }, [activeRide, liveLocation]);

//   const activeRoutePoints = useMemo(() => {
//     if (!activeRide) return undefined;
//     const points: [number, number][] = [];
//     if (liveLocation) points.push([liveLocation.lat, liveLocation.lng]);
//     else if (activeRide.currentLocation) points.push([activeRide.currentLocation.lat, activeRide.currentLocation.lng]);
//     else points.push([activeRide.originCoords.lat, activeRide.originCoords.lng]);
//     if (roadRoute.length > 0) points.push(...roadRoute);
//     else {
//       points.push([activeRide.originCoords.lat, activeRide.originCoords.lng]);
//       points.push([activeRide.destinationCoords.lat, activeRide.destinationCoords.lng]);
//     }
//     return points as [number, number][];
//   }, [activeRide, liveLocation, roadRoute]);

//   const handleFindRide = (e: React.MouseEvent<HTMLButtonElement>) => {
//     animatePress(e.currentTarget, () => {
//       const combined = [destination, pickup].filter(Boolean).join(" ");
//       const params = new URLSearchParams();
//       if (combined) params.set("q", combined);
//       router.push(`/search?${params.toString()}`);
//     });
//   };

//   const handleQuickPlace = (label: "Home" | "University") => {
//     const place = savedPlaces.find((p: any) => (p.label || p.name) === label);
//     if (place) {
//       setDestination(place.address);
//       addNotification("info", `${label} selected`);
//     } else {
//       setSavingPlaceLabel(label);
//       setNewPlaceAddress("");
//       setNewPlaceCoords(null);
//     }
//   };

//   const handleEditPlace = (placeLabel: string) => {
//     const place = savedPlaces.find((p: any) => (p.label || p.name) === placeLabel);
//     if (place) {
//       setSavingPlaceLabel(placeLabel);
//       setNewPlaceAddress(place.address);
//       setNewPlaceCoords([place.lat, place.lng]);
//     }
//   };

//   const handleSelectCustomPlace = (address: string, label: string) => {
//     setDestination(address);
//     setShowSavedPlacesList(false);
//     addNotification("info", `${label} selected`);
//   };

//   const submitNewPlace = async () => {
//     const finalLabel = savingPlaceLabel === "Custom" ? newPlaceName : savingPlaceLabel;
//     if (!newPlaceAddress.trim() || !finalLabel?.trim() || !user || !newPlaceCoords) return;

//     const isEditing = savedPlaces.some((p: any) => (p.label || p.name) === finalLabel);

//     if (savingPlaceLabel === "Custom" && !isEditing) {
//       const nameExists = savedPlaces.some((p: any) => (p.label || p.name)?.toLowerCase() === finalLabel.toLowerCase());
//       if (nameExists) { addNotification("warning", `You already have a place named "${finalLabel}".`); return; }
//     }

//     const addressExists = savedPlaces.find((p: any) => p.address?.toLowerCase() === newPlaceAddress.toLowerCase());
//     if (addressExists) {
//       const existingName = addressExists.label || addressExists.name;
//       if (existingName !== finalLabel) { addNotification("warning", `This address is already saved as "${existingName}".`); return; }
//     }

//     setIsSavingPlace(true);
//     try {
//       const newPlace = { label: finalLabel, address: newPlaceAddress, lat: newPlaceCoords[0], lng: newPlaceCoords[1], icon: savingPlaceLabel === "Custom" ? "bookmark" : "map-pin" };
//       const updatedPlaces = isEditing
//         ? savedPlaces.map((p: any) => (p.label || p.name) === finalLabel ? newPlace : p)
//         : [...savedPlaces, newPlace];
//       await updateUser({ savedPlaces: updatedPlaces });
//       updateProfile({ savedPlaces: updatedPlaces });
//       setDestination(newPlaceAddress);
//       addNotification("success", `${finalLabel} saved successfully!`);
//       setSavingPlaceLabel(null); setNewPlaceName(""); setNewPlaceAddress(""); setNewPlaceCoords(null);
//     } catch {
//       addNotification("warning", "Failed to save place. Try again.");
//     } finally {
//       setIsSavingPlace(false);
//     }
//   };

//   return (
//     <div className="relative w-full h-full overflow-hidden">

//       {/* ✅ Active ride banner with GSAP ref */}
//       {isRideLoading ? (
//         <div className="absolute top-4 left-4 right-4 z-50 bg-card border border-border p-4 rounded-2xl shadow-lg flex justify-between items-center animate-pulse">
//           <div className="space-y-2">
//             <div className="w-24 h-3 rounded bg-muted" />
//             <div className="w-40 h-4 rounded bg-muted" />
//           </div>
//           <div className="w-8 h-8 rounded-full bg-muted" />
//         </div>
//       ) : activeRide ? (
//         <div
//           ref={ridebannerRef}
//           className="absolute top-4 left-4 right-4 z-50 bg-[#1A3C6E] text-white p-4 rounded-2xl shadow-lg flex justify-between items-center cursor-pointer hover:bg-[#1A3C6E]/90 transition-colors"
//           onClick={() => router.push(`/ride/${activeRide._id}`)}
//         >
//           <div>
//             <p className="text-xs text-[#00C9B1] font-bold tracking-wider uppercase mb-1">Ride in Progress</p>
//             <p className="font-medium text-sm">Heading to {activeRide.destination}</p>
//           </div>
//           <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
//             <ArrowRight className="w-4 h-4 text-white" />
//           </div>
//         </div>
//       ) : null}

//       {/* Map */}
//       <div className="absolute inset-0 z-0">
//         <MapView center={mapCenter} zoom={mapZoom} markers={markers} routePoints={activeRoutePoints} interactive darkMode={isDarkMode} className="w-full h-full" />
//       </div>

//       {/* Location button */}
//       <button
//         ref={navBtnRef}
//         onClick={() => {
//           if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition((pos) => {
//               setMapCenter([pos.coords.latitude, pos.coords.longitude]);
//               setMapZoom(16);
//             });
//           }
//         }}
//         className="absolute top-4 right-4 z-20 w-11 h-11 bg-card rounded-xl shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
//         title="My Location"
//       >
//         <Navigation className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
//       </button>

//       {/* ✅ Bottom sheet with GSAP ref */}
//       <div
//         ref={sheetRef}
//         className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out ${sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-64px)]"}`}
//       >
//         <button onClick={handleSheetToggle} className="w-full flex justify-center pt-2 pb-1">
//           <div className="flex flex-col items-center gap-0.5">
//             <ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${sheetOpen ? "rotate-180" : ""}`} />
//             <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
//           </div>
//         </button>

//         <div className="bg-card rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] max-w-lg mx-auto">
//           {!isDriverMode && (
//             <div className="px-5 pt-4 pb-28 space-y-4">

//               {/* Inputs */}
//               <div ref={inputsRef} className="space-y-3">
//                 <div className="relative anim-input">
//                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00C9B1]" />
//                   <input
//                     type="text"
//                     placeholder="Where are you going?"
//                     value={destination}
//                     onChange={(e) => setDestination(e.target.value)}
//                     className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all placeholder:text-muted-foreground"
//                   />
//                 </div>
//                 <div className="relative anim-input">
//                   <Circle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3C6E]" />
//                   <input
//                     type="text"
//                     placeholder="Pickup point"
//                     value={pickup}
//                     onChange={(e) => setPickup(e.target.value)}
//                     className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#1A3C6E] focus:ring-2 focus:ring-[#1A3C6E]/20 outline-none transition-all placeholder:text-muted-foreground"
//                   />
//                 </div>
//               </div>

//               {/* Quick place chips */}
//               <div ref={chipsRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
//                 <div className="flex items-center bg-[#F5F7FA] dark:bg-[#1C2333] border border-border rounded-full overflow-hidden hover:border-[#00C9B1] transition-colors shrink-0 anim-chip">
//                   <button onClick={() => handleQuickPlace("Home")} className="flex items-center gap-1.5 pl-4 pr-3 py-2 hover:bg-muted/50 transition-colors active:scale-95">
//                     <Home className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                     <span className="text-[13px]">Home</span>
//                   </button>
//                   {homePlace && (
//                     <button onClick={() => handleEditPlace("Home")} className="pr-3 pl-2 py-2 border-l border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-[#00C9B1]">
//                       <Edit2 className="w-3.5 h-3.5" />
//                     </button>
//                   )}
//                 </div>

//                 <div className="flex items-center bg-[#F5F7FA] dark:bg-[#1C2333] border border-border rounded-full overflow-hidden hover:border-[#00C9B1] transition-colors shrink-0 anim-chip">
//                   <button onClick={() => handleQuickPlace("University")} className="flex items-center gap-1.5 pl-4 pr-3 py-2 hover:bg-muted/50 transition-colors active:scale-95">
//                     <GraduationCap className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                     <span className="text-[13px]">University</span>
//                   </button>
//                   {uniPlace && (
//                     <button onClick={() => handleEditPlace("University")} className="pr-3 pl-2 py-2 border-l border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-[#00C9B1]">
//                       <Edit2 className="w-3.5 h-3.5" />
//                     </button>
//                   )}
//                 </div>

//                 <button
//                   onClick={() => setShowSavedPlacesList(true)}
//                   className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FA] dark:bg-[#1C2333] border border-border hover:border-[#00C9B1] transition-colors whitespace-nowrap active:scale-95 shrink-0 anim-chip"
//                 >
//                   <Bookmark className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                   <span className="text-[13px]">Saved Places</span>
//                 </button>
//               </div>

//               {/* Find ride button */}
//               <button
//                 ref={findRideBtnRef}
//                 onClick={handleFindRide}
//                 className="w-full py-4 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1A3C6E]/25"
//               >
//                 <Search className="w-5 h-5" /> Find Ride
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Saved places modal */}
//       {showSavedPlacesList && (
//         <div ref={modalRef} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="modal-card bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border flex flex-col max-h-[80vh]">
//             <div className="flex items-center justify-between p-4 border-b border-border">
//               <h3 className="font-bold text-lg flex items-center gap-2">
//                 <Bookmark className="w-5 h-5 text-[#00C9B1]" /> Saved Places
//               </h3>
//               <button onClick={() => setShowSavedPlacesList(false)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-90">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="overflow-y-auto p-2">
//               {customSavedPlaces.length === 0 ? (
//                 <div className="text-center py-8 px-4">
//                   <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
//                     <Star className="w-6 h-6 text-muted-foreground/40" />
//                   </div>
//                   <p className="font-medium text-muted-foreground">No places saved yet</p>
//                   <p className="text-[12px] text-muted-foreground/60 mt-1">Save your gym, work, or favorite spots to book rides faster.</p>
//                 </div>
//               ) : (
//                 <div className="space-y-1">
//                   {customSavedPlaces.map((place: any, index: number) => (
//                     <div key={index} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted transition-colors group">
//                       <button onClick={() => handleSelectCustomPlace(place.address, place.label || place.name)} className="flex items-center gap-3 flex-1 text-left min-w-0">
//                         <div className="w-10 h-10 rounded-full bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center shrink-0">
//                           <MapPin className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                         </div>
//                         <div className="min-w-0 flex-1 pr-2">
//                           <p className="font-semibold text-[14px] truncate">{place.label || place.name}</p>
//                           <p className="text-[12px] text-muted-foreground truncate">{place.address}</p>
//                         </div>
//                       </button>
//                       <button onClick={() => handleEditPlace(place.label || place.name)} className="p-2 text-muted-foreground hover:text-[#00C9B1] hover:bg-background rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
//                         <Edit2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="p-4 border-t border-border bg-card rounded-b-3xl">
//               <button
//                 onClick={() => { setShowSavedPlacesList(false); setSavingPlaceLabel("Custom"); setNewPlaceName(""); setNewPlaceAddress(""); setNewPlaceCoords(null); }}
//                 className="w-full py-3.5 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
//               >
//                 <Plus className="w-4 h-4" /> Add New Place
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Save place modal */}
//       {savingPlaceLabel && (
//         <div ref={saveModalRef} className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="modal-card bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border">
//             <div className="flex items-center justify-between p-4 border-b border-border">
//               <h3 className="font-bold text-lg flex items-center gap-2">
//                 {savingPlaceLabel === "Home" ? <Home className="w-5 h-5 text-[#00C9B1]" /> : savingPlaceLabel === "University" ? <GraduationCap className="w-5 h-5 text-[#00C9B1]" /> : <Star className="w-5 h-5 text-[#00C9B1]" />}
//                 {savingPlaceLabel === "Custom" ? "Add New Place" : `Save ${savingPlaceLabel}`}
//               </h3>
//               <button onClick={() => { setSavingPlaceLabel(null); setNewPlaceCoords(null); }} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-90">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-5 space-y-4">
//               {savingPlaceLabel === "Custom" && (
//                 <div>
//                   <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Name of Place</label>
//                   <div className="relative">
//                     <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                     <input type="text" autoFocus placeholder="e.g. Gym, Work, Cafe" value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]" />
//                   </div>
//                 </div>
//               )}

//               <div className="relative z-50">
//                 <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Full Address</label>
//                 <div className="relative">
//                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
//                   <input
//                     type="text"
//                     autoFocus={savingPlaceLabel !== "Custom"}
//                     placeholder="e.g. 123 Main St, City"
//                     value={newPlaceAddress}
//                     onChange={(e) => { setNewPlaceAddress(e.target.value); setNewPlaceCoords(null); setShowAddressSuggestions(true); }}
//                     onFocus={() => setShowAddressSuggestions(true)}
//                     className={`w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px] ${!newPlaceCoords && newPlaceAddress.length > 0 ? "border-amber-400 focus:border-amber-400" : ""}`}
//                   />
//                   {showAddressSuggestions && addressSuggestions.length > 0 && (
//                     <div className="absolute left-0 right-0 top-full mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden max-h-48 overflow-y-auto">
//                       {addressSuggestions.map((s, i) => (
//                         <button
//                           key={i}
//                           onMouseDown={(e) => { e.preventDefault(); const shortName = s.name.split(", ").slice(0, 3).join(", "); setNewPlaceAddress(shortName); setNewPlaceCoords([s.lat, s.lng]); setShowAddressSuggestions(false); }}
//                           className="w-full text-left px-4 py-3 text-[13px] hover:bg-muted transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
//                         >
//                           <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
//                           <span className="line-clamp-2">{s.name}</span>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 {!newPlaceCoords && newPlaceAddress.length > 0 && (
//                   <p className="text-[11px] text-amber-500 mt-1.5 ml-1">Please select an address from the dropdown list.</p>
//                 )}
//               </div>

//               <button
//                 onClick={submitNewPlace}
//                 disabled={!newPlaceCoords || (savingPlaceLabel === "Custom" && !newPlaceName.trim()) || isSavingPlace}
//                 className="w-full py-3.5 mt-2 rounded-xl bg-[#00C9B1] text-white font-semibold hover:bg-[#00C9B1]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isSavingPlace ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save & Use Location"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import { MapPin, Circle, Home, GraduationCap, ArrowRight, Star, Search, ChevronUp, Navigation, X, Loader2, Plus, Bookmark, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";
import dynamic from 'next/dynamic';
import Pusher from "pusher-js";
import { updateUser } from "@/lib/actions/user.actions";
import useSWR from "swr";
import { useGsap } from "@/lib/hooks/use-gsap";


type MarkerType = "start" | "end" | "user" | "default";
type MapViewProps = {
  center: [number, number];
  zoom: number;
  markers: { position: [number, number]; type: MarkerType }[];
  routePoints?: [number, number][];
  interactive?: boolean;
  darkMode?: boolean;
  className?: string;
};

const MapView = dynamic<MapViewProps>(
  () => import('@/components/map-view').then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#E5E3DF] dark:bg-[#1A1A1A] flex flex-col items-center justify-center animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C9B1] mb-2" />
        <p className="text-muted-foreground text-[13px] font-medium tracking-wide">Connecting to GPS...</p>
      </div>
    )
  }
);

const DEFAULT_LOCATION: [number, number] = [33.6844, 73.0479];

const fetchActiveRide = async () => {
  const { getActiveRide } = await import("@/lib/actions/ride.actions");
  return getActiveRide();
};

export default function HomePage() {
  const router = useRouter();
  const { user, isDarkMode, updateProfile, addNotification, activeRole } = useApp();
  const gsap = useGsap(); // ✅ clean, reusable, no SSR crash


  const savedPlaces = user?.savedPlaces || [];
  const isDriverMode = user?.role === "driver" || activeRole === "driver";

  // DOM refs
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetInnerRef = useRef<HTMLDivElement>(null);
  const ridebannerRef = useRef<HTMLDivElement>(null);
  const navBtnRef = useRef<HTMLButtonElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const findRideBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const saveModalRef = useRef<HTMLDivElement>(null);

  const customSavedPlaces = savedPlaces.filter((p: any) => {
    const identifier = p.label || p.name;
    return identifier !== "Home" && identifier !== "University";
  });
  const homePlace = savedPlaces.find((p: any) => (p.label || p.name) === "Home");
  const uniPlace = savedPlaces.find((p: any) => (p.label || p.name) === "University");

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_LOCATION);
  const [mapZoom, setMapZoom] = useState(13);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showSavedPlacesList, setShowSavedPlacesList] = useState(false);
  const [savingPlaceLabel, setSavingPlaceLabel] = useState<string | null>(null);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [newPlaceCoords, setNewPlaceCoords] = useState<[number, number] | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);

  const { data: activeRide, isLoading: isRideLoading } = useSWR('activeRide', fetchActiveRide, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    refreshInterval: 15000,
  });

  // ✅ Page mount animations
  useEffect(() => {
    const timer = setTimeout(() => {
      const g = gsap.current;
      if (!g) return;

      const tl = g.timeline();

      if (sheetRef.current) {
        tl.fromTo(sheetRef.current,
          { y: 120, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
      }

      if (inputsRef.current) {
        const inputs = inputsRef.current.querySelectorAll('.anim-input');
        if (inputs.length > 0) {
          tl.fromTo(inputs,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 },
            "-=0.3"
          );
        }
      }

      if (chipsRef.current) {
        const chips = chipsRef.current.querySelectorAll('.anim-chip');
        if (chips.length > 0) {
          tl.fromTo(chips,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.08 },
            "-=0.2"
          );
        }
      }

      if (findRideBtnRef.current) {
        tl.fromTo(findRideBtnRef.current,
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" },
          "-=0.1"
        );
      }

      if (navBtnRef.current) {
        tl.fromTo(navBtnRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
          "-=0.3"
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Active ride banner animation
  useEffect(() => {
    const g = gsap.current;
    if (activeRide && ridebannerRef.current && g) {
      g.fromTo(ridebannerRef.current,
        { y: -30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }
      );
    }
  }, [activeRide]);

  // ✅ Saved places modal animation
  useEffect(() => {
    const g = gsap.current;
    if (showSavedPlacesList && modalRef.current && g) {
      const card = modalRef.current.querySelector('.modal-card');
      if (card) g.fromTo(card, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
    }
  }, [showSavedPlacesList]);

  // ✅ Save place modal animation
  useEffect(() => {
    const g = gsap.current;
    if (savingPlaceLabel && saveModalRef.current && g) {
      const card = saveModalRef.current.querySelector('.modal-card');
      if (card) g.fromTo(card, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
    }
  }, [savingPlaceLabel]);

  // ✅ Reusable press animation helper
  const animatePress = (el: HTMLElement | null, callback?: () => void) => {
    const g = gsap.current;
    if (!g || !el) { callback?.(); return; }
    g.timeline()
      .to(el, { scale: 0.94, duration: 0.1, ease: "power2.in" })
      .to(el, { scale: 1, duration: 0.35, ease: "elastic.out(1.2, 0.5)" });
    setTimeout(() => callback?.(), 80);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setMapCenter([pos.coords.latitude, pos.coords.longitude]); setMapZoom(15); },
        () => console.log("GPS denied or unavailable.")
      );
    }
  }, []);

  const searchLocation = async (query: string, setter: any) => {
    if (query.length < 3) { setter([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setter(data.map((item: any) => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })));
    } catch (e) { console.error("Geocoding error", e); }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (newPlaceAddress && !newPlaceCoords) searchLocation(newPlaceAddress, setAddressSuggestions);
    }, 800);
    return () => clearTimeout(delay);
  }, [newPlaceAddress, newPlaceCoords]);

  useEffect(() => {
    if (!activeRide) return;
    const fetchRoadRoute = async () => {
      try {
        const { originCoords, destinationCoords } = activeRide;
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes?.length > 0) setRoadRoute(data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]));
      } catch (error) { console.error("Failed to fetch road route:", error); }
    };
    fetchRoadRoute();
  }, [activeRide]);

  useEffect(() => {
    if (!activeRide) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`ride-${activeRide._id}`);
    channel.bind("driver-update", (data: { lat: number, lng: number }) => setLiveLocation(data));
    return () => { channel.unbind_all(); pusher.unsubscribe(`ride-${activeRide._id}`); };
  }, [activeRide]);

  const markers = useMemo(() => {
    if (!activeRide) return [];
    const m: any[] = [
      { position: [activeRide.originCoords.lat, activeRide.originCoords.lng], type: "start" },
      { position: [activeRide.destinationCoords.lat, activeRide.destinationCoords.lng], type: "end" },
    ];
    if (liveLocation) m.push({ position: [liveLocation.lat, liveLocation.lng], type: "user" });
    else if (activeRide.currentLocation) m.push({ position: [activeRide.currentLocation.lat, activeRide.currentLocation.lng], type: "user" });
    return m;
  }, [activeRide, liveLocation]);

  const activeRoutePoints = useMemo(() => {
    if (!activeRide) return undefined;
    const points: [number, number][] = [];
    if (liveLocation) points.push([liveLocation.lat, liveLocation.lng]);
    else if (activeRide.currentLocation) points.push([activeRide.currentLocation.lat, activeRide.currentLocation.lng]);
    else points.push([activeRide.originCoords.lat, activeRide.originCoords.lng]);
    if (roadRoute.length > 0) points.push(...roadRoute);
    else { points.push([activeRide.originCoords.lat, activeRide.originCoords.lng]); points.push([activeRide.destinationCoords.lat, activeRide.destinationCoords.lng]); }
    return points as [number, number][];
  }, [activeRide, liveLocation, roadRoute]);

  const handleFindRide = (e: React.MouseEvent<HTMLButtonElement>) => {
    animatePress(e.currentTarget, () => {
      const combined = [destination, pickup].filter(Boolean).join(" ");
      const params = new URLSearchParams();
      if (combined) params.set("q", combined);
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleQuickPlace = (label: "Home" | "University") => {
    const place = savedPlaces.find((p: any) => (p.label || p.name) === label);
    if (place) { setDestination(place.address); addNotification("info", `${label} selected`); }
    else { setSavingPlaceLabel(label); setNewPlaceAddress(""); setNewPlaceCoords(null); }
  };

  const handleEditPlace = (placeLabel: string) => {
    const place = savedPlaces.find((p: any) => (p.label || p.name) === placeLabel);
    if (place) { setSavingPlaceLabel(placeLabel); setNewPlaceAddress(place.address); setNewPlaceCoords([place.lat, place.lng]); }
  };

  const handleSelectCustomPlace = (address: string, label: string) => {
    setDestination(address); setShowSavedPlacesList(false); addNotification("info", `${label} selected`);
  };

  const handleSheetToggle = () => {
    const g = gsap.current;
    if (!g || !sheetRef.current || !sheetInnerRef.current) {
      setSheetOpen((prev) => !prev);
      return;
    }

    const sheetHeight = sheetInnerRef.current.offsetHeight;
    const HANDLE_HEIGHT = 75;

    if (sheetOpen) {
      g.to(sheetRef.current, {
        y: sheetHeight - HANDLE_HEIGHT,
        duration: 0.4,
        ease: "power3.out",
      });
      setSheetOpen(false);
    } else {
      g.to(sheetRef.current, {
        y: 0,
        duration: 0.4,
        ease: "power3.out",
      });
      setSheetOpen(true);
    }
  };

  const submitNewPlace = async () => {
    const finalLabel = savingPlaceLabel === "Custom" ? newPlaceName : savingPlaceLabel;
    if (!newPlaceAddress.trim() || !finalLabel?.trim() || !user || !newPlaceCoords) return;
    const isEditing = savedPlaces.some((p: any) => (p.label || p.name) === finalLabel);
    if (savingPlaceLabel === "Custom" && !isEditing) {
      const nameExists = savedPlaces.some((p: any) => (p.label || p.name)?.toLowerCase() === finalLabel.toLowerCase());
      if (nameExists) { addNotification("warning", `You already have a place named "${finalLabel}".`); return; }
    }
    const addressExists = savedPlaces.find((p: any) => p.address?.toLowerCase() === newPlaceAddress.toLowerCase());
    if (addressExists) {
      const existingName = addressExists.label || addressExists.label;
      if (existingName !== finalLabel) { addNotification("warning", `This address is already saved as "${existingName}".`); return; }
    }
    setIsSavingPlace(true);
    try {
      const newPlace = { label: finalLabel, address: newPlaceAddress, lat: newPlaceCoords[0], lng: newPlaceCoords[1], icon: savingPlaceLabel === "Custom" ? "bookmark" : "map-pin" };
      const updatedPlaces = isEditing ? savedPlaces.map((p: any) => (p.label || p.name) === finalLabel ? newPlace : p) : [...savedPlaces, newPlace];
      await updateUser({ savedPlaces: updatedPlaces });
      updateProfile({ savedPlaces: updatedPlaces });
      setDestination(newPlaceAddress);
      addNotification("success", `${finalLabel} saved successfully!`);
      setSavingPlaceLabel(null); setNewPlaceName(""); setNewPlaceAddress(""); setNewPlaceCoords(null);
    } catch { addNotification("warning", "Failed to save place. Try again."); }
    finally { setIsSavingPlace(false); }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Active ride banner */}
      {isRideLoading ? (
        <div className="absolute top-4 left-4 right-4 z-50 bg-card border border-border p-4 rounded-2xl shadow-lg flex justify-between items-center animate-pulse">
          <div className="space-y-2">
            <div className="w-24 h-3 rounded bg-muted" />
            <div className="w-40 h-4 rounded bg-muted" />
          </div>
          <div className="w-8 h-8 rounded-full bg-muted" />
        </div>
      ) : activeRide ? (
        <div ref={ridebannerRef} className="absolute top-4 left-4 right-4 z-50 bg-[#1A3C6E] text-white p-4 rounded-2xl shadow-lg flex justify-between items-center cursor-pointer hover:bg-[#1A3C6E]/90 transition-colors"
          onClick={() => router.push(`/ride/${activeRide._id}`)}>
          <div>
            <p className="text-xs text-[#00C9B1] font-bold tracking-wider uppercase mb-1">Ride in Progress</p>
            <p className="font-medium text-sm">Heading to {activeRide.destination}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      ) : null}

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapView center={mapCenter} zoom={mapZoom} markers={markers} routePoints={activeRoutePoints} interactive darkMode={isDarkMode} className="w-full h-full" />
      </div>

      {/* Location button */}
      <button ref={navBtnRef}
        onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { setMapCenter([pos.coords.latitude, pos.coords.longitude]); setMapZoom(16); }); } }}
        className="absolute top-4 right-4 z-20 w-11 h-11 bg-card rounded-xl shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-95">
        <Navigation className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
      </button>

      {/* Bottom sheet */}
      <div ref={sheetRef} className="absolute bottom-0 left-0 right-0 z-30">
      <button  onClick={handleSheetToggle} className="w-full flex justify-center pt-2 pb-1">
          <div className="flex flex-col items-center gap-0.5">
            <ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${sheetOpen ? "rotate-180" : ""}`} />
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </button>

        <div ref={sheetInnerRef} className="bg-card rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] max-w-lg mx-auto">
          {!isDriverMode && (
            <div className="px-5 pt-4 pb-28 space-y-4">

              <div ref={inputsRef} className="space-y-3">
                <div className="relative anim-input">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00C9B1]" />
                  <input type="text" placeholder="Where are you going?" value={destination} onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all placeholder:text-muted-foreground" />
                </div>
                <div className="relative anim-input">
                  <Circle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A3C6E]" />
                  <input type="text" placeholder="Pickup point" value={pickup} onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border focus:border-[#1A3C6E] focus:ring-2 focus:ring-[#1A3C6E]/20 outline-none transition-all placeholder:text-muted-foreground" />
                </div>
              </div>

              <div ref={chipsRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex items-center bg-[#F5F7FA] dark:bg-[#1C2333] border border-border rounded-full overflow-hidden hover:border-[#00C9B1] transition-colors shrink-0 anim-chip">
                  <button onClick={() => handleQuickPlace("Home")} className="flex items-center gap-1.5 pl-4 pr-3 py-2 hover:bg-muted/50 transition-colors active:scale-95">
                    <Home className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" /><span className="text-[13px]">Home</span>
                  </button>
                  {homePlace && (
                    <button onClick={() => handleEditPlace("Home")} className="pr-3 pl-2 py-2 border-l border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-[#00C9B1]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-[#F5F7FA] dark:bg-[#1C2333] border border-border rounded-full overflow-hidden hover:border-[#00C9B1] transition-colors shrink-0 anim-chip">
                  <button onClick={() => handleQuickPlace("University")} className="flex items-center gap-1.5 pl-4 pr-3 py-2 hover:bg-muted/50 transition-colors active:scale-95">
                    <GraduationCap className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" /><span className="text-[13px]">University</span>
                  </button>
                  {uniPlace && (
                    <button onClick={() => handleEditPlace("University")} className="pr-3 pl-2 py-2 border-l border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-[#00C9B1]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button onClick={() => setShowSavedPlacesList(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F7FA] dark:bg-[#1C2333] border border-border hover:border-[#00C9B1] transition-colors whitespace-nowrap active:scale-95 shrink-0 anim-chip">
                  <Bookmark className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" /><span className="text-[13px]">Saved Places</span>
                </button>
              </div>

              <button ref={findRideBtnRef} onClick={handleFindRide}
                className="w-full py-4 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1A3C6E]/25">
                <Search className="w-5 h-5" /> Find Ride
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saved places modal */}
      {showSavedPlacesList && (
        <div ref={modalRef} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="modal-card bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2"><Bookmark className="w-5 h-5 text-[#00C9B1]" /> Saved Places</h3>
              <button onClick={() => setShowSavedPlacesList(false)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-90"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-2">
              {customSavedPlaces.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><Star className="w-6 h-6 text-muted-foreground/40" /></div>
                  <p className="font-medium text-muted-foreground">No places saved yet</p>
                  <p className="text-[12px] text-muted-foreground/60 mt-1">Save your gym, work, or favorite spots to book rides faster.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {customSavedPlaces.map((place: any, index: number) => (
                    <div key={index} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted transition-colors group">
                      <button onClick={() => handleSelectCustomPlace(place.address, place.label || place.name)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-[14px] truncate">{place.label || place.name}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{place.address}</p>
                        </div>
                      </button>
                      <button onClick={() => handleEditPlace(place.label || place.name)} className="p-2 text-muted-foreground hover:text-[#00C9B1] hover:bg-background rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border bg-card rounded-b-3xl">
              <button onClick={() => { setShowSavedPlacesList(false); setSavingPlaceLabel("Custom"); setNewPlaceName(""); setNewPlaceAddress(""); setNewPlaceCoords(null); }}
                className="w-full py-3.5 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add New Place
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save place modal */}
      {savingPlaceLabel && (
        <div ref={saveModalRef} className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="modal-card bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {savingPlaceLabel === "Home" ? <Home className="w-5 h-5 text-[#00C9B1]" /> : savingPlaceLabel === "University" ? <GraduationCap className="w-5 h-5 text-[#00C9B1]" /> : <Star className="w-5 h-5 text-[#00C9B1]" />}
                {savingPlaceLabel === "Custom" ? "Add New Place" : `Save ${savingPlaceLabel}`}
              </h3>
              <button onClick={() => { setSavingPlaceLabel(null); setNewPlaceCoords(null); }} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-90"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {savingPlaceLabel === "Custom" && (
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Name of Place</label>
                  <div className="relative">
                    <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                    <input type="text" autoFocus placeholder="e.g. Gym, Work, Cafe" value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]" />
                  </div>
                </div>
              )}
              <div className="relative z-50">
                <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Full Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
                  <input type="text" autoFocus={savingPlaceLabel !== "Custom"} placeholder="e.g. 123 Main St, City" value={newPlaceAddress}
                    onChange={(e) => { setNewPlaceAddress(e.target.value); setNewPlaceCoords(null); setShowAddressSuggestions(true); }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    className={`w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px] ${!newPlaceCoords && newPlaceAddress.length > 0 ? "border-amber-400 focus:border-amber-400" : ""}`} />
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-card rounded-xl border border-border shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {addressSuggestions.map((s, i) => (
                        <button key={i} onMouseDown={(e) => { e.preventDefault(); const shortName = s.name.split(", ").slice(0, 3).join(", "); setNewPlaceAddress(shortName); setNewPlaceCoords([s.lat, s.lng]); setShowAddressSuggestions(false); }}
                          className="w-full text-left px-4 py-3 text-[13px] hover:bg-muted transition-colors flex items-start gap-2 border-b border-border/50 last:border-0">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" /><span className="line-clamp-2">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!newPlaceCoords && newPlaceAddress.length > 0 && (
                  <p className="text-[11px] text-amber-500 mt-1.5 ml-1">Please select an address from the dropdown list.</p>
                )}
              </div>
              <button onClick={submitNewPlace} disabled={!newPlaceCoords || (savingPlaceLabel === "Custom" && !newPlaceName.trim()) || isSavingPlace}
                className="w-full py-3.5 mt-2 rounded-xl bg-[#00C9B1] text-white font-semibold hover:bg-[#00C9B1]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSavingPlace ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save & Use Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}