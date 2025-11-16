"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";

export function AuthRedirectGuard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    const anon = getAnonUserId();
    const signedIn = !!user || !!anon;

    // Only guard specific pages; allow public routes and auth pages
    const PROTECTED_PREFIXES = ["/discover", "/trending", "/admin", "/my", "/settings"];
    const isProtected = !!pathname && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const isAuthRoute =
      !!pathname &&
      (pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/anon-account"));

    if (!signedIn && isProtected && !isAuthRoute) {
      router.replace("/home");
    }
  }, [isLoaded, user, pathname, router]);

  return null;
}


