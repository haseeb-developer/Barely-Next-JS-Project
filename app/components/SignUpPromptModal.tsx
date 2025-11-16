"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { SignUpButton, SignInButton } from "@clerk/nextjs";

interface SignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignUpPromptModal({ isOpen, onClose }: SignUpPromptModalProps) {
  const router = useRouter();

  const handleAnonSignUp = () => {
    onClose();
    router.push("/anon-account");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#2d2f36] rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto border border-[#3d3f47]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3d3f47]">
                <h2 className="text-xl font-semibold text-[#e4e6eb] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#5865f2]" />
                  Create Account to Post
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[#3d3f47] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#b9bbbe]" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[#e4e6eb] mb-6 text-center">
                  You need to create an account to post confessions. Choose your preferred signup method:
                </p>

                {/* Signup Options */}
                <div className="space-y-3">
                  {/* Clerk Sign Up */}
                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <User className="w-5 h-5" />
                      <span className="flex-1 text-left">Sign Up with Clerk</span>
                      <span className="text-sm opacity-80">→</span>
                    </motion.button>
                  </SignUpButton>

                  {/* Anonymous Sign Up */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnonSignUp}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1b23] hover:bg-[#3d3f47] border border-[#3d3f47] text-[#e4e6eb] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <User className="w-5 h-5 text-[#5865f2]" />
                    <span className="flex-1 text-left">Anonymous Sign Up</span>
                    <span className="text-sm opacity-80">→</span>
                  </motion.button>
                </div>

                {/* Info */}
                <p className="mt-6 text-xs text-[#b9bbbe] text-center">
                  Already have an account?{" "}
                  <SignInButton mode="modal">
                    <button
                      onClick={onClose}
                      className="text-[#5865f2] hover:text-[#4752c4] underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

