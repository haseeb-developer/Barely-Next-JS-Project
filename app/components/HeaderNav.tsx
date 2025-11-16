"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState } from "react";
import { SignUpPromptModal } from "./SignUpPromptModal";

export function HeaderNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const anonUserId = getAnonUserId();
  const router = useRouter();
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Always render links to avoid SSR/CSR mismatch; guard navigation in onClick
  const navLinks = [
    { href: "/trending", label: "Trending" },
    { href: "/discover", label: "Discover" },
    { href: "/my", label: "My Confessions" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2,
            },
          },
        }}
        className="hidden sm:flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-3"
      >
        {navLinks.map((link) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="self-center"
          >
            <Link
              href={link.href}
              className="relative group block"
              onClick={(e) => {
                if (link.href === "/my" && !user && !anonUserId) {
                  e.preventDefault();
                  setShowSignUpModal(true);
                }
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive(link.href)
                    ? "rgba(88, 101, 242, 0.12)"
                    : "transparent",
                }}
                whileHover={{
                  backgroundColor: "rgba(88, 101, 242, 0.08)",
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{ scale: 0.95 }}
                className="px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl transition-all duration-200 min-w-[120px] text-center"
              >
                <motion.span
                  className={`font-poppins text-xs sm:text-sm md:text-[15px] lg:text-base font-semibold relative z-10 whitespace-nowrap ${
                    isActive(link.href)
                      ? "text-[#5865f2]"
                      : "text-[#b9bbbe] group-hover:text-[#e4e6eb]"
                  } transition-colors duration-200`}
                  whileHover={{ scale: 1.05 }}
                >
                  {link.label}
                </motion.span>
                {isActive(link.href) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#5865f2]/12 rounded-lg md:rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          </motion.div>
        ))}

        {/* Settings removed as requested */}
        
        {/* Confess Button */}
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="self-center"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(88, 101, 242, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Check authentication before opening modal
              if (!user && !anonUserId) {
                setShowSignUpModal(true);
                return;
              }
              // Navigate to discover page if not already there, then open modal
              if (pathname !== "/discover") {
                router.push("/discover");
                // Wait a bit for navigation, then dispatch event
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("openCreatePostModal"));
                }, 100);
              } else {
                // Dispatch custom event to open modal in Discover page
                window.dispatchEvent(new CustomEvent("openCreatePostModal"));
              }
            }}
            className="ml-0.5 sm:ml-1 md:ml-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-poppins font-semibold rounded-lg md:rounded-xl transition-all duration-300 overflow-hidden relative z-20 group cursor-pointer min-w-[110px]"
          >
            <span className="relative z-10 text-xs sm:text-sm md:text-[15px] lg:text-base whitespace-nowrap">
              Confess
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </motion.button>
        </motion.div>
      </motion.nav>

      {/* Mobile menu button - shown on small screens */}
      <div className="sm:hidden flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Check authentication before opening modal
            if (!user && !anonUserId) {
              setShowSignUpModal(true);
              return;
            }
            // Navigate to discover page if not already there, then open modal
            if (pathname !== "/discover") {
              router.push("/discover");
              // Wait a bit for navigation, then dispatch event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("openCreatePostModal"));
              }, 100);
            } else {
              // Dispatch custom event to open modal in Discover page
              window.dispatchEvent(new CustomEvent("openCreatePostModal"));
            }
          }}
          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-lg transition-colors text-xs whitespace-nowrap cursor-pointer"
        >
          Confess
        </motion.button>
      </div>

      {/* Sign Up Prompt Modal */}
      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
      />
    </>
  );
}

