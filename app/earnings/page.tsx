"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Car, Star, Wallet, TrendingUp, Users, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/page-transition";
import { PassengerInfo, EarningEntry, EarningsData, getDriverEarnings } from "@/lib/actions/earnings.actions";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import useSWR from "swr";

// ─── Helpers ──────────────────────────────────────────────
function formatTime(time: string) {
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  } catch { return time; }
}

function formatDate(date: string) {
  try {
    const [y, mo, d] = date.split("-");
    return new Date(+y, +mo - 1, +d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  } catch { return date; }
}

// ─── Page ──────────────────────────────────────────────────
export default function EarningsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<EarningEntry | null>(null);

  // Sheet refs
  const sheetRef      = useRef<HTMLDivElement>(null);
  const dragStartY    = useRef<number>(0);
  const currentDragY  = useRef<number>(0);
  const isDragging    = useRef<boolean>(false);

  const { data, isLoading } = useSWR<EarningsData>("driverEarnings", getDriverEarnings, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });

  // ── Open sheet
  const openSheet = (entry: EarningEntry) => {
    setSelected(entry);
    requestAnimationFrame(() => {
      import("gsap").then(({ gsap: g }) => {
        if (sheetRef.current) {
          g.fromTo(sheetRef.current,
            { y: "100%" },
            { y: "0%", duration: 0.4, ease: "power3.out" }
          );
        }
      });
    });
  };

  // ── Close sheet
  const closeSheet = () => {
    import("gsap").then(({ gsap: g }) => {
      if (sheetRef.current) {
        g.to(sheetRef.current, {
          y: "100%", duration: 0.35, ease: "power3.in",
          onComplete: () => setSelected(null),
        });
      }
    });
  };

  // ── Swipe down gesture handlers
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return; // block upward drag
    currentDragY.current = delta;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    const threshold = 120; // px dragged down to trigger close
    if (currentDragY.current > threshold) {
      closeSheet();
    } else {
      // Snap back
      import("gsap").then(({ gsap: g }) => {
        if (sheetRef.current)
          g.to(sheetRef.current, { y: 0, duration: 0.25, ease: "power2.out" });
      });
    }
    currentDragY.current = 0;
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">

      {/* ── NAVY HEADER ── */}
      <div className="bg-[#1A3C6E] dark:bg-[#0f2548] px-5 pt-5 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="absolute -bottom-4 right-6 w-28 h-28 rounded-full bg-[#00C9B1]/20 blur-2xl pointer-events-none" />

        {/* Back + title */}
        <div className="relative flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Earnings</h1>
        </div>

        {/* Big total */}
        <div className="relative text-center mb-5">
          <p className="text-white/50 text-[11px] uppercase tracking-widest mb-1">Total earned</p>
          {isLoading ? (
            <div className="h-10 w-36 rounded-xl bg-white/10 animate-pulse mx-auto" />
          ) : (
            <>
              <p className="text-white text-4xl font-bold">
                Rs {(data?.totalEarned ?? 0).toLocaleString()}
              </p>
              <p className="text-white/50 text-[12px] mt-1">
                {data?.completedRides ?? 0} completed ride{data?.completedRides !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* 4 stat pills */}
        <div className="relative grid grid-cols-2 gap-2">
          <StatPill icon={<Wallet className="w-4 h-4 text-[#00C9B1]" />}
            value={isLoading ? "—" : `Rs ${(data?.avgPerRide ?? 0).toLocaleString()}`}
            label="Avg per ride" />
          <StatPill icon={<Users className="w-4 h-4 text-[#00C9B1]" />}
            value={isLoading ? "—" : String(data?.totalPassengers ?? 0)}
            label="Total passengers" />
          <StatPill icon={<Car className="w-4 h-4 text-[#00C9B1]" />}
            value={isLoading ? "—" : String(data?.ridesOffered ?? 0)}
            label="Rides offered" />
          <StatPill icon={<Star className="w-4 h-4 text-yellow-400" />}
            value={isLoading ? "—" : String(data?.rating ?? "—")}
            label="Driver rating" />
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-5">

          {(data?.cancelledRides ?? 0) > 0 && (
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 mb-4">
              <span className="text-[13px] text-muted-foreground">Cancelled rides</span>
              <span className="text-[13px] font-semibold text-red-500">{data!.cancelledRides}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold">All rides</h2>
            {!isLoading && (
              <span className="text-[12px] text-muted-foreground">{data?.entries.length ?? 0} total</span>
            )}
          </div>

          {isLoading && (
            <div className="space-y-2.5">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-3 rounded bg-muted" />
                    <div className="w-1/2 h-2 rounded bg-muted" />
                  </div>
                  <div className="w-16 h-4 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (data?.entries.length ?? 0) === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-[15px]">No earnings yet</p>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-[180px] mx-auto">
                Complete a ride to see your earnings here
              </p>
            </div>
          )}

          {!isLoading && (data?.entries.length ?? 0) > 0 && (
            <div className="space-y-2.5">
              {data!.entries.map(entry => (
                <EarningRow key={entry.rideId} entry={entry} onPress={() => openSheet(entry)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      {selected && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeSheet} />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            style={{ transform: "translateY(100%)" }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Drag handle — visual cue for swipe */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
            </div>

            <div className="bg-card rounded-t-3xl px-5 pt-3 pb-10 max-h-[85vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold">Ride Details</h2>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  selected.status === "completed"
                    ? "bg-[#00C9B1]/15 text-[#00C9B1]"
                    : "bg-red-100 dark:bg-red-900/30 text-red-500"
                }`}>
                  {selected.status === "completed" ? "Completed" : "Cancelled"}
                </span>
              </div>

              {/* Route */}
              <div className="bg-[#f2f5fc] dark:bg-[#1C2333] rounded-2xl p-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-0.5">
                    <div className="w-3 h-3 rounded-full bg-[#1A3C6E] dark:bg-[#00C9B1] shrink-0" />
                    <div className="w-px flex-1 my-1 border-l-2 border-dashed border-muted-foreground/30" />
                    <MapPin className="w-3.5 h-3.5 text-[#00C9B1] shrink-0" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">From</p>
                      <p className="text-[13px] font-semibold">{selected.origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">To</p>
                      <p className="text-[13px] font-semibold">{selected.destination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date + time */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                  <p className="text-[13px] font-semibold">{formatDate(selected.date)}</p>
                </div>
                <div className="bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Departure</p>
                  <p className="text-[13px] font-semibold">{formatTime(selected.time)}</p>
                </div>
              </div>

              {/* Seats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Seats filled</p>
                  <p className="text-[13px] font-semibold">{selected.passengers} / {selected.totalSeats}</p>
                </div>
                <div className="bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Price per seat</p>
                  <p className="text-[13px] font-semibold">Rs {selected.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Passengers section */}
              {(selected.passengerList ?? []).length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">
                    Passengers ({(selected.passengerList ?? []).length})
                  </p>
                  <div className="space-y-2.5">
                    {(selected.passengerList ?? []).map((p, i) => (
                      <PassengerRow key={p.userId} passenger={p} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {(selected.passengerList ?? []).length === 0 && (
                <div className="mb-4 bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl px-4 py-3">
                  <p className="text-[13px] text-muted-foreground">No passengers on this ride</p>
                </div>
              )}

              {/* Earnings breakdown */}
              <div className="bg-[#1A3C6E]/8 dark:bg-[#00C9B1]/8 border border-[#1A3C6E]/15 dark:border-[#00C9B1]/15 rounded-2xl p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Earnings breakdown</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-muted-foreground">
                    Rs {selected.price.toLocaleString()} × {selected.passengers} passenger{selected.passengers !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[13px] font-semibold">
                    Rs {(selected.price * selected.passengers).toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold">Total earned</span>
                  <span className={`text-[18px] font-bold ${
                    selected.status === "completed"
                      ? "text-[#1A3C6E] dark:text-[#00C9B1]"
                      : "text-muted-foreground line-through"
                  }`}>
                    Rs {selected.totalEarned.toLocaleString()}
                  </span>
                </div>
                {selected.status === "cancelled" && (
                  <p className="text-[11px] text-red-500 mt-2">No earnings — this ride was cancelled</p>
                )}
              </div>

            </div>
          </div>
        </>
      )}

    </PageTransition>
  );
}

// ─── Passenger row ─────────────────────────────────────────
function PassengerRow({ passenger, index }: { passenger: PassengerInfo; index: number }) {
  const initials = `${passenger.firstName[0] ?? ""}${passenger.lastName[0] ?? ""}`.toUpperCase();
  const colors = ["bg-[#1A3C6E]", "bg-[#00C9B1]", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
  const color = colors[index % colors.length];

  return (
    <div className="flex items-center gap-3 bg-[#f2f5fc] dark:bg-[#1C2333] rounded-xl px-3 py-2.5">
      {passenger.photo ? (
        <ImageWithFallback
          src={passenger.photo}
          alt={passenger.firstName}
          className="w-9 h-9 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-[12px] font-bold">{initials}</span>
        </div>
      )}
      <p className="text-[13px] font-medium">
        {passenger.firstName} {passenger.lastName}
      </p>
    </div>
  );
}

// ─── Stat pill ─────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white text-[14px] font-bold">{value}</p>
      <p className="text-white/50 text-[10px]">{label}</p>
    </div>
  );
}

// ─── Earning row ───────────────────────────────────────────
function EarningRow({ entry, onPress }: { entry: EarningEntry; onPress: () => void }) {
  const isCancelled = entry.status === "cancelled";

  const displayDate = useMemo(() => {
    try {
      return new Date(entry.departureTime).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
    } catch { return "—"; }
  }, [entry.departureTime]);

  return (
    <button
      onClick={onPress}
      className={`w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors active:scale-[0.98] text-left ${isCancelled ? "opacity-50" : ""}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isCancelled ? "bg-muted" : "bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10"
      }`}>
        <Car className={`w-5 h-5 ${isCancelled ? "text-muted-foreground" : "text-[#1A3C6E] dark:text-[#00C9B1]"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate">{entry.origin} → {entry.destination}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground">{displayDate}</span>
          {entry.passengers > 0 && (
            <span className="text-[11px] text-muted-foreground">
              · {entry.passengers} passenger{entry.passengers !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">· Rs {entry.price}/seat</span>
          {isCancelled && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* Passenger avatars preview */}
      {(entry.passengerList ?? []).length > 0 && (
        <div className="flex -space-x-2 mr-1 shrink-0">
          {(entry.passengerList ?? []).slice(0, 3).map((p, i) => (
            <div key={p.userId} className="w-6 h-6 rounded-full border-2 border-card overflow-hidden bg-[#1A3C6E] flex items-center justify-center"
              style={{ zIndex: entry.passengerList.length - i }}>
              {p.photo ? (
                <img src={p.photo} alt={p.firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[8px] font-bold">
                  {p.firstName[0]}{p.lastName[0]}
                </span>
              )}
            </div>
          ))}
          {(entry.passengerList ?? []).length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center">
              <span className="text-[8px] text-muted-foreground font-bold">+{(entry.passengerList ?? []).length - 3}</span>
            </div>
          )}
        </div>
      )}

      <p className={`text-[15px] font-bold shrink-0 ${
        isCancelled ? "text-muted-foreground line-through" : "text-[#1A3C6E] dark:text-[#00C9B1]"
      }`}>
        Rs {(isCancelled ? entry.price * entry.passengers : entry.totalEarned).toLocaleString()}
      </p>
    </button>
  );
}