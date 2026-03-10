"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "../mongodb";
import Ride from "../models/ride.model";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";

export async function createRide(rideData: any) {
  // 1. Move auth() OUTSIDE the try block so Next.js build doesn't crash
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectToDatabase();

    // 2. Find the driver in your DB
    const driver = await User.findOne({ clerkId: userId });
    if (!driver) throw new Error("Driver profile not found");

    if (!driver.isDriverVerified) {
      throw new Error("You must verify your driver's license first.");
    }

    // 3. Combine the date and time strings into a real JavaScript Date object
    // This allows us to easily delete expired rides later!
    const departureTime = new Date(`${rideData.date}T${rideData.time}`);

    // 4. Create the ride
    const newRide = await Ride.create({
      driver: driver._id,
      origin: rideData.from,
      destination: rideData.to,
      // The frontend sends [lat, lng] arrays, we convert them to objects here
      originCoords: { lat: rideData.fromCoords[0], lng: rideData.fromCoords[1] },
      destinationCoords: { lat: rideData.toCoords[0], lng: rideData.toCoords[1] },
      date: rideData.date,
      time: rideData.time,
      departureTime,
      totalSeats: rideData.totalSeats,
      availableSeats: rideData.seatsLeft,
      price: rideData.price,
      uniOnly: rideData.uniOnly,
      status: "scheduled",
      passengers: []
    });

    // 5. Increment the driver's total rides stat
    await User.findByIdAndUpdate(driver._id, { $inc: { ridesOffered: 1 } });

    // 6. Tell Next.js to refresh the UI
    revalidatePath("/browse");
    revalidatePath("/my-rides");

    return JSON.parse(JSON.stringify(newRide));
  } catch (error: any) {
    console.error("Error creating ride:", error);
    throw new Error(error.message || "Failed to create ride");
  }
}

// Add this below your createRide function

export async function getAvailableRides(searchFilters?: { from?: string; to?: string; date?: string }) {
  try {
    await connectToDatabase();

    // 1. Base query: Only show future rides that have open seats and aren't cancelled
    const query: any = {
      status: "scheduled",
      availableSeats: { $gt: 0 },
      departureTime: { $gt: new Date() } // Only fetch rides happening in the future!
    };

    // 2. Add search filters if the user typed something into the search bar
    if (searchFilters?.from) {
      query.origin = { $regex: searchFilters.from, $options: "i" }; // "i" means case-insensitive
    }
    if (searchFilters?.to) {
      query.destination = { $regex: searchFilters.to, $options: "i" };
    }
    if (searchFilters?.date) {
      query.date = searchFilters.date;
    }

    // 3. Fetch the rides AND populate the driver's details
    const rides = await Ride.find(query)
      .populate({
        path: "driver",
        model: User,
        select: "firstName lastName photo rating ridesOffered vehicleInfo isDriverVerified" // Only grab safe, public data!
      })
      .sort({ departureTime: 1 }); // Sort by soonest rides first

    return JSON.parse(JSON.stringify(rides));
  } catch (error: any) {
    console.error("Error fetching rides:", error);
    throw new Error("Failed to fetch available rides");
  }
}


export async function getRideById(rideId: string) {
  try {
    await connectToDatabase();
    
    // Find the exact ride and populate the driver info
    const ride = await Ride.findById(rideId).populate({
      path: "driver",
      model: User,
      select: "firstName lastName photo rating isDriverVerified clerkId"
    });

    if (!ride) throw new Error("Ride not found");

    return JSON.parse(JSON.stringify(ride));
  } catch (error) {
    console.error("Error fetching ride:", error);
    throw new Error("Failed to fetch ride");
  }
}

export async function bookRide(rideId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // 1. Find the user who is trying to book
    const passenger = await User.findOne({ clerkId: userId });
    if (!passenger) throw new Error("User not found");

    // 2. Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    // 3. Security Checks
    if (ride.availableSeats <= 0) throw new Error("No seats available");
    if (ride.passengers.includes(passenger._id)) throw new Error("You already booked this ride!");
    if (ride.driver.toString() === passenger._id.toString()) throw new Error("You cannot book your own ride!");

    // 4. Update the Database: Add passenger and reduce seats
    ride.passengers.push(passenger._id);
    ride.availableSeats -= 1;
    await ride.save();

    // 5. Update passenger's stat
    await User.findByIdAndUpdate(passenger._id, { $inc: { ridesTaken: 1 } });

    revalidatePath(`/ride/${rideId}`);
    revalidatePath("/my-rides");

    return { success: true };
  } catch (error: any) {
    console.error("Error booking ride:", error);
    throw new Error(error.message || "Failed to book ride");
  }
}

export async function getMyRides() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Find the current logged-in user
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // 1. Fetch rides where the user is the driver
    const offeredRides = await Ride.find({ driver: user._id })
      .populate({
        path: "driver",
        model: User,
        select: "firstName lastName photo rating"
      })
      .sort({ departureTime: 1 }); // Sort by soonest

    // 2. Fetch rides where the user is in the passengers array
    const bookedRides = await Ride.find({ passengers: user._id })
      .populate({
        path: "driver",
        model: User,
        select: "firstName lastName photo rating"
      })
      .sort({ departureTime: 1 });

    return {
      offeredRides: JSON.parse(JSON.stringify(offeredRides)),
      bookedRides: JSON.parse(JSON.stringify(bookedRides))
    };
  } catch (error: any) {
    console.error("Error fetching my rides:", error);
    throw new Error(error.message || "Failed to fetch my rides");
  }
}

export async function updateRideStatus(rideId: string, status: "active" | "completed" | "cancelled") {
  try {
    await connectToDatabase();
    await Ride.findByIdAndUpdate(rideId, { status });
    return { success: true };
  } catch (error) {
    console.error("Error updating ride status:", error);
    return { success: false };
  }
}

export async function getActiveRide() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });
    if (!user) return null;

    // Look for any ride that is currently "active" where the user is EITHER the driver OR a passenger
    const activeRide = await Ride.findOne({
      status: "active",
      $or: [{ driver: user._id }, { passengers: user._id }]
    }).populate({
      path: "driver",
      model: User,
      select: "firstName lastName"
    });

    return activeRide ? JSON.parse(JSON.stringify(activeRide)) : null;
  } catch (error) {
    console.error("Error fetching active ride:", error);
    return null;
  }
}