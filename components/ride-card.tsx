import { Star, ArrowRight, Clock, Users } from "lucide-react";
import { Ride } from "./mock-data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useRouter } from "next/navigation";
import router from "next/dist/shared/lib/router/router";

interface RideCardProps {
  ride: Ride;
  isPast?: boolean;
  onCancel?: (id: string) => void;
  isBooked?: boolean;
}

export function RideCard({ ride, isPast = false, onCancel, isBooked = false }: RideCardProps) {
  const router = useRouter();

  return (
    <div
      className={`bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-all hover:shadow-md active:scale-[0.99] ${
        isPast ? "opacity-70" : ""
      }`}
      style={{
        borderLeft: `4px solid ${
          isPast ? "#6B7280" : ride.status === "available" ? "#22C55E" : "#F59E0B"
        }`,
      }}
    >
      <div className="p-4">
        {/* Driver Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ImageWithFallback
                src={ride.driverAvatar}
                alt={ride.driverName}
                className="w-10 h-10 rounded-full object-cover"
              />
              {ride.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00C9B1] rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-card-foreground">{ride.driverName}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[12px] text-muted-foreground">
                  {ride.rating}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-[#00C9B1]/10 text-[#00C9B1] px-3 py-1 rounded-full font-semibold">
            ${ride.price}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1A3C6E]" />
            <div className="w-0.5 h-6 bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00C9B1]" />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <p className="text-[13px] truncate">{ride.from}</p>
            <p className="text-[13px] truncate">{ride.to}</p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[12px]">
                {ride.date} · {ride.departureTime}
              </span>
            </div>
            {!isPast && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] ${
                  ride.seatsLeft <= 1
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                <Users className="w-3 h-3" />
                {ride.seatsLeft} left
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isBooked && onCancel && !isPast && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(ride.id);
                }}
                className="px-3 py-1.5 rounded-xl text-[13px] font-medium text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Cancel
              </button>
            )}
            {!isPast && !isBooked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/ride/${ride.id}`);
                }}
                className="bg-[#1A3C6E] text-white px-4 py-1.5 rounded-xl text-[13px] font-semibold hover:bg-[#1A3C6E]/90 transition-colors flex items-center gap-1 active:scale-95"
              >
                Request <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isPast && (
              <span className="text-[12px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
