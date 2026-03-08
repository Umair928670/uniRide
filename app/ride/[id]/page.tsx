"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Star, MapPin, Clock, Users, MessageCircle, Shield, Phone, CheckCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/components/app-context";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { MapView } from "@/components/map-view";

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { availableRides, requestRide, myUpcomingRides, isDarkMode, addNotification } = useApp();
  const ride = availableRides.find((r) => r.id === id) || availableRides[0];
  const isAlreadyBooked = myUpcomingRides.some((r) => r.id === id);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);

  const mapMarkers = useMemo(
    () =>
      ride
        ? [
            { position: ride.fromCoords, type: "start" as const },
            { position: ride.toCoords, type: "end" as const },
          ]
        : [],
    [ride]
  );

  const routePoints = useMemo(() => {
    if (!ride) return [];
    const midLat = (ride.fromCoords[0] + ride.toCoords[0]) / 2 + 0.003;
    const midLng = (ride.fromCoords[1] + ride.toCoords[1]) / 2 - 0.002;
    return [ride.fromCoords, [midLat, midLng] as [number, number], ride.toCoords];
  }, [ride]);

  if (!ride) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found</p>
      </div>
    );
  }

  const handleRequest = () => {
    if (ride.seatsLeft <= 0) {
      addNotification("warning", "No seats available for this ride.");
      return;
    }
    requestRide(ride.id);
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const time = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
    setChatMessages((prev) => [...prev, { sender: "You", text: chatMessage, time }]);
    setChatMessage("");

    // Simulate driver reply
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
        {/* Driver Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ImageWithFallback
                src={ride.driverAvatar}
                alt={ride.driverName}
                className="w-16 h-16 rounded-2xl object-cover"
              />
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
              {ride.verified && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3.5 h-3.5 text-[#00C9B1]" />
                  <span className="text-[12px] text-[#00C9B1]">Verified Student</span>
                </div>
              )}
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
              <div>
                <p className="text-[12px] text-muted-foreground">Pickup</p>
                <p className="font-medium">{ride.from}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground">Drop-off</p>
                <p className="font-medium">{ride.to}</p>
              </div>
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
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] ${
                      msg.sender === "You"
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
          {isAlreadyBooked ? (
            <div className="flex-1 py-3.5 rounded-2xl bg-[#00C9B1]/10 text-[#00C9B1] font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Ride Booked
            </div>
          ) : (
            <button
              onClick={handleRequest}
              disabled={ride.seatsLeft <= 0}
              className="flex-1 py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#1A3C6E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ride.seatsLeft <= 0 ? "No Seats Available" : "Request Ride"}
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              showChat
                ? "bg-[#00C9B1] text-white"
                : "bg-[#00C9B1]/10 text-[#00C9B1] hover:bg-[#00C9B1]/20"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => addNotification("info", `Calling ${ride.driverName}...`)}
            className="w-14 h-14 rounded-2xl bg-[#1A3C6E]/10 text-[#1A3C6E] dark:text-white flex items-center justify-center hover:bg-[#1A3C6E]/20 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
