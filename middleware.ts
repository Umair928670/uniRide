import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which pages anyone can see without logging in
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/search(.*)',
  '/api/webhooks(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is NOT public, force them to log in
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};