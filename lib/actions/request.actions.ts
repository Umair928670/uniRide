"use server";

import { connectToDatabase } from "../mongodb";
import RideRequest from "../models/request.model";
import Ride from "../models/ride.model";
import { getLoggedInUser } from "./user.actions";
import Pusher from "pusher";
import {auth} from "@clerk/nextjs/server";
import User from "../models/user.model";

// Initialize Pusher Server
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function createRideRequest(rideId: string, driverId: string) {
  try {
    await connectToDatabase();
    const user = await getLoggedInUser();
    
    if (!user) throw new Error("You must be logged in to request a ride.");

    const existingRequest = await RideRequest.findOne({ ride: rideId, passenger: user._id });
    if (existingRequest) throw new Error("You have already sent a request for this ride.");

    const newRequest = await RideRequest.create({
      ride: rideId,
      driver: driverId,
      passenger: user._id,
      status: "pending",
    });

    // ---> THE FIX: Check if the photo is a massive string. If so, don't send it through Pusher!
    let safePhoto = "/default-avatar.png";
    if (user.photo && user.photo.length < 1000) {
      safePhoto = user.photo; // It's a normal URL, safe to send!
    }

    // PING THE DRIVER INSTANTLY
    await pusherServer.trigger(`ride-${rideId}`, "new-request", {
      _id: newRequest._id,
      passenger: {
        _id: user._id.toString(), // Ensure this is a string, not a MongoDB ObjectId
        firstName: user.firstName,
        lastName: user.lastName,
        photo: safePhoto,
        rating: user.rating || 5.0
      }
    });

    return JSON.parse(JSON.stringify(newRequest));
  } catch (error: any) {
    console.error("Pusher/DB Error:", error);
    throw new Error(error.message || "Failed to create request");
  }
}

// 2. Check if the user already requested this ride
export async function checkMyRequestStatus(rideId: string) {
  try {
    await connectToDatabase();
    const user = await getLoggedInUser();
    if (!user) return null;

    const request = await RideRequest.findOne({ ride: rideId, passenger: user._id });
    return request ? request.status : null; 
  } catch (error) {
    return null;
  }
}

// 3. Fetch all pending requests for a specific ride (For the Driver)
export async function getPendingRequestsForRide(rideId: string) {
  try {
    await connectToDatabase();
    const requests = await RideRequest.find({ ride: rideId, status: "pending" })
      .populate("passenger", "firstName lastName photo rating") 
      .lean();
    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    return [];
  }
}

// 4. Handle Accept or Decline
export async function respondToRequest(requestId: string, action: "accept" | "decline") {
  try {
    await connectToDatabase();
    const request = await RideRequest.findById(requestId).populate("passenger");
    if (!request) throw new Error("Request not found");

    if (action === "accept") {
      const ride = await Ride.findById(request.ride);
      if (ride.availableSeats <= 0) throw new Error("No seats available!");

      ride.passengers.push(request.passenger._id);
      ride.availableSeats -= 1;
      await ride.save();

      request.status = "accepted";
      await request.save();
    } else {
      request.status = "declined";
      await request.save();
    }

    // PING THE PASSENGER INSTANTLY
    await pusherServer.trigger(`ride-${request.ride}`, "request-status-update", {
      passengerId: request.passenger._id.toString(),
      status: action === "accept" ? "accepted" : "declined"
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to process request");
  }
}

// 5. Cancel a ride request
export async function cancelRideRequest(rideId: string) {
  try {
    await connectToDatabase();
    const user = await getLoggedInUser();
    if (!user) throw new Error("You must be logged in.");

    const request = await RideRequest.findOne({ ride: rideId, passenger: user._id });
    if (!request) throw new Error("No active request found.");

    const previousStatus = request.status;
    request.status = "cancelled";
    await request.save();

    if (previousStatus === "accepted") {
      const ride = await Ride.findById(rideId);
      if (ride) {
        ride.passengers = ride.passengers.filter((p: any) => p.toString() !== user._id.toString());
        ride.availableSeats += 1;
        await ride.save();
      }
    }

    // PING THE DRIVER INSTANTLY
    await pusherServer.trigger(`ride-${rideId}`, "passenger-cancelled", {
      passengerId: user._id.toString(),
      passengerName: `${user.firstName} ${user.lastName}`,
      wasAccepted: previousStatus === "accepted"
    });

    return { success: true, wasAccepted: previousStatus === "accepted" };
  } catch (error: any) {
    throw new Error(error.message || "Failed to cancel ride");
  }
}


export async function cancelRideBooking(rideId: string) {
  try {
    await connectToDatabase();

    // 1. Authenticate the current user (the passenger cancelling)
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    // 2. Find their active request for this ride
    const request = await RideRequest.findOne({
      ride: rideId,
      passenger: user._id,
      status: { $in: ["pending", "accepted"] }
    });

    if (!request) {
      throw new Error("No active booking found to cancel.");
    }

    const wasAccepted = request.status === "accepted";

    // 3. Mark the request as cancelled
    request.status = "cancelled";
    await request.save();

    // 4. If they were already accepted, we must free up the seat and remove them from the car
    if (wasAccepted) {
      // Remove passenger from the ride's passenger array
      ride.passengers = ride.passengers.filter(
        (passengerId: any) => passengerId.toString() !== user._id.toString()
      );
      
      // Give the seat back
      ride.availableSeats += 1;
      await ride.save();

      // Remove the ride from the user's bookedRides history (optional, depending on if you want to keep a history of cancelled rides)
      // user.bookedRides = user.bookedRides.filter((id: any) => id.toString() !== rideId.toString());
      // await user.save();
    }

    // 5. Fire the Real-Time Notification to the Driver
    // This tells the driver's screen to instantly remove the passenger and add +1 to available seats
    await pusherServer.trigger(`ride-${rideId}`, "passenger-cancelled", {
      passengerId: user._id.toString(),
      passengerName: user.firstName,
      wasAccepted: wasAccepted
    });

    return JSON.parse(JSON.stringify({ success: true, message: "Ride cancelled successfully" }));
  } catch (error: any) {
    console.error("Error cancelling ride:", error);
    throw new Error(error.message || "Failed to cancel ride booking.");
  }
}