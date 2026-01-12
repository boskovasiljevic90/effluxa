import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // run on all routes except Next internals/static
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|txt|map)).*)",
    // always run for API routes
    "/(api|trpc)(.*)",
  ],
};
