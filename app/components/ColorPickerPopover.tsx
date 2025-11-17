"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexColorPicker } from "react-colorful";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  className?: string;
  size?: "default" | "small";
}

export function ColorPickerPopover({
  color,
  onChange,
  isOpen,
  onClose,
  onOpen,
  className = "",
  size = "default",
}: ColorPickerPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tempColor, setTempColor] = useState(color);
  const tempColorRef = useRef(color);
  const isChangingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update temp color when prop changes, but only if we're not actively changing it
  useEffect(() => {
    if (!isChangingRef.current && !isOpen) {
      setTempColor(color);
      tempColorRef.current = color;
    }
  }, [color, isOpen]);

  // Reset temp color when picker opens
  useEffect(() => {
    if (isOpen) {
      setTempColor(color);
      tempColorRef.current = color;
      isChangingRef.current = false;
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [isOpen, color]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTempColor(color); // Reset to original
        isChangingRef.current = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        onClose();
      }
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Get current tempColor value from ref (always latest)
        const currentTempColor = tempColorRef.current;
        // Apply the final color before closing (only if changed)
        if (currentTempColor !== color) {
          // Clear any pending debounce first
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          onChange(currentTempColor);
        }
        isChangingRef.current = false;
        onClose();
      }
    }
    
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isOpen, onClose, color, onChange]); // Removed tempColor from deps, using closure instead

  // Debounced onChange handler
  const handleChange = useCallback((newColor: string) => {
    isChangingRef.current = true;
    setTempColor(newColor);
    tempColorRef.current = newColor;
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the onChange call
    debounceTimerRef.current = setTimeout(() => {
      onChange(newColor);
      isChangingRef.current = false;
    }, 100);
  }, [onChange]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Color Swatch Button */}
      <button
        type="button"
        onClick={onOpen}
        className={`${size === "small" ? "w-10 h-10" : "w-12 h-12"} rounded-lg border-2 border-[#3d3f47] cursor-pointer flex-shrink-0 hover:border-[#5865f2] transition-colors`}
        style={{ backgroundColor: color }}
        aria-label="Open color picker"
      />

      {/* Color Picker Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute z-[120] top-full mt-2 left-0 rounded-xl border border-[#2d2f36] bg-[#1a1b23] shadow-2xl p-4"
            style={{ minWidth: "200px" }}
          >
            <HexColorPicker
              color={tempColor}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={tempColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    isChangingRef.current = true;
                    setTempColor(value);
                    tempColorRef.current = value;
                    if (value.length === 7) {
                      // Clear existing timer
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                      }
                      // Update immediately for complete hex codes
                      onChange(value);
                      isChangingRef.current = false;
                    }
                  }
                }}
                className="flex-1 px-3 py-2 bg-[#1a1b23] border border-[#3d3f47] rounded-lg text-[#e4e6eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                placeholder="#FF5733"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

