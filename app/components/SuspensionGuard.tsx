"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAnonUserId } from "@/app/lib/anon-auth";

export function SuspensionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const run = async () => {
      try {
        const anonUserId = getAnonUserId();
        const res = await fetch("/api/suspensions/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonUserId: anonUserId || null }),
        });
        const data = await res.json();
        const onSuspended = pathname?.startsWith("/suspended");
        const onBanned = pathname?.startsWith("/banned");

        // one-time notice after termination ends
        const KEY = "lastTerminationUntil";
        const storedUntil = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;

        if (data?.banned) {
          // ensure we land on banned page
          if (!onBanned) router.replace("/banned");
          if (storedUntil) window.localStorage.removeItem(KEY);
        } else if (data?.terminatedUntil) {
          try {
            window.localStorage.setItem(KEY, data.terminatedUntil);
          } catch {}
          if (!onSuspended) router.replace(`/suspended?until=${encodeURIComponent(data.terminatedUntil)}`);
        } else {
          // not restricted; if currently on restricted pages, leave
          if (onBanned || onSuspended) router.replace("/home");
          else if (storedUntil) {
            const ended = Date.now() >= new Date(storedUntil).getTime();
            if (ended) {
              window.localStorage.removeItem(KEY);
              router.replace("/suspended?expired=1");
            }
          }
        }
        setChecking(false);
      } catch {}
    };
    run();
  }, [router, pathname]);

  if (checking && !(pathname?.startsWith("/suspended") || pathname?.startsWith("/banned"))) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0e1016]"></div>
    );
  }
  return null;
}


