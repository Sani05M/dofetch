import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/api/webhook(.*)", // For clerk/supabase sync
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth();
    
    // 1. Force Login
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    const email = sessionClaims?.email as string;

    // 2. Adamas University Domain Lock
    if (email) {
      const isStudent = email.endsWith("@stu.adamasuniversity.ac.in");
      const isFaculty = email.endsWith("@adamasuniversity.ac.in");

      if (!isStudent && !isFaculty) {
        // Log them out or send to unauthorized if not an Adamas account
        return NextResponse.redirect(new URL("/login?error=unauthorized_domain", req.url));
      }

      // 3. Auto-Redirect based on Domain (Role Logic)
      const url = req.nextUrl.pathname;
      
      if (isStudent && url.startsWith("/faculty")) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }

      if (isFaculty && url.startsWith("/student")) {
        return NextResponse.redirect(new URL("/faculty/dashboard", req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
