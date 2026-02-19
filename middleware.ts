import { clerkMiddleware } from "@clerk/nextjs";

export default clerkMiddleware({
  publicRoutes: ["/"],
});

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico).*)",
  ],
};
