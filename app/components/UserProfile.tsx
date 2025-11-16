"use client";

import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRef } from "react";
import { motion } from "framer-motion";
import { isAdminEmail } from "@/app/lib/admin";

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

  const email = user.primaryEmailAddress?.emailAddress || null;
  const isAdmin = isAdminEmail(email);

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
        className="hidden sm:inline text-xs sm:text-sm font-medium text-[#e4e6eb] max-w-[80px] md:max-w-[120px] lg:max-w-[150px] truncate cursor-pointer transition-colors flex items-center gap-1"
      >
        {displayName}
        {isAdmin && (
          <span className="relative inline-flex group">
            <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" className="w-4 h-4 text-blue-400 cursor-pointer" data-testid="icon-verified">
              <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="currentColor"></path></g>
            </svg>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 hidden group-hover:block bg-[#111318] text-white text-xs px-2 py-1 rounded-md border border-[#3d3f47] whitespace-nowrap shadow-lg">
              Verified Developer | Creator
            </span>
          </span>
        )}
      </motion.span>
    </motion.div>
  );
}

