"use client";

import Pusher from "pusher-js";
import { broadcastLocation } from "@/lib/actions/location.actions";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Clock, Users, MessageCircle, Check, X, Phone, CheckCircle, Loader2, PhoneOutgoing, Car } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/components/app-context";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { MapView } from "@/components/map-view";
import { getRideById, updateRideStatus } from "@/lib/actions/ride.actions";
import { createRideRequest, checkMyRequestStatus, getPendingRequestsForRide, respondToRequest } from "@/lib/actions/request.actions";
import { sendIncomingCallSignal } from "@/lib/actions/call.actions";
// 1. IMPORT SWR
import useSWR from "swr";

// 2. THE COMBINED SWR FETCHER
// This grabs the Ride, your Request Status, and Pending Requests all at once!
const fetchRideData = async ([_, rideId, userId]: [string, string, string | undefined]) => {
  const dbRide = await getRideById(rideId);
  if (!dbRide) throw new Error("Ride not found");

  const formattedRide = {
    id: dbRide._id,
    driverId: dbRide.driver?._id || dbRide.driver,
    from: dbRide.origin,
    to: dbRide.destination,
    fromCoords: [dbRide.originCoords.lat, dbRide.originCoords.lng],
    toCoords: [dbRide.destinationCoords.lat, dbRide.destinationCoords.lng],
    driverName: `${dbRide.driver?.firstName} ${dbRide.driver?.lastName}`.trim(),
    driverAvatar: dbRide.driver?.photo || "/default-avatar.png",
    rating: dbRide.driver?.rating || 5.0,
    verified: dbRide.driver?.isDriverVerified,
    price: dbRide.price,
    departureTime: dbRide.time,
    date: dbRide.date,
    seatsLeft: dbRide.availableSeats,
    totalSeats: dbRide.totalSeats,
    passengers: dbRide.passengers || [],
  };

  let pendingRequests: any[] = [];
  let requestStatus: string | null = null;
  let isAlreadyBooked = false;

  if (userId && formattedRide.driverId.toString() === userId.toString()) {
    pendingRequests = await getPendingRequestsForRide(dbRide._id);
  } else if (userId) {
    requestStatus = await checkMyRequestStatus(dbRide._id);
    if (requestStatus === "accepted") isAlreadyBooked = true;
  }

  return { formattedRide, pendingRequests, requestStatus, isAlreadyBooked };
};

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const { user, isDarkMode, addNotification, startTracking, stopTracking, isBroadcasting, liveLocation } = useApp();

  
  // 3. THE SWR ENGINE
  // Notice we pass the user._id in the key array so it refetches if the user changes
  const { data, isLoading, mutate } = useSWR(
    id && user !== undefined ? ['rideDetail', id as string, user?._id] : null,
    fetchRideData,
    {
      revalidateOnFocus: false, // Let Pusher handle the real-time updates safely
      dedupingInterval: 5000,
    }
  );

  // Extract the cached data cleanly
  const ride = data?.formattedRide;
  const pendingRequests = data?.pendingRequests || [];
  const requestStatus = data?.requestStatus || null;
  const isAlreadyBooked = data?.isAlreadyBooked || false;
  const isOwnRide = user && ride && (user._id?.toString() === ride.driverId?.toString());

  // UI & High-Frequency GPS States (These stay out of SWR!)
  const [isBooking, setIsBooking] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [passengerLocations, setPassengerLocations] = useState<Record<string, { lat: number, lng: number }>>({});

  const [showChat, setShowChat] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerName: string, roomId: string } | null>(null);

  // --- ACTIONS ---
  const handleRequest = async () => {
    if (!ride || ride.seatsLeft <= 0) return addNotification("warning", "No seats available for this ride.");
    setIsBooking(true);
    try {
      await createRideRequest(ride.id, ride.driverId);
      // OPTIMISTIC UI: Update SWR cache instantly so the button turns to "Pending" without waiting!
      mutate((prev: any) => prev ? { ...prev, requestStatus: "pending" } : prev, false);
      addNotification("success", "Request sent to the driver for approval!");
    } catch (error: any) {
      addNotification("warning", error.message || "Failed to send request.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      await respondToRequest(requestId, action);
      
      // OPTIMISTIC UI: Instantly remove the request and deduct a seat if accepted!
      mutate((prev: any) => {
        if (!prev) return prev;
        const newRide = { ...prev.formattedRide };
        if (action === "accept") newRide.seatsLeft -= 1;
        return {
          ...prev,
          formattedRide: newRide,
          pendingRequests: prev.pendingRequests.filter((req: any) => req._id !== requestId)
        };
      }, false);

      if (action === "accept") {
        addNotification("success", "Passenger accepted!");
      } else {
        addNotification("info", "Passenger declined.");
      }
    } catch (error: any) {
      addNotification("warning", error.message || "Something went wrong.");
    }
  };

  // --- PUSHER REAL-TIME WEB SOCKETS ---
  useEffect(() => {
    if (!ride?.id || (!isOwnRide && !isAlreadyBooked && requestStatus !== "pending")) return;
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return; 

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    
    const channel = pusher.subscribe(`ride-${ride.id}`);

    // Call Listener
    channel.bind("incoming-call", (payload: { targetUserId: string, callerName: string, roomId: string }) => {
      if (user && user._id?.toString() === payload.targetUserId?.toString()) {
        setIncomingCall({ callerName: payload.callerName, roomId: payload.roomId });
      }
    });

    if (isOwnRide) {
      channel.bind("passenger-update", (payload: { userId: string, lat: number, lng: number }) => {
        setPassengerLocations(prev => ({ ...prev, [payload.userId]: { lat: payload.lat, lng: payload.lng } }));
      });
      
      channel.bind("new-request", (payload: any) => {
        // PUSHER MUTATION: Drop the new passenger into the SWR pending list instantly
        mutate((prev: any) => prev ? { ...prev, pendingRequests: [...prev.pendingRequests, payload] } : prev, false);
        addNotification("info", `New ride request from ${payload.passenger.firstName}!`);
      });

      channel.bind("passenger-cancelled", (payload: { passengerId: string, passengerName: string, wasAccepted: boolean }) => {
        addNotification("warning", `${payload.passengerName} cancelled their ride.`);
        // PUSHER MUTATION: Give the seat back instantly!
        mutate((prev: any) => {
          if (!prev) return prev;
          const newRide = { ...prev.formattedRide };
          let newReqs = [...prev.pendingRequests];
          if (payload.wasAccepted) {
            newRide.seatsLeft += 1;
          } else {
            newReqs = newReqs.filter(req => req.passenger._id.toString() !== payload.passengerId);
          }
          return { ...prev, formattedRide: newRide, pendingRequests: newReqs };
        }, false);

        if (payload.wasAccepted) {
          setPassengerLocations(prev => { const newLocs = { ...prev }; delete newLocs[payload.passengerId]; return newLocs; });
        }
      });
    } else {
      channel.bind("driver-update", (payload: { lat: number, lng: number }) => {
        setDriverLocation(payload);
      });
      
      channel.bind("request-status-update", (payload: { passengerId: string, status: string }) => {
        if (user && user._id && payload.passengerId === user._id.toString()) {
          // PUSHER MUTATION: Update my UI based on the driver's response
          mutate((prev: any) => {
            if (!prev) return prev;
            const newRide = { ...prev.formattedRide };
            let newBooked = prev.isAlreadyBooked;
            if (payload.status === "accepted") {
              newBooked = true;
              newRide.seatsLeft -= 1;
            }
            return { ...prev, formattedRide: newRide, requestStatus: payload.status, isAlreadyBooked: newBooked };
          }, false);

          if (payload.status === "accepted") {
            addNotification("success", "Your ride request was ACCEPTED!");
          } else if (payload.status === "declined") {
            addNotification("warning", "Your ride request was DECLINED by the driver.");
          }
        }
      });
    }

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`ride-${ride.id}`);
      pusher.disconnect();
    };
  }, [ride?.id, isOwnRide, isAlreadyBooked, requestStatus, user, addNotification, mutate]);

  // GPS Watcher
  useEffect(() => {
    let watchId: number;
    if (!isOwnRide && isAlreadyBooked && ride?.id && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          broadcastLocation(ride.id, latitude, longitude, "passenger", user?._id);
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOwnRide, isAlreadyBooked, ride?.id, user?._id]);

  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    if (ride?.toCoords) markers.push({ position: ride.toCoords, type: "end" });
    if (isOwnRide) {
      if (liveLocation) markers.push({ position: [liveLocation.lat, liveLocation.lng], type: "user" });
      Object.values(passengerLocations).forEach(pos => markers.push({ position: [pos.lat, pos.lng], type: "passenger" }));
    } else if (isAlreadyBooked) {
      if (driverLocation) markers.push({ position: [driverLocation.lat, driverLocation.lng], type: "user" });
      if (myLocation) markers.push({ position: [myLocation.lat, myLocation.lng], type: "passenger" });
    } else {
      if (ride?.fromCoords) markers.push({ position: ride.fromCoords, type: "start" });
    }
    return markers;
  }, [ride, driverLocation, passengerLocations, myLocation, liveLocation, isOwnRide, isAlreadyBooked]);

 const routePoints = useMemo<[number, number][] | undefined>(() => {
    if (!ride || !ride.fromCoords || !ride.toCoords) return undefined;
    
    const midLat = (ride.fromCoords[0] + ride.toCoords[0]) / 2 + 0.003;
    const midLng = (ride.fromCoords[1] + ride.toCoords[1]) / 2 - 0.002;
    
    return [
      [ride.fromCoords[0], ride.fromCoords[1]],
      [midLat, midLng],
      [ride.toCoords[0], ride.toCoords[1]]
    ];
  }, [ride]);

  const handleInitiateCall = async () => {
    if (!ride) return;
    if (isOwnRide) {
      if (ride.passengers.length === 0) {
        addNotification("info", "No booked passengers to call yet.");
      } else if (ride.passengers.length === 1) {
        const pass = ride.passengers[0];
        const passId = pass?._id || pass;
        const passIdStr = String(passId);
        const rideIdStr = String(ride.id);
        const roomId = `${rideIdStr}_${passIdStr}`;
        
        await sendIncomingCallSignal(rideIdStr, passIdStr, ride.driverName, roomId);
        router.push(`/call/${roomId}`);
      } else {
        setShowCallModal(true);
      }
    } else if (isAlreadyBooked) {
      const rideIdStr = String(ride.id);
      const myIdStr = String(user?._id || "");
      const driverIdStr = String(ride.driverId || "");
      const roomId = `${rideIdStr}_${myIdStr}`;
      const myName = `${user?.firstName || "User"} ${user?.lastName || ""}`.trim();
      
      await sendIncomingCallSignal(rideIdStr, driverIdStr, myName, roomId);
      router.push(`/call/${roomId}`);
    } else {
      addNotification("warning", "You can only call after the ride is booked!");
    }
  };

  const handleDriverCallsSpecificPassenger = async (passengerId: string, passengerName: string) => {
    if (!ride) return;
    const passIdStr = String(passengerId);
    const rideIdStr = String(ride.id);
    const roomId = `${rideIdStr}_${passIdStr}`;
    
    await sendIncomingCallSignal(rideIdStr, passIdStr, ride.driverName, roomId);
    router.push(`/call/${roomId}`);
  };

  // The Communication Lock:
  const canCommunicate = isOwnRide ? ride?.passengers?.length > 0 : isAlreadyBooked;
  
  // --- SKELETON LOADER ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 animate-pulse">
        <div className="relative h-56 sm:h-72 bg-muted flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 space-y-4">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-5">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2 mt-2">
                <div className="w-32 h-4 bg-muted rounded" />
                <div className="w-20 h-3 bg-muted rounded" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5 h-32" />
        </div>
      </div>
    );
  }

  if (!ride) return <div className="min-h-full bg-background flex items-center justify-center"><p className="text-muted-foreground">Ride not found</p></div>;

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Map Preview */}
      <div className="relative h-56 sm:h-72">
        <MapView  center={ride?.fromCoords ? [ride.fromCoords[0], ride.fromCoords[1]] : [33.6844, 73.0479]}
                  zoom={12} markers={mapMarkers} routePoints={routePoints} darkMode={isDarkMode} interactive={true} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 dark:bg-[#161B22]/90 backdrop-blur flex items-center justify-center shadow-sm z-10">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-5 mb-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ImageWithFallback src={ride.driverAvatar} alt={ride.driverName} className="w-16 h-16 rounded-2xl object-cover" />
              {ride.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00C9B1] rounded-full flex items-center justify-center border-2 border-card"><span className="text-white text-[10px]">✓</span></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{ride.driverName}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-[13px] text-muted-foreground">{ride.rating} rating</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#00C9B1]">${ride.price}</p>
              <p className="text-[12px] text-muted-foreground">per seat</p>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4">
          <h3 className="font-semibold mb-4">Route Details</h3>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-[#1A3C6E] border-2 border-[#1A3C6E]/30" />
              <div className="w-0.5 flex-1 bg-border my-1" />
              <div className="w-3 h-3 rounded-full bg-[#00C9B1] border-2 border-[#00C9B1]/30" />
            </div>
            <div className="flex-1 space-y-6">
              <div><p className="text-[12px] text-muted-foreground">Pickup</p><p className="font-medium">{ride.from}</p></div>
              <div><p className="text-[12px] text-muted-foreground">Drop-off</p><p className="font-medium">{ride.to}</p></div>
            </div>
          </div>
        </div>

        {/* PENDING REQUESTS DASHBOARD */}
        {isOwnRide && pendingRequests.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-4 animate-in fade-in">
            <h3 className="font-semibold mb-3 flex items-center justify-between">
              Pending Requests
              <span className="bg-[#f59e0b] text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div key={req._id} className="flex items-center justify-between bg-[#F5F7FA] dark:bg-[#1C2333] p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback src={req.passenger.photo || "/default-avatar.png"} alt="Passenger" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold">{req.passenger.firstName} {req.passenger.lastName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{req.passenger.rating || "5.0"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRespondToRequest(req._id, "decline")} className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleRespondToRequest(req._id, "accept")} className="w-9 h-9 rounded-full bg-[#00C9B1]/10 text-[#00C9B1] flex items-center justify-center hover:bg-[#00C9B1]/20 transition-colors"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip Info */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-3 sm:p-4 text-center">
            <Clock className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">Departure</p>
            <p className="font-semibold text-[13px]">{ride.departureTime}</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-3 sm:p-4 text-center">
            <Users className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">Seats Left</p>
            <p className="font-semibold text-[13px]">{ride.seatsLeft}/{ride.totalSeats}</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-3 sm:p-4 text-center">
            <MapPin className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">Date</p>
            <p className="font-semibold text-[13px]">{ride.date}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isOwnRide ? (
            <button
              onClick={async () => {
                if (isBroadcasting) {
                  // --- END RIDE ---
                  stopTracking(); 
                  await updateRideStatus(ride.id, "completed");
                  
                  // Instantly update UI cache
                  mutate((prev: any) => prev ? { 
                    ...prev, 
                    formattedRide: { ...prev.formattedRide, status: "completed" } 
                  } : prev, false);

                  addNotification("success", "Ride completed successfully!");
                  router.push("/my-rides"); // Take them back to their rides list
                } else {
                  // --- START RIDE ---
                  startTracking(ride.id); 
                  await updateRideStatus(ride.id, "active");

                  // Instantly update UI cache
                  mutate((prev: any) => prev ? { 
                    ...prev, 
                    formattedRide: { ...prev.formattedRide, status: "active" } 
                  } : prev, false);

                  addNotification("success", "Ride started! Passengers can now track you.");
                }
              }}
              // Make "Start Ride" look like a primary button, and "End Ride" look like a definitive stop action
              className={`flex-1 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isBroadcasting 
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/25" 
                  : "bg-[#00C9B1] text-white hover:bg-[#00C9B1]/90 shadow-[#00C9B1]/25"
              }`}
            >
              {isBroadcasting ? (
                <><CheckCircle className="w-5 h-5" /> End Ride</>
              ) : (
                <><Car className="w-5 h-5 animate-pulse" /> Start Ride</>
              )}
            </button>
          ) : requestStatus === "pending" ? (
            <div className="flex-1 py-3.5 rounded-2xl bg-[#f59e0b]/10 text-[#f59e0b] font-semibold flex items-center justify-center gap-2 border border-[#f59e0b]/20">
              <Clock className="w-5 h-5 animate-pulse" /> Pending Approval
            </div>
          ) : isAlreadyBooked || requestStatus === "accepted" ? (
            <div className="flex-1 py-3.5 rounded-2xl bg-[#00C9B1]/10 text-[#00C9B1] font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> Ride Booked
            </div>
          ) : requestStatus === "declined" ? (
            <div className="flex-1 py-3.5 rounded-2xl bg-red-500/10 text-red-500 font-semibold flex items-center justify-center gap-2">
              Declined by Driver
            </div>
          ) : (
            <button
              onClick={handleRequest}
              disabled={ride.seatsLeft <= 0 || isBooking}
              className="flex-1 py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#1A3C6E]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBooking ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</> : "Request Ride"}
            </button>
          )}

          <button 
            onClick={() => setShowChat(!showChat)} 
            disabled={!canCommunicate}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              !canCommunicate 
                ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed" 
                : showChat 
                  ? "bg-[#00C9B1] text-white shadow-lg shadow-[#00C9B1]/20" 
                  : "bg-[#00C9B1]/10 text-[#00C9B1] hover:bg-[#00C9B1]/20"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          {/* Call Button */}
          <button 
            onClick={handleInitiateCall} 
            disabled={!canCommunicate}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              !canCommunicate 
                ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed" 
                : "bg-[#1A3C6E]/10 text-[#1A3C6E] dark:text-white hover:bg-[#1A3C6E]/20"
            }`}
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- DRIVER CALL PASSENGER SELECTION MODAL --- */}
      {showCallModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-[#F5F7FA] dark:bg-[#1C2333]">
              <div>
                <h3 className="font-bold text-lg text-[#1A3C6E] dark:text-[#00C9B1]">Select Passenger</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Who would you like to call?</p>
              </div>
              <button onClick={() => setShowCallModal(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors bg-card border border-border shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {ride.passengers.map((passenger: any) => (
                <button 
                  key={passenger._id}
                  onClick={() => handleDriverCallsSpecificPassenger(passenger._id, `${passenger.firstName} ${passenger.lastName}`)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <ImageWithFallback src={passenger.photo || "/default-avatar.png"} alt="Passenger" className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm" />
                    <div>
                      <p className="text-[15px] font-semibold">{passenger.firstName} {passenger.lastName}</p>
                      <p className="text-[12px] text-muted-foreground group-hover:text-[#00C9B1] transition-colors">Tap to ring</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#00C9B1]/10 text-[#00C9B1] flex items-center justify-center group-hover:bg-[#00C9B1] group-hover:text-white transition-all shadow-sm">
                    <PhoneOutgoing className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- THE FULL-SCREEN INCOMING CALL UI --- */}
      {incomingCall && (
        <div className="fixed inset-0 z-[999999] bg-[#161B22]/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-in zoom-in-95 duration-300">
          
          <div className="w-32 h-32 bg-[#00C9B1]/20 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-[#00C9B1]/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="w-20 h-20 bg-[#00C9B1] rounded-full flex items-center justify-center z-10 shadow-xl">
              <Phone className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 tracking-wide text-center">{incomingCall.callerName}</h2>
          <p className="text-[#00C9B1] font-medium tracking-widest uppercase text-sm mb-16 animate-pulse">Incoming Voice Call...</p>

          <div className="flex items-center justify-center gap-12 w-full max-w-xs">
            <div className="flex flex-col items-center gap-3">
              <button onClick={() => setIncomingCall(null)} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-500/20">
                <Phone className="w-7 h-7 rotate-[135deg]" fill="currentColor" />
              </button>
              <span className="text-xs font-semibold text-gray-300">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={() => { router.push(`/call/${incomingCall.roomId}`); setIncomingCall(null); }} className="w-16 h-16 rounded-full bg-[#00C9B1] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[#00C9B1]/30">
                <Phone className="w-7 h-7" fill="currentColor" />
              </button>
              <span className="text-xs font-semibold text-gray-300">Accept</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}