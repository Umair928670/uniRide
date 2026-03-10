import Pusher from "pusher";

// We use the 'server' instance of Pusher here because it uses your secret key.
// NEVER expose your PUSHER_SECRET to the frontend!
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});