"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#2d2f36]/30 bg-[#1a1b23]/50 backdrop-blur-sm mt-auto">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-[#b9bbbe]"
          >
            © {new Date().getFullYear()} Barely. All rights reserved.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 text-sm"
          >
            <Link
              href="/terms"
              className="text-[#b9bbbe] hover:text-[#5865f2] transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-[#2d2f36]">•</span>
            <Link
              href="/privacy"
              className="text-[#b9bbbe] hover:text-[#5865f2] transition-colors"
            >
              Privacy & Violation Policy
            </Link>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

