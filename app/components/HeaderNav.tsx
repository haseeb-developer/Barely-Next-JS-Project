"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ConfessionModal } from "./ConfessionModal";

export function HeaderNav() {
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/trending", label: "Trending" },
    { href: "/discover", label: "Discover" },
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
            variants={{
              hidden: { opacity: 0, y: -20, scale: 0.8 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  damping: 15,
                  stiffness: 300,
                },
              },
            }}
          >
            <Link
              href={link.href}
              className="relative group block"
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
                className="px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg md:rounded-xl transition-all duration-200"
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
        
        {/* Confess Button */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -20, scale: 0.8 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                damping: 15,
                stiffness: 300,
                delay: 0.2,
              },
            },
          }}
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(88, 101, 242, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsConfessionModalOpen(true)}
            className="ml-0.5 sm:ml-1 md:ml-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-1.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-poppins font-semibold rounded-lg md:rounded-xl transition-all duration-300 overflow-hidden relative group"
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
          onClick={() => setIsConfessionModalOpen(true)}
          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-lg transition-colors text-xs whitespace-nowrap"
        >
          Confess
        </motion.button>
      </div>

      {/* Confession Modal */}
      <ConfessionModal
        isOpen={isConfessionModalOpen}
        onClose={() => setIsConfessionModalOpen(false)}
      />
    </>
  );
}

