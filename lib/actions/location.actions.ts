"use server";

import { pusherServer } from "../pusher";
import { connectToDatabase } from "../mongodb";
import Ride from "../models/ride.model";
import { auth } from "@clerk/nextjs/server";

// Replace your existing broadcastLocation with this:
export async function broadcastLocation(
  rideId: string, 
  lat: number, 
  lng: number, 
  role: "driver" | "passenger", 
  passengerId?: string
) {
  try {
    // 1. If it's the driver, broadcast to the driver channel
    if (role === "driver") {
      await pusherServer.trigger(`ride-${rideId}`, "driver-update", { lat, lng });
      
      // Keep MongoDB updated for the driver as a backup
      await connectToDatabase();
      await Ride.findByIdAndUpdate(rideId, { currentLocation: { lat, lng } });
    } 
    // 2. If it's a passenger, broadcast to the passenger channel
    else if (role === "passenger" && passengerId) {
      await pusherServer.trigger(`ride-${rideId}`, "passenger-update", { 
        userId: passengerId, 
        lat, 
        lng 
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error broadcasting location:", error);
    return { success: false };
  }
}