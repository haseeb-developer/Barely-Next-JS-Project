"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { UserProfile } from "./UserProfile";
import { HeaderNav } from "./HeaderNav";
import { AccountDropdown } from "./AccountDropdown";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRef } from "react";
import { getAnonUserId, getAnonUserEmail, getAnonUsername, clearAnonUser, isAnonUser } from "@/app/lib/anon-auth";
import { SignUpPromptModal } from "./SignUpPromptModal";
import Image from "next/image";
import { User } from "lucide-react";

interface HeaderProps {
  pacificoClassName: string;
}

export function Header({ pacificoClassName }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anonUserId, setAnonUserId] = useState<string | null>(null);
  const [anonUserEmail, setAnonUserEmail] = useState<string | null>(null);
  const [anonUsername, setAnonUsername] = useState<string | null>(null);
  const [anonProfilePicture, setAnonProfilePicture] = useState<string | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const userButtonRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<number>(0);

  useEffect(() => {
    // Auto-close mobile menu on route changes
    setIsMobileMenuOpen(false);
    // Check for anon user on mount and when pathname changes
    const userId = getAnonUserId();
    const email = getAnonUserEmail();
    const username = getAnonUsername();
    setAnonUserId(userId);
    setAnonUserEmail(email);
    setAnonUsername(username);

    // Fetch profile picture for anonymous user
    if (userId) {
      fetch(`/api/users/profile-picture?anonUserId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.profilePicture) {
            setAnonProfilePicture(data.profilePicture);
          }
        })
        .catch(console.error);
    } else {
      setAnonProfilePicture(null);
    }
  }, [pathname]);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      if (anonUserId) {
        fetch(`/api/users/profile-picture?anonUserId=${anonUserId}`)
          .then(res => res.json())
          .then(data => {
            if (data.profilePicture) {
              setAnonProfilePicture(data.profilePicture);
            } else {
              setAnonProfilePicture(null);
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    return () => {
      window.removeEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    };
  }, [anonUserId]);

  // Award daily tokens and fetch balance
  useEffect(() => {
    const awardAndFetch = async () => {
      try {
        const anonId = getAnonUserId();
        await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonUserId: anonId || null }),
        });
        const res = await fetch(`/api/tokens${anonId ? `?anonUserId=${anonId}` : ""}`);
        const data = await res.json();
        if (res.ok) setTokens(data.balance || 0);
      } catch {}
    };
    awardAndFetch();
  }, [pathname]);

  const handleAnonLogout = () => {
    clearAnonUser();
    setAnonUserId(null);
    setAnonUserEmail(null);
    setAnonUsername(null);
  };

  const navLinks = [
    { href: "/trending", label: "Trending" },
    { href: "/discover", label: "Discover" },
  ];

  const isActive = (href: string) => pathname === href;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const adminEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
  const isAdmin = adminEmail ? adminEmail.toLowerCase() === "haseeb.devv@gmail.com" : false;

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

  const [showTokensDropdown, setShowTokensDropdown] = useState(false);
  const formatCompact = (n: number) => {
    if (n < 1000) return `${n}`;
    if (n < 10000) return `${(n / 1000).toFixed(2)}k`.replace(/\.0+$/, "");
    if (n < 100000) return `${(n / 1000).toFixed(2)}k`.replace(/\.0+$/, "");
    if (n < 1000000) return `${(n / 1000).toFixed(1)}k`.replace(/\.0+$/, "");
    return `${(n / 1000000).toFixed(2)}M`.replace(/\.0+$/, "");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#1a1b23]/90 backdrop-blur-2xl border-b border-[#2d2f36]/30">
        <nav className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[72px] lg:h-20 gap-2 sm:gap-4">
            {/* Logo on the left */}
            <Link
              href="/home"
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
            <div className="hidden sm:flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-auto">
              {/* Admin Panel link */}
              {isAdmin && (
                <a
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-[#1a1b23] border border-[#2d2f36] text-[#e4e6eb] hover:bg-[#2d2f36] cursor-pointer"
                >
                  Admin Panel
                </a>
              )}
              {/* Tokens pill */}
              <div className="relative">
                <button
                  onClick={() => setShowTokensDropdown((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#2d2f36] border border-[#3d3f47] cursor-pointer"
                  title="Tokens"
                >
                  <Image src="/token.svg" alt="Tokens" width={18} height={18} />
                  <span className="text-sm font-semibold text-[#facc15]">{formatCompact(tokens)}</span>
                </button>
                {showTokensDropdown && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg bg-[#1f2330] border border-[#2d2f36] p-2 text-center z-50">
                    <div className="text-xs text-[#9aa0a6]">Exact balance</div>
                    <div className="text-lg font-semibold text-[#facc15]">{tokens.toLocaleString()}</div>
                  </div>
                )}
              </div>
              <SignedOut>
                {!anonUserId ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                      delay: 0.3,
                    }}
                  >
                    <AccountDropdown />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                    }}
                    className="flex items-center gap-3"
                  >
                    {/* Profile Picture */}
                    {anonProfilePicture ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#5865f2] bg-[#1a1b23] flex-shrink-0">
                        <Image
                          src={anonProfilePicture}
                          alt={anonUsername || "Anonymous"}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm text-[#b9bbbe]">
                      {anonUsername || anonUserEmail || "Anonymous User"}
                    </span>
                    <AccountDropdown
                      isAnonUser={true}
                      anonUserId={anonUserId}
                      onAnonLogout={handleAnonLogout}
                    />
                  </motion.div>
                )}
              </SignedOut>
              <SignedIn>
                <UserProfile />
              </SignedIn>
            </div>

            {/* Hamburger menu button - Only visible on mobile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="sm:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5 focus:outline-none cursor-pointer"
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
                <Link href="/home" onClick={closeMobileMenu}>
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
                </Link>
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2d2f36] transition-colors cursor-pointer"
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
                  {/* Tokens pill (mobile) */}
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
                        transition: { duration: 0.2 },
                      },
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#2d2f36] border border-[#3d3f47] w-max"
                  >
                    <Image src="/token.svg" alt="Tokens" width={18} height={18} />
                    <span className="text-sm font-semibold text-[#facc15]">{tokens}</span>
                  </motion.div>

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
                      // Check authentication before opening modal
                      const anonUserId = getAnonUserId();
                      if (!user && !anonUserId) {
                        closeMobileMenu();
                        setShowSignUpModal(true);
                        return;
                      }
                      closeMobileMenu();
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-poppins font-semibold rounded-lg transition-all duration-300 cursor-pointer"
                  >
                    Confess
                  </motion.button>
                  </motion.div>

                  {/* Auth Buttons - Only show if signed out */}
                  <SignedOut>
                    {!anonUserId ? (
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
                        className="pt-2"
                      >
                        <div className="w-full">
                          <AccountDropdown />
                        </div>
                      </motion.div>
                    ) : (
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
                        className="pt-2 space-y-3"
                      >
                        <div className="px-4 py-2 flex items-center gap-3">
                          {/* Profile Picture */}
                          {anonProfilePicture ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#5865f2] bg-[#1a1b23] flex-shrink-0">
                              <Image
                                src={anonProfilePicture}
                                alt={anonUsername || "Anonymous"}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="text-sm text-[#b9bbbe]">
                            {anonUsername || anonUserEmail || "Anonymous User"}
                          </span>
                        </div>
                        <div className="w-full">
                          <AccountDropdown
                            isAnonUser={true}
                            anonUserId={anonUserId}
                            onAnonLogout={handleAnonLogout}
                          />
                    </div>
                      </motion.div>
                    )}
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

      {/* Sign Up Prompt Modal */}
      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
      />
    </>
  );
}
