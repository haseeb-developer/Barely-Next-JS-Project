"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Layers } from "lucide-react";

interface PurchasedColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasedSolidColors: string[];
  purchasedGradientColors: string[][];
  onSelectSolidColor: (color: string) => void;
  onSelectGradient: (gradient: string[]) => void;
  onApplySolidColor?: (color: string) => void;
  onApplyGradient?: (gradient: string[]) => void;
  type: "solid" | "gradient";
}

export function PurchasedColorsModal({
  isOpen,
  onClose,
  purchasedSolidColors,
  purchasedGradientColors,
  onSelectSolidColor,
  onSelectGradient,
  onApplySolidColor,
  onApplyGradient,
  type,
}: PurchasedColorsModalProps) {
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
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getGradientStyle = (colors: string[]) => {
    if (colors.length === 2) {
      return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
    } else {
      return `linear-gradient(90deg, ${colors.join(", ")})`;
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a1b23] rounded-2xl border border-[#3d3f47] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3d3f47]">
                <div className="flex items-center gap-3">
                  {type === "solid" ? (
                    <Palette className="w-5 h-5 text-[#5865f2]" />
                  ) : (
                    <Layers className="w-5 h-5 text-[#5865f2]" />
                  )}
                  <h2 className="text-xl font-semibold text-[#e4e6eb]">
                    Purchased {type === "solid" ? "Colors" : "Gradients"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#2d2f36] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#b9bbbe]" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {type === "solid" ? (
                  <>
                    {purchasedSolidColors.length === 0 ? (
                      <div className="text-center py-12">
                        <Palette className="w-12 h-12 text-[#5865f2]/50 mx-auto mb-4" />
                        <p className="text-[#b9bbbe]">No purchased colors yet</p>
                        <p className="text-sm text-[#9aa0a6] mt-2">
                          Purchase colors to see them here
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {purchasedSolidColors.map((color, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-[#2d2f36] rounded-lg border border-[#3d3f47]"
                          >
                            <div
                              className="w-full h-16 rounded-lg mb-3 border-2 border-[#3d3f47]"
                              style={{ backgroundColor: color }}
                            />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (onApplySolidColor) {
                                  onApplySolidColor(color);
                                } else {
                                  onSelectSolidColor(color);
                                }
                                onClose();
                              }}
                              className="w-full px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              Apply
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {purchasedGradientColors.length === 0 ? (
                      <div className="text-center py-12">
                        <Layers className="w-12 h-12 text-[#5865f2]/50 mx-auto mb-4" />
                        <p className="text-[#b9bbbe]">No purchased gradients yet</p>
                        <p className="text-sm text-[#9aa0a6] mt-2">
                          Purchase gradients to see them here
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {purchasedGradientColors.map((gradient, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-[#2d2f36] rounded-lg border border-[#3d3f47]"
                          >
                            <div
                              className="w-full h-12 rounded-lg mb-2"
                              style={{
                                backgroundImage: getGradientStyle(gradient),
                              }}
                            />
                            <div className="flex flex-wrap gap-1 mb-3">
                              {gradient.map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="w-6 h-6 rounded border border-[#3d3f47]"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-[#b9bbbe] mb-3">
                              {gradient.length} color{gradient.length !== 1 ? "s" : ""}
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (onApplyGradient) {
                                  onApplyGradient(gradient);
                                } else {
                                  onSelectGradient(gradient);
                                }
                                onClose();
                              }}
                              className="w-full px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              Apply
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

