"use server"; // This strictly tells Next.js: NEVER send this code to the browser!

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "../mongodb";
import User from "../models/user.model";
import { revalidatePath } from "next/cache";

export async function getLoggedInUser() {
  try {
    // 1. Get the current logged-in user's ID from Clerk
    const { userId } = await auth();

    if (!userId) {
      return null; // No one is logged in
    }

    // 2. Connect to MongoDB securely
    await connectToDatabase();

    // 3. Find the user in our database that matches the Clerk ID
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      return null;
    }

    // 4. Convert the Mongoose document into a plain Javascript object
    // (Next.js requires this to safely pass data from Server to Client)
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