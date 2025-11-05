"use client";

import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRef } from "react";
import { motion } from "framer-motion";

export function UserProfile() {
  const { user } = useUser();
  const userButtonRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Get user's name from username or email and capitalize first letter
  const getName = () => {
    const name = user.username || 
                 user.firstName || 
                 user.primaryEmailAddress?.emailAddress?.split("@")[0] || 
                 "User";
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };
  
  const displayName = getName();

  const handleNameClick = () => {
    // Trigger click on UserButton to open the menu
    const userButton = userButtonRef.current?.querySelector('button');
    if (userButton) {
      userButton.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        damping: 15,
        stiffness: 300,
        delay: 0.3,
      }}
      className="flex items-center gap-2 sm:gap-3"
    >
      <motion.div
        ref={userButtonRef}
        className="flex-shrink-0"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          damping: 15,
          stiffness: 400,
        }}
      >
        <UserButton />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: 0.4,
          type: "spring",
          damping: 15,
          stiffness: 300,
        }}
        whileHover={{
          scale: 1.05,
          color: "#ffffff",
          x: 2,
        }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNameClick}
        className="hidden sm:inline text-xs sm:text-sm font-medium text-[#e4e6eb] max-w-[80px] md:max-w-[120px] lg:max-w-[150px] truncate cursor-pointer transition-colors"
      >
        {displayName}
      </motion.span>
    </motion.div>
  );
}

