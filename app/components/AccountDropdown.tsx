"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { User, LogOut, UserPlus, LogIn, Settings, Sparkles } from "lucide-react";

interface AccountDropdownProps {
  isAnonUser?: boolean;
  anonUserId?: string;
  onAnonLogout?: () => void;
}

export function AccountDropdown({ isAnonUser, anonUserId, onAnonLogout }: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useUser();
  
  // Determine if user is logged in (either Clerk or anonymous)
  const isLoggedIn = isSignedIn || isAnonUser;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAnonAccount = () => {
    setIsOpen(false);
    router.push("/anon-account");
  };

  const handleAnonLogout = () => {
    if (onAnonLogout) {
      onAnonLogout();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto px-4 py-2 text-[#e4e6eb] font-medium hover:text-white transition-colors text-sm whitespace-nowrap flex items-center gap-2 justify-center sm:justify-start cursor-pointer"
      >
        <User className="w-4 h-4" />
        Account
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                mass: 0.8,
              }}
              className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 bg-[#1a1b23] border border-[#2d2f36]/30 rounded-lg shadow-2xl z-50 overflow-hidden"
              style={{
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="p-2">
                {/* Only show auth options if user is NOT logged in */}
                {!isLoggedIn && (
                  <>
                    {/* Clerk Auth Buttons */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-1"
                    >
                      <SignInButton mode="modal">
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-[#e4e6eb] hover:bg-[#2d2f36] rounded-lg transition-colors text-sm cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </motion.div>
                      </SignInButton>

                      <SignUpButton mode="modal">
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-[#e4e6eb] hover:bg-[#2d2f36] rounded-lg transition-colors text-sm cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          Sign Up
                        </motion.div>
                      </SignUpButton>
                    </motion.div>

                    {/* Divider */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.15, duration: 0.2 }}
                      className="my-2 h-px bg-[#2d2f36]/50"
                    />

                    {/* Anonymous Account Button */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.button
                        whileHover={{
                          scale: 1.02,
                          x: 4,
                          backgroundColor: "rgba(88, 101, 242, 0.1)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnonAccount}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#5865f2] hover:bg-[#2d2f36] rounded-lg transition-colors text-sm font-medium cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        Anonymous Sign Up
                      </motion.button>
                    </motion.div>
                  </>
                )}

                {/* Show settings and logout if anon user is logged in */}
                {isAnonUser && (
                  <>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.25, duration: 0.2 }}
                      className="my-2 h-px bg-[#2d2f36]/50"
                    />
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-1"
                    >
                      <motion.button
                        whileHover={{
                          scale: 1.02,
                          x: 4,
                          backgroundColor: "rgba(88, 101, 242, 0.1)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/settings");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#5865f2] hover:bg-[#2d2f36] rounded-lg transition-colors text-sm cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </motion.button>
                      <motion.button
                        whileHover={{
                          scale: 1.02,
                          x: 4,
                          backgroundColor: "rgba(251, 191, 36, 0.1)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/perks");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-yellow-400 hover:bg-[#2d2f36] rounded-lg transition-colors text-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Perks
                      </motion.button>
                      <motion.button
                        whileHover={{
                          scale: 1.02,
                          x: 4,
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnonLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-[#2d2f36] rounded-lg transition-colors text-sm cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </motion.button>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

