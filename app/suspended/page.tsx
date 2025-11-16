"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAnonUserId } from "@/app/lib/anon-auth";

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function SuspendedPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const until = params.get("until");
  const untilMs = useMemo(() => (until ? new Date(until).getTime() : 0), [until]);
  // Initialize as null to avoid SSR/client mismatch; set after mount
  const [remaining, setRemaining] = useState<number | null>(null);
  const expired = params.get("expired") === "1";
  const [cleared, setCleared] = useState(expired);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, untilMs - Date.now()));
    tick(); // set immediately after mount
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [untilMs]);

  // Poll server to see if the termination got cleared early by admin
  useEffect(() => {
    if (expired) return; // already showing final message
    let stop = false;
    const check = async () => {
      try {
        const anonUserId = getAnonUserId();
        const res = await fetch("/api/suspensions/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonUserId: anonUserId || null }),
        });
        const data = await res.json();
        if (!data?.banned && !data?.terminatedUntil) {
          setCleared(true);
          // auto redirect after a brief delay
          setTimeout(() => {
            if (!stop) router.replace("/home");
          }, 1500);
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [router, expired]);

  // When countdown ends on this page, flip to cleared state then redirect
  useEffect(() => {
    if (remaining !== null && remaining <= 0) {
      setCleared(true);
      const id = setTimeout(() => router.replace("/home"), 1500);
      return () => clearTimeout(id);
    }
  }, [remaining, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-3">Temporary Suspension</h1>
      {cleared ? (
        <>
          <p className="text-[#b9bbbe] mb-4">
            Your access has been restored. Please follow the community rules to avoid future restrictions.
          </p>
          <button
            onClick={() => router.replace("/home")}
            className="px-5 py-2 rounded-lg bg-[#5865f2] text-white border border-[#6a75f5] cursor-pointer"
          >
            Go back
          </button>
        </>
      ) : until ? (
        <>
          <p className="text-[#b9bbbe] mb-4">
            Your account is temporarily suspended. You will regain access when the timer expires.
          </p>
          <div className="inline-block px-6 py-3 rounded-xl bg-[#1f2330] border border-[#2d2f36] text-2xl font-mono" suppressHydrationWarning>
            {remaining === null ? "— — : — — : — —" : formatRemaining(remaining)}
          </div>
        </>
      ) : (
        <p className="text-[#b9bbbe]">Your account is temporarily suspended.</p>
      )}
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center">Loading...</div>}>
      <SuspendedPageInner />
    </Suspense>
  );
}


