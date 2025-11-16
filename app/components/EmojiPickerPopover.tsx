"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  anchorClassName?: string;
}

const CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: "Smileys", emojis: ["😀","😁","😂","🤣","😃","😄","😅","😊","🙂","🙃","😉","😍","😘","😜","🤪","🤗","🤔","🤨","😐","😴","🤤","🥳","🥲","😭","💀"] },
  { name: "Gestures", emojis: ["👍","👎","👏","🙏","🤝","🫶","💪","✌️","👌","👋","🤙","🤌","🫰","👏","🤞"] },
  { name: "Love", emojis: ["❤️","🧡","💛","💚","💙","💜","🤍","🖤","🤎","💔","❣️","💕","💞","💖","💗","💓","💘","💝"] },
  { name: "Symbols", emojis: ["🔥","💯","✨","🌟","⭐","⚡","🎉","🎊","💥","🧠","🫡","🫠","🤯","😮","😱","😡","😇","😎","💀"] },
];

export function EmojiPickerPopover({ isOpen, onClose, onSelect }: EmojiPickerPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClick);
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute z-[120] top-full mt-2 w-72 rounded-xl border border-[#2d2f36] bg-[#1a1b23] shadow-2xl"
          ref={ref}
        >
          <div className="max-h-72 overflow-y-auto p-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="mb-3">
                <div className="text-xs uppercase tracking-wide text-[#9aa0a6] mb-1">{cat.name}</div>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((e, i) => (
                    <button
                      key={`${e}-${i}`}
                      onClick={() => onSelect(e)}
                      className="h-8 w-8 rounded-md bg-[#1f2330] hover:bg-[#2a2f3f] flex items-center justify-center text-lg"
                      aria-label={`emoji ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


