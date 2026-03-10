"use client";

import Pusher from "pusher-js";
import { broadcastLocation } from "@/lib/actions/location.actions";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Clock, Users, MessageCircle, Shield, Phone, CheckCircle, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/components/app-context";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { MapView } from "@/components/map-view";
import { getRideById, bookRide, updateRideStatus } from "@/lib/actions/ride.actions";

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  
  // 1. Pulled liveLocation natively from useApp so the driver can see their own car!
  const { user, isDarkMode, addNotification, startTracking, stopTracking, isBroadcasting, liveLocation } = useApp();

  // Real-time Database States
  const [ride, setRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
  
  // --- Live Location States ---
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [passengerLocations, setPassengerLocations] = useState<Record<string, { lat: number, lng: number }>>({});

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);

  // 1. Fetch the exact ride from MongoDB on load
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const dbRide = await getRideById(id as string);
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
        };
        setRide(formattedRide);

        if (user && dbRide.passengers.includes(user._id)) {
          setIsAlreadyBooked(true);
        }
      } catch (error) {
        console.error("Failed to load ride", error);
        addNotification("warning", "Failed to load ride details.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchRideDetails();
  }, [id, user, addNotification]);

  const isOwnRide = user && ride && (user._id === ride.driverId);

  // 2. Handle the Real Database Booking
  const handleRequest = async () => {
    if (ride.seatsLeft <= 0) {
      addNotification("warning", "No seats available for this ride.");
      return;
    }
    setIsBooking(true);
    try {
      await bookRide(ride.id); 
      setIsAlreadyBooked(true);
      setRide((prev: any) => ({ ...prev, seatsLeft: prev.seatsLeft - 1 }));
      addNotification("success", "Ride requested successfully!");
    } catch (error: any) {
      addNotification("warning", error.message || "Failed to book ride.");
    } finally {
      setIsBooking(false);
    }
  };

  // 1. THE LISTENER: Hear incoming GPS updates from Pusher
  useEffect(() => {
    if (!ride?.id || (!isOwnRide && !isAlreadyBooked)) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`ride-${ride.id}`);

    if (isOwnRide) {
      channel.bind("passenger-update", (data: { userId: string, lat: number, lng: number }) => {
        setPassengerLocations(prev => ({ ...prev, [data.userId]: { lat: data.lat, lng: data.lng } }));
      });
    } else {
      channel.bind("driver-update", (data: { lat: number, lng: number }) => {
        setDriverLocation(data);
      });
    }

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`ride-${ride.id}`);
      // pusher.disconnect() WAS DELETED SO IT STOPPED CRASHING
    };
  }, [ride?.id, isOwnRide, isAlreadyBooked]);

  // 2. THE BROADCASTER: Passenger automatically broadcasts so driver can see them
  // (The Driver's broadcaster was deleted from here because it lives in app-context now!)
  useEffect(() => {
    let watchId: number;
    if (!isOwnRide && isAlreadyBooked && "geolocation" in navigator) {
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

  // 3. THE MAP DRAWING: Show exactly what each person needs to see
  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    if (ride?.toCoords) markers.push({ position: ride.toCoords, type: "end" });

    if (isOwnRide) {
      // DRIVER VIEW: Uses global 'liveLocation' to display his car on his own map
      if (liveLocation) markers.push({ position: [liveLocation.lat, liveLocation.lng], type: "user" });
      Object.values(passengerLocations).forEach(pos => markers.push({ position: [pos.lat, pos.lng], type: "passenger" }));
    } else if (isAlreadyBooked) {
      // PASSENGER VIEW: Sees driver car and his blue dot
      if (driverLocation) markers.push({ position: [driverLocation.lat, driverLocation.lng], type: "user" });
      if (myLocation) markers.push({ position: [myLocation.lat, myLocation.lng], type: "passenger" });
    } else {
      // NOT BOOKED YET VIEW: Just show pickup and dropoff
      if (ride?.fromCoords) markers.push({ position: ride.fromCoords, type: "start" });
    }

    return markers;
  }, [ride, driverLocation, passengerLocations, myLocation, liveLocation, isOwnRide, isAlreadyBooked]);

  const routePoints = useMemo(() => {
    if (!ride) return [];
    const midLat = (ride.fromCoords[0] + ride.toCoords[0]) / 2 + 0.003;
    const midLng = (ride.fromCoords[1] + ride.toCoords[1]) / 2 - 0.002;
    return [ride.fromCoords, [midLat, midLng] as [number, number], ride.toCoords];
  }, [ride]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C9B1] mb-4" />
        <p className="text-muted-foreground">Loading ride details...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found</p>
      </div>
    );
  }

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const time = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
    setChatMessages((prev) => [...prev, { sender: "You", text: chatMessage, time }]);
    setChatMessage("");

    setTimeout(() => {
      const replies = [
        "Sure, I'll be there on time!",
        "Great, see you at the pickup point 👍",
        "I'm driving a white Toyota Corolla",
        "Yes, I have space for luggage too",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyTime = new Date();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: ride.driverName,
          text: reply,
          time: replyTime.getHours() + ":" + String(replyTime.getMinutes()).padStart(2, "0"),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Map Preview */}
      <div className="relative h-56 sm:h-72">
        <MapView
          markers={mapMarkers}
          routePoints={routePoints}
          darkMode={isDarkMode}
          interactive={true}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 dark:bg-[#161B22]/90 backdrop-blur flex items-center justify-center shadow-sm z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ImageWithFallback src={ride.driverAvatar} alt={ride.driverName} className="w-16 h-16 rounded-2xl object-cover" />
              {ride.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00C9B1] rounded-full flex items-center justify-center border-2 border-card">
                  <span className="text-white text-[10px]">✓</span>
                </div>
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
            <p className="font-semibold text-[13px]">
              {ride.seatsLeft}/{ride.totalSeats}
            </p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-3 sm:p-4 text-center">
            <MapPin className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">Date</p>
            <p className="font-semibold text-[13px]">{ride.date}</p>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="bg-card rounded-2xl shadow-sm border border-border mb-4 overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <p className="font-medium text-[14px]">Chat with {ride.driverName}</p>
              <button onClick={() => setShowChat(false)} className="text-muted-foreground text-[13px]">
                Close
              </button>
            </div>
            <div className="h-48 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-center text-muted-foreground text-[13px] py-8">
                  Send a message to the driver
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] ${msg.sender === "You"
                      ? "bg-[#1A3C6E] text-white rounded-br-sm"
                      : "bg-[#F5F7FA] dark:bg-[#1C2333] rounded-bl-sm"
                      }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-0.5 ${msg.sender === "You" ? "text-white/60" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#F5F7FA] dark:bg-[#1C2333] border border-border outline-none text-[13px]"
              />
              <button
                onClick={handleSendChat}
                className="px-4 py-2 rounded-xl bg-[#1A3C6E] text-white text-[13px] font-medium"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isOwnRide ? (
            <button
              onClick={async () => {
                if (isBroadcasting) {
                  stopTracking(); // Context takes care of clearWatch
                  await updateRideStatus(ride.id, "completed");
                  addNotification("info", "Live tracking stopped.");
                } else {
                  startTracking(ride.id); // Context takes care of watchPosition
                  await updateRideStatus(ride.id, "active");
                  addNotification("success", "Ride started! Location is live.");
                }
              }}
              className={`flex-1 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                isBroadcasting ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-[#00C9B1]/10 text-[#00C9B1] hover:bg-[#00C9B1]/20"
              }`}
            >
              {isBroadcasting ? (
                <><MapPin className="w-5 h-5 animate-pulse" /> Stop Tracking</>
              ) : (
                <><MapPin className="w-5 h-5" /> Share Live Location</>
              )}
            </button>
          ) : isAlreadyBooked ? (
            <div className="flex-1 py-3.5 rounded-2xl bg-[#00C9B1]/10 text-[#00C9B1] font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> Ride Booked
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
          <button onClick={() => setShowChat(!showChat)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${showChat ? "bg-[#00C9B1] text-white" : "bg-[#00C9B1]/10 text-[#00C9B1] hover:bg-[#00C9B1]/20"}`}>
            <MessageCircle className="w-5 h-5" />
          </button>
          <button onClick={() => addNotification("info", `Calling ${ride.driverName}...`)} className="w-14 h-14 rounded-2xl bg-[#1A3C6E]/10 text-[#1A3C6E] dark:text-white flex items-center justify-center hover:bg-[#1A3C6E]/20 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}