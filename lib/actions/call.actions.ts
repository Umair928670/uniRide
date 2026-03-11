"use server";

import Pusher from "pusher";

// Initialize the Pusher Server to trigger events
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function sendIncomingCallSignal(rideId: string, targetUserId: string, callerName: string, roomId: string) {
  try {
    // Blast a real-time signal specifically to this ride's channel
    await pusherServer.trigger(`ride-${rideId}`, "incoming-call", {
      targetUserId,
      callerName,
      roomId,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send call signal", error);
    return { success: false };
  }
}