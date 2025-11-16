"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { isIPBanned, getUserIP } from "@/app/lib/ip-utils";
import Link from "next/link";

export function IPBanChecker() {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkBan = async () => {
      setIsChecking(true);
      const ip = await getUserIP();
      if (ip) {
        const banStatus = await isIPBanned(ip);
        if (banStatus.banned) {
          setIsBanned(true);
          setBanReason(banStatus.reason || "Violation of Terms of Service");
        }
      }
      setIsChecking(false);
    };

    // Don't check on terms/privacy pages
    if (pathname !== "/terms" && pathname !== "/privacy") {
      checkBan();
    } else {
      setIsChecking(false);
    }
  }, [pathname]);

  if (isChecking || !isBanned) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-red-500/10 border-b-2 border-red-500/50 backdrop-blur-lg"
      >
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-400 mb-1">
                Access Denied - IP Permanently Banned
              </h3>
              <p className="text-red-300/90 text-sm mb-2">
                Your IP address has been permanently banned from this platform.
                {banReason && (
                  <span className="block mt-1">
                    <strong>Reason:</strong> {banReason}
                  </span>
                )}
              </p>
              <p className="text-red-300/80 text-xs">
                This ban is permanent and cannot be appealed. Please review our{" "}
                <Link href="/terms" className="underline hover:text-red-200">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-red-200">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

