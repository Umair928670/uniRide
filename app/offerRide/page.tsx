'use client';

import { useState, useMemo } from "react";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Shield,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Minus,
  Plus,
  Info,
  FileText,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { MapView, LOCATION_COORDS } from "@/components/map-view";
import { useRouter } from "next/navigation";

const SUGGESTED_LOCATIONS = Object.keys(LOCATION_COORDS);

export default function OfferRidePage() {
  const { offerRide, isDarkMode, isDriverVerified, user } = useApp();
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState("");
  const [uniOnly, setUniOnly] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fromSuggestions = SUGGESTED_LOCATIONS.filter(
    (l) => l.toLowerCase().includes(from.toLowerCase()) && l !== from
  );
  const toSuggestions = SUGGESTED_LOCATIONS.filter(
    (l) => l.toLowerCase().includes(to.toLowerCase()) && l !== to
  );

  const mapMarkers = useMemo(() => {
    const m: { position: [number, number]; type: "start" | "end" | "user" | "default" }[] = [];
    const fromCoord = LOCATION_COORDS[from];
    const toCoord = LOCATION_COORDS[to];
    if (fromCoord) m.push({ position: fromCoord, type: "start" });
    if (toCoord) m.push({ position: toCoord, type: "end" });
    return m;
  }, [from, to]);

  const routePoints = useMemo(() => {
    const fromCoord = LOCATION_COORDS[from];
    const toCoord = LOCATION_COORDS[to];
    if (!fromCoord || !toCoord) return undefined;
    const midLat = (fromCoord[0] + toCoord[0]) / 2 + 0.002;
    const midLng = (fromCoord[1] + toCoord[1]) / 2 - 0.001;
    return [fromCoord, [midLat, midLng] as [number, number], toCoord];
  }, [from, to]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!from.trim()) e.from = "Pick a starting location";
    if (!to.trim()) e.to = "Pick a destination";
    if (!date) e.date = "Select a date";
    if (!time) e.time = "Select departure time";
    if (!price || parseFloat(price) <= 0) e.price = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const fromCoords = LOCATION_COORDS[from] || [37.427, -122.17];
    const toCoords = LOCATION_COORDS[to] || [37.44, -122.15];

    offerRide({
      from,
      to,
      fromCoords: fromCoords as [number, number],
      toCoords: toCoords as [number, number],
      date: date || "Today",
      departureTime: time || "8:00 AM",
      seatsLeft: seats,
      totalSeats: seats,
      price: parseFloat(price),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-full bg-background pt-16 pb-28 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#00C9B1]/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-[#00C9B1]" />
          </div>
          <h2 className="mb-2">Ride Published!</h2>
          <p className="text-muted-foreground text-[14px] mb-2">
            Your ride has been listed. Students can now find and request it.
          </p>
          <div className="bg-[#00C9B1]/5 border border-[#00C9B1]/20 rounded-2xl p-4 mb-6 text-left">
            <p className="text-[13px] text-[#00C9B1] mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> How passengers find your ride
            </p>
            <ul className="text-[12px] text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your ride appears on the <strong>Home</strong> map and in <strong>Browse</strong> search results</li>
              <li>Passengers search by route, date, or driver name</li>
              <li>They tap your ride card to see details, then tap <strong>"Request Ride"</strong></li>
              <li>You'll get a notification to accept or decline the request</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                setFrom("");
                setTo("");
                setDate("");
                setTime("");
                setPrice("");
                setSeats(2);
                setErrors({});
              }}
              className="px-6 py-3 rounded-2xl bg-[#00C9B1] text-white font-semibold hover:bg-[#00C9B1]/90 transition-colors"
            >
              Offer Another
            </button>
            <button
              onClick={() => router.push("/my-rides")}
              className="px-6 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-colors"
            >
              My Rides
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Driver verification gate
  if (!isDriverVerified) {
    const missingLicense = !user.driverLicenseImage;
    const missingVehiclePic = !user.vehiclePicture;
    const missingVehicleInfo = !user.vehicleInfo;

    return (
      <div className="min-h-full bg-background pb-28">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 pt-[env(safe-area-inset-top)]">
          <div className="max-w-lg mx-auto flex items-center gap-3 py-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[18px]">Offer a Ride</h1>
              <p className="text-muted-foreground text-[12px]">
                Share your ride with fellow students
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="mb-2">Verification Required</h2>
            <p className="text-muted-foreground text-[14px]">
              To offer rides, you must upload your driver license and a vehicle picture. This keeps our community safe.
            </p>
          </div>

          {/* Checklist */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3 mb-6">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">
              Required Documents
            </p>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              missingLicense ? "bg-red-500/5 border border-red-500/15" : "bg-green-500/5 border border-green-500/15"
            }`}>
              <FileText className={`w-5 h-5 shrink-0 ${missingLicense ? "text-red-500" : "text-green-500"}`} />
              <div className="flex-1">
                <p className="text-[14px]">Driver License</p>
                <p className="text-[12px] text-muted-foreground">
                  {missingLicense ? "Not uploaded yet" : "Uploaded"}
                </p>
              </div>
              {!missingLicense && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              missingVehiclePic ? "bg-red-500/5 border border-red-500/15" : "bg-green-500/5 border border-green-500/15"
            }`}>
              <Camera className={`w-5 h-5 shrink-0 ${missingVehiclePic ? "text-red-500" : "text-green-500"}`} />
              <div className="flex-1">
                <p className="text-[14px]">Vehicle Picture</p>
                <p className="text-[12px] text-muted-foreground">
                  {missingVehiclePic ? "Not uploaded yet" : "Uploaded"}
                </p>
              </div>
              {!missingVehiclePic && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              missingVehicleInfo ? "bg-red-500/5 border border-red-500/15" : "bg-green-500/5 border border-green-500/15"
            }`}>
              <Shield className={`w-5 h-5 shrink-0 ${missingVehicleInfo ? "text-red-500" : "text-green-500"}`} />
              <div className="flex-1">
                <p className="text-[14px]">Vehicle Information</p>
                <p className="text-[12px] text-muted-foreground">
                  {missingVehicleInfo ? "Not set up yet" : `${user.vehicleInfo!.color} ${user.vehicleInfo!.make} ${user.vehicleInfo!.model}`}
                </p>
              </div>
              {!missingVehicleInfo && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
          </div>

          <button
            onClick={() => router.push("/settings?section=vehicle")}
            className="w-full py-4 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#1A3C6E]/25 flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Go to Vehicle Settings
          </button>

          <p className="text-center text-[12px] text-muted-foreground mt-3">
            Upload your documents to start offering rides
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 pt-[env(safe-area-inset-top)]">
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[18px]">Offer a Ride</h1>
            <p className="text-muted-foreground text-[12px]">
              Share your ride with fellow students
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        <div className="space-y-4">
          {/* ─── Route Section ─��─ */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
              Route
            </p>

            {/* From */}
            <div className="relative">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#1A3C6E] dark:bg-[#00C9B1] border-2 border-[#1A3C6E]/30 dark:border-[#00C9B1]/30" />
                <input
                  type="text"
                  placeholder="Starting location"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setShowFromSuggestions(true);
                    setErrors((p) => ({ ...p, from: "" }));
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 250)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-background border ${
                    errors.from ? "border-red-400" : "border-border"
                  } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]`}
                />
              </div>
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card rounded-xl border border-border shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                  {fromSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFrom(s);
                        setShowFromSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {errors.from && <p className="text-[12px] text-red-500 mt-1">{errors.from}</p>}
            </div>

            {/* Vertical connector line */}
            <div className="flex items-center pl-[18px]">
              <div className="w-px h-3 bg-border" />
            </div>

            {/* To */}
            <div className="relative">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#00C9B1] border-2 border-[#00C9B1]/30" />
                <input
                  type="text"
                  placeholder="Destination"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setShowToSuggestions(true);
                    setErrors((p) => ({ ...p, to: "" }));
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 250)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-background border ${
                    errors.to ? "border-red-400" : "border-border"
                  } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]`}
                />
              </div>
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card rounded-xl border border-border shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                  {toSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTo(s);
                        setShowToSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {errors.to && <p className="text-[12px] text-red-500 mt-1">{errors.to}</p>}
            </div>
          </div>

          {/* Route Preview Map */}
          {mapMarkers.length >= 2 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="h-36 sm:h-44">
                <MapView
                  markers={mapMarkers}
                  routePoints={routePoints}
                  darkMode={isDarkMode}
                  interactive={false}
                  className="w-full h-full"
                />
              </div>
              <div className="p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1A3C6E]" />
                <span className="text-[13px] truncate">{from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="w-2 h-2 rounded-full bg-[#00C9B1]" />
                <span className="text-[13px] truncate">{to}</span>
              </div>
            </div>
          )}

          {/* ─── Date & Time Section ─── */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mb-3">
              <Calendar className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
              Schedule
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setErrors((p) => ({ ...p, date: "" }));
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-3 rounded-xl bg-background border text-foreground ${
                      errors.date ? "border-red-400" : "border-border"
                    } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]`}
                    style={{ colorScheme: "auto" }}
                  />
                </div>
                {errors.date && <p className="text-[12px] text-red-500 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setErrors((p) => ({ ...p, time: "" }));
                    }}
                    className={`w-full px-3 py-3 rounded-xl bg-background border text-foreground ${
                      errors.time ? "border-red-400" : "border-border"
                    } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]`}
                    style={{ colorScheme: "auto" }}
                  />
                </div>
                {errors.time && <p className="text-[12px] text-red-500 mt-1">{errors.time}</p>}
              </div>
            </div>
          </div>

          {/* ─── Seats & Price Section ─── */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mb-3">
              <Users className="w-4 h-4 text-[#1A3C6E] dark:text-[#00C9B1]" />
              Ride Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Seats - stepper */}
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">
                  Seats Available
                </label>
                <div className="flex items-center gap-2 bg-background rounded-xl border border-border px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.max(1, s - 1))}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center text-[16px] tabular-nums">
                    {seats}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.min(6, s + 1))}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">
                  Price / seat
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C9B1]" />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.50"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setErrors((p) => ({ ...p, price: "" }));
                    }}
                    className={`w-full pl-9 pr-3 py-3 rounded-xl bg-background border ${
                      errors.price ? "border-red-400" : "border-border"
                    } focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all text-[14px]`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── UniRide Only Toggle ─── */}
          <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
              <div>
                <p className="text-[14px]">UniRide Only</p>
                <p className="text-[12px] text-muted-foreground">
                  Only verified students
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUniOnly(!uniOnly)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                uniOnly ? "bg-[#00C9B1]" : "bg-muted-foreground/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                  uniOnly ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* ─── Submit ─── */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-[#00C9B1] text-white font-semibold hover:bg-[#00C9B1]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#00C9B1]/20 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Publish Ride
          </button>
        </div>
      </div>
    </div>
  );
}