"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Ride from "@/lib/models/ride.model";
import User from "@/lib/models/user.model";

export interface PassengerInfo {
  userId: string;
  firstName: string;
  lastName: string;
  photo: string;
}

export interface EarningEntry {
  rideId: string;
  origin: string;
  destination: string;
  departureTime: string;
  date: string;
  time: string;
  passengers: number;
  passengerList: PassengerInfo[];  // populated passenger details
  totalSeats: number;
  price: number;
  totalEarned: number;
  status: "completed" | "cancelled";
}

export interface EarningsData {
  entries: EarningEntry[];
  totalEarned: number;
  completedRides: number;
  cancelledRides: number;
  totalPassengers: number;
  avgPerRide: number;
  rating: number;
  ridesOffered: number;
}

export async function getDriverEarnings(): Promise<EarningsData> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  await connectToDatabase();

  const dbUser = await User.findOne({ clerkId })
    .select("_id rating ridesOffered").lean() as any;
  if (!dbUser) throw new Error("User not found");

  // Populate passengers with firstName, lastName, photo
  const rides = await Ride.find({
    driver: dbUser._id,
    status: { $in: ["completed", "cancelled"] },
  })
    .select("origin destination departureTime date time passengers totalSeats price status")
    .populate("passengers", "firstName lastName photo")
    .sort({ departureTime: -1 })
    .lean();

  const entries: EarningEntry[] = (rides as any[]).map((ride) => {
    const passengerList: PassengerInfo[] = (ride.passengers ?? [])
      .filter((p: any) => p && typeof p === "object" && p._id) // filter out unresolved refs
      .map((p: any) => ({
        userId: p._id.toString(),
        firstName: p.firstName ?? "Unknown",
        lastName: p.lastName ?? "",
        photo: p.photo ?? "",
      }));

    const passengerCount = passengerList.length;
    const totalEarned = ride.status === "completed" ? ride.price * passengerCount : 0;

    return {
      rideId: ride._id.toString(),
      origin: ride.origin,
      destination: ride.destination,
      departureTime: ride.departureTime?.toISOString?.() ?? String(ride.departureTime),
      date: ride.date ?? "",
      time: ride.time ?? "",
      passengers: passengerCount,
      passengerList,
      totalSeats: ride.totalSeats ?? 0,
      price: ride.price,
      totalEarned,
      status: ride.status,
    };
  });

  const completed       = entries.filter(e => e.status === "completed");
  const cancelled       = entries.filter(e => e.status === "cancelled");
  const totalEarned     = completed.reduce((sum, e) => sum + e.totalEarned, 0);
  const totalPassengers = completed.reduce((sum, e) => sum + e.passengers, 0);
  const avgPerRide      = completed.length > 0 ? Math.round(totalEarned / completed.length) : 0;

  return {
    entries,
    totalEarned,
    completedRides: completed.length,
    cancelledRides: cancelled.length,
    totalPassengers,
    avgPerRide,
    rating: dbUser.rating ?? 5.0,
    ridesOffered: dbUser.ridesOffered ?? 0,
  };
}