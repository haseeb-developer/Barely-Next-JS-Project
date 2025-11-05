"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { UserProfile } from "./UserProfile";
import { HeaderNav } from "./HeaderNav";
import { ConfessionModal } from "./ConfessionModal";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRef } from "react";

interface HeaderProps {
  pacificoClassName: string;
}

export function Header({ pacificoClassName }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const userButtonRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/trending", label: "Trending" },
    { href: "/discover", label: "Discover" },
  ];

  const isActive = (href: string) => pathname === href;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return "User";
    const name = user.username || 
                 user.firstName || 
                 user.primaryEmailAddress?.emailAddress?.split("@")[0] || 
                 "User";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const handleUserButtonClick = () => {
    const userButton = userButtonRef.current?.querySelector('button');
    if (userButton) {
      userButton.click();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#1a1b23]/90 backdrop-blur-2xl border-b border-[#2d2f36]/30">
        <nav className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[72px] lg:h-20 gap-2 sm:gap-4">
            {/* Logo on the left */}
            <Link
              href="/"
              className="flex items-center space-x-2 sm:space-x-3 group min-w-0 flex-shrink-0"
              onClick={closeMobileMenu}
            >
              <motion.span
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 300,
                  delay: 0.1,
                }}
                whileHover={{
                  scale: 1.05,
                  color: "#ffffff",
                  y: -2,
                  transition: {
                    type: "spring",
                    damping: 15,
                    stiffness: 400,
                  },
                }}
                whileTap={{
                  scale: 0.9,
                  rotate: [0, -5, 5, -5, 0],
                  transition: {
                    type: "keyframes",
                    duration: 0.4,
                    ease: "easeInOut",
                  },
                }}
                className={`${pacificoClassName} text-xl sm:text-2xl md:text-3xl font-bold text-[#e4e6eb] tracking-tight`}
              >
                Barely
              </motion.span>
            </Link>

            {/* Navigation Links in the center - Hidden on mobile, shown on tablet+ */}
            <div className="hidden sm:flex flex-1 justify-center items-center px-2 sm:px-4 md:px-8">
              <HeaderNav />
            </div>

            {/* Desktop Auth buttons on the right - Hidden on mobile */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.3,
                  },
                },
              }}
              className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto"
            >
              <SignedOut>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: 20, scale: 0.8 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        damping: 15,
                        stiffness: 300,
                      },
                    },
                  }}
                >
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        color: "#ffffff",
                        x: 2,
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-[#e4e6eb] font-medium hover:text-white transition-colors text-xs sm:text-sm whitespace-nowrap"
                    >
                      Login
                    </motion.button>
                  </SignInButton>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: 20, scale: 0.8 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        damping: 15,
                        stiffness: 300,
                      },
                    },
                  }}
                >
                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 8px 20px rgba(88, 101, 242, 0.3)",
                        backgroundColor: "#4752c4",
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
                    >
                      Sign Up
                    </motion.button>
                  </SignUpButton>
                </motion.div>
              </SignedOut>
              <SignedIn>
                <UserProfile />
              </SignedIn>
            </motion.div>

            {/* Hamburger menu button - Only visible on mobile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5 focus:outline-none"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? 45 : 0,
                  y: isMobileMenuOpen ? 8 : 0,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  stiffness: 400,
                }}
                className="w-6 h-0.5 bg-[#e4e6eb] rounded-full"
              />
              <motion.span
                animate={{
                  opacity: isMobileMenuOpen ? 0 : 1,
                  scale: isMobileMenuOpen ? 0 : 1,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  stiffness: 400,
                }}
                className="w-6 h-0.5 bg-[#e4e6eb] rounded-full"
              />
              <motion.span
                animate={{
                  rotate: isMobileMenuOpen ? -45 : 0,
                  y: isMobileMenuOpen ? -8 : 0,
                }}
                transition={{ 
                  type: "spring",
                  damping: 15,
                  stiffness: 400,
                }}
                className="w-6 h-0.5 bg-[#e4e6eb] rounded-full"
              />
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                boxShadow: "0 0 40px rgba(88, 101, 242, 0.15)",
              }}
              exit={{ 
                x: "100%", 
                opacity: 0,
                boxShadow: "0 0 0px rgba(88, 101, 242, 0)",
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                mass: 0.8,
              }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-full bg-[#1a1b23] border-l border-[#2d2f36]/30 z-50 sm:hidden flex flex-col shadow-2xl"
            >
              {/* Mobile Menu Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                }}
                className="flex items-center justify-between p-4 border-b border-[#2d2f36]/30 flex-shrink-0"
              >
                <motion.span
                  initial={{ scale: 0.5, opacity: 0, rotate: -180, y: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                  transition={{
                    delay: 0.15,
                    type: "spring",
                    damping: 12,
                    stiffness: 500,
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, -5, 0],
                    transition: {
                      type: "keyframes",
                      duration: 0.5,
                      ease: "easeInOut",
                    },
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`${pacificoClassName} text-2xl font-bold text-[#e4e6eb] cursor-pointer`}
                >
                  Barely
                </motion.span>
                <motion.button
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    damping: 15,
                    stiffness: 400,
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ 
                    scale: 0.75,
                    rotate: 180,
                    transition: {
                      type: "spring",
                      damping: 12,
                      stiffness: 500,
                    },
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Animate the button first, then close the menu
                    setTimeout(() => {
                      closeMobileMenu();
                    }, 250);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2f36] transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6 text-[#e4e6eb]"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </motion.div>

              {/* Mobile Menu Content - Scrollable */}
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: {
                    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
                  },
                  closed: {
                    transition: { staggerChildren: 0.05, staggerDirection: -1 },
                  },
                }}
                className="flex flex-col flex-1 overflow-y-auto"
              >
                <div className="flex flex-col p-4 gap-4">
                  {/* Navigation Links */}
                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <motion.div
                        key={link.href}
                        variants={{
                          open: {
                            x: 0,
                            opacity: 1,
                            transition: {
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            },
                          },
                          closed: {
                            x: 50,
                            opacity: 0,
                            transition: {
                              duration: 0.2,
                            },
                          },
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobileMenu}
                          className="relative block"
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
                              x: 4,
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-3 rounded-lg transition-all duration-200"
                          >
                            <span
                              className={`font-poppins text-base font-semibold relative z-10 ${
                                isActive(link.href)
                                  ? "text-[#5865f2]"
                                  : "text-[#b9bbbe]"
                              } transition-colors duration-200`}
                            >
                              {link.label}
                            </span>
                            {isActive(link.href) && (
                              <motion.div
                                layoutId="activeTabMobile"
                                className="absolute inset-0 bg-[#5865f2]/12 rounded-lg"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Confess Button */}
                  <motion.div
                    variants={{
                      open: {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                          delay: 0.1,
                        },
                      },
                      closed: {
                        scale: 0.8,
                        opacity: 0,
                        y: 20,
                        transition: {
                          duration: 0.2,
                        },
                      },
                    }}
                  >
                    <motion.button
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 10px 25px rgba(88, 101, 242, 0.3)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsConfessionModalOpen(true);
                        closeMobileMenu();
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-poppins font-semibold rounded-lg transition-all duration-300"
                    >
                      Confess
                    </motion.button>
                  </motion.div>

                  {/* Auth Buttons - Only show if signed out */}
                  <SignedOut>
                    <motion.div
                      variants={{
                        open: {
                          transition: { staggerChildren: 0.1 },
                        },
                        closed: {
                          transition: { staggerChildren: 0.05, staggerDirection: -1 },
                        },
                      }}
                      className="flex flex-col gap-3 pt-2"
                    >
                      <motion.div
                        variants={{
                          open: {
                            x: 0,
                            opacity: 1,
                            transition: {
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            },
                          },
                          closed: {
                            x: 30,
                            opacity: 0,
                            transition: {
                              duration: 0.2,
                            },
                          },
                        }}
                      >
                        <SignInButton mode="modal">
                          <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={closeMobileMenu}
                            className="w-full px-4 py-3 text-[#e4e6eb] font-medium hover:bg-[#2d2f36] rounded-lg transition-colors text-base"
                          >
                            Login
                          </motion.button>
                        </SignInButton>
                      </motion.div>
                      <motion.div
                        variants={{
                          open: {
                            x: 0,
                            opacity: 1,
                            transition: {
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            },
                          },
                          closed: {
                            x: 30,
                            opacity: 0,
                            transition: {
                              duration: 0.2,
                            },
                          },
                        }}
                      >
                        <SignUpButton mode="modal">
                          <motion.button
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: "0 8px 20px rgba(88, 101, 242, 0.25)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={closeMobileMenu}
                            className="w-full px-4 py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors text-base"
                          >
                            Sign Up
                          </motion.button>
                        </SignUpButton>
                      </motion.div>
                    </motion.div>
                  </SignedOut>
                </div>
              </motion.div>

              {/* User Profile Section at Bottom - Only show if signed in */}
              <SignedIn>
                {user && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    }}
                    className="border-t border-[#2d2f36]/30 pt-4 pb-4 px-4 flex-shrink-0"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(45, 47, 54, 0.6)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUserButtonClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2d2f36]/50 transition-colors cursor-pointer"
                    >
                      <div ref={userButtonRef} className="flex-shrink-0">
                        <UserButton />
                      </div>
                      <span className="text-sm font-medium text-[#e4e6eb] truncate flex-1">
                        {getUserDisplayName()}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </SignedIn>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confession Modal */}
      <ConfessionModal
        isOpen={isConfessionModalOpen}
        onClose={() => setIsConfessionModalOpen(false)}
      />
    </>
  );
}
