import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|txt|map)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
