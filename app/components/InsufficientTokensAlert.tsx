"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface InsufficientTokensAlertProps {
  isOpen: boolean;
  onClose: () => void;
  tokensNeeded: number;
  currentBalance: number;
  required: number;
}

export function InsufficientTokensAlert({
  isOpen,
  onClose,
  tokensNeeded,
  currentBalance,
  required,
}: InsufficientTokensAlertProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const alert = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
          />

          {/* Alert Modal */}
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
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
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Insufficient Tokens
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
                <div className="mb-4">
                  <p className="text-[#e4e6eb] mb-2">
                    You need <span className="text-yellow-500 font-bold">{tokensNeeded} more tokens</span> to change your username.
                  </p>
                  <div className="bg-[#1a1b23] rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#b9bbbe]">Current Balance:</span>
                      <span className="text-[#e4e6eb] font-medium">{currentBalance} tokens</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b9bbbe]">Required:</span>
                      <span className="text-yellow-500 font-medium">{required} tokens</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#3d3f47]">
                      <span className="text-[#b9bbbe]">You need:</span>
                      <span className="text-red-400 font-bold">{tokensNeeded} more tokens</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#b9bbbe] text-center">
                  Earn more tokens by claiming your daily reward!
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(alert, document.body);
}

