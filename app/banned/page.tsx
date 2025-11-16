"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BannedPage() {
  const router = useRouter();
  useEffect(() => {
    // prevent back navigation to content
    const handler = (e: PopStateEvent) => {
      router.replace("/banned");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-3">Access Restricted</h1>
      <p className="text-[#b9bbbe]">
        Your access has been banned. If you believe this is an error, please contact support.
      </p>
    </div>
  );
}


