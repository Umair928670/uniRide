"use server"; // This strictly tells Next.js: NEVER send this code to the browser!

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "../mongodb";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function getLoggedInUser() {
  try {
    // 1. Get the FULL user object from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null; 
    }

    await connectToDatabase();

    // 2. Try to find them in MongoDB
    let dbUser = await User.findOne({ clerkId: clerkUser.id });

    // 3. THE FALLBACK: If they don't exist yet, create them INSTANTLY!
    if (!dbUser) {
      console.log("User not found in DB. Running fallback creation...");
      
      dbUser = await User.create({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        photo: clerkUser.imageUrl || "/default-avatar.png",
        
        // ---> THIS IS THE KEY! It forces the layout to show the overlay! <---
        role: "none", 
        
        // Default required fields
        university: "",
        department: "", 
        verified: false,
        ridesTaken: 0,
        ridesOffered: 0,
        rating: 5.0,
      });
      console.log("Fallback user created successfully with role 'none'!");
    }

    return JSON.parse(JSON.stringify(dbUser));
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}


export async function updateUser(updateData: any) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Find the user by their Clerk ID and update them with the new data
    // { new: true } tells MongoDB to return the newly updated document
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found in database");

    // Tell Next.js to clear its cache so the Profile page shows the fresh data!
    revalidatePath("/profile");
    revalidatePath("/settings");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}

// ---> NEW: Function to save the user's role during onboarding <---
export async function updateUserRole(role: "passenger" | "driver" | "both") {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Find the user by their Clerk ID and strictly update their role
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: { role: role } },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found in database");

    // Clear the cache for the home page so the overlay disappears instantly
    revalidatePath("/");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
}