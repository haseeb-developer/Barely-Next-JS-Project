"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmojiPickerPopover } from "./EmojiPickerPopover";

interface ReactionsBarProps {
  totals: Record<string, number>;
  userReactions: string[];
  onToggle: (emoji: string) => Promise<void> | void;
  small?: boolean;
  showAdd?: boolean; // default false
}

export function ReactionsBar({ totals, userReactions, onToggle, small, showAdd = false }: ReactionsBarProps) {
  const [open, setOpen] = useState(false);
  // Maintain a stable order for emojis: first seen stays first; newly-added append at the end.
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    const keys = Object.keys(totals);
    setOrder((prev) => {
      const next = prev.filter((k) => keys.includes(k));
      for (const k of keys) {
        if (!next.includes(k)) next.push(k);
      }
      return next;
    });
  }, [totals]);

  const emojis = order
    .map((k) => [k, totals[k] as number] as [string, number])
    .filter(([, c]) => c && c > 0)
    .slice(0, 24); // allow more but still bounded

  const size = small ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <div className={`mt-2 flex flex-wrap items-center gap-2 ${small ? "" : "pt-1"}`}>
      {emojis.map(([emoji, count]) => {
        const active = userReactions.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`inline-flex items-center gap-1 rounded-full border ${size} cursor-pointer ${
              active
                ? "bg-[#2a2f3f] border-[#5865f2] text-[#e4e6eb]"
                : "bg-[#1a1b23] border-[#2d2f36] text-[#b9bbbe] hover:bg-[#2d2f36]"
            }`}
            aria-label={`reaction ${emoji}`}
          >
            <span className="text-base">{emoji}</span>
            <span className={small ? "text-[10px]" : "text-xs"}>{count}</span>
          </button>
        );
      })}

      {showAdd && (
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`rounded-full border ${size} bg-[#1a1b23] border-[#2d2f36] text-[#b9bbbe] hover:bg-[#2d2f36] cursor-pointer`}
            aria-label="add reaction"
          >
            +
          </button>
          <EmojiPickerPopover
            isOpen={open}
            onClose={() => setOpen(false)}
            onSelect={(e) => {
              setOpen(false);
              onToggle(e);
            }}
          />
        </div>
      )}
    </div>
  );
}


