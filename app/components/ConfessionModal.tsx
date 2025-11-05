"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as RadixDialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const confessionSchema = z.object({
  confession: z
    .string()
    .min(10, "Confession must be at least 10 characters")
    .max(1000, "Confession must be less than 1000 characters"),
  tags: z.string().optional(),
  anonymous: z.boolean(),
});

type ConfessionFormData = z.infer<typeof confessionSchema>;

interface ConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfessionModal({ isOpen, onClose }: ConfessionModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ConfessionFormData>({
    resolver: zodResolver(confessionSchema),
    defaultValues: {
      confession: "",
      tags: "",
      anonymous: false,
    },
  });

  const onSubmit = async (data: ConfessionFormData) => {
    try {
      // Here you would typically send data to your API
      console.log("Confession data:", data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Confession posted successfully! 🔥");
      reset();
      onClose();
    } catch (error) {
      toast.error("Failed to post confession. Please try again.");
    }
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <RadixDialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <RadixDialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
              </RadixDialog.Overlay>
              <RadixDialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#232428] rounded-2xl shadow-2xl max-w-lg w-full mx-4 z-50 border border-[#2d2f36]"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <RadixDialog.Title className="text-2xl font-bold text-[#e4e6eb]">
                        Confess something...
                      </RadixDialog.Title>
                      <RadixDialog.Close asChild>
                        <button className="text-[#9ca3af] hover:text-[#e4e6eb] transition-colors p-2 hover:bg-[#2a2d35] rounded-lg">
                          <IoClose className="w-6 h-6" />
                        </button>
                      </RadixDialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      {/* Confession Textarea */}
                      <div>
                        <textarea
                          {...register("confession")}
                          placeholder="What's on your mind?"
                          rows={8}
                          className="w-full px-4 py-3 border border-[#2d2f36] rounded-lg bg-[#1a1b23] text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent resize-none transition-all"
                        />
                        {errors.confession && (
                          <p className="mt-1 text-sm text-red-400">
                            {errors.confession.message}
                          </p>
                        )}
                      </div>

                      {/* Tags Input */}
                      <div>
                        <input
                          {...register("tags")}
                          type="text"
                          placeholder="#tags (optional)"
                          className="w-full px-4 py-3 border border-[#2d2f36] rounded-lg bg-[#1a1b23] text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Anonymous Checkbox */}
                      <div className="flex items-center">
                        <input
                          {...register("anonymous")}
                          type="checkbox"
                          id="anonymous"
                          className="w-4 h-4 text-[#5865f2] bg-[#1a1b23] border-[#2d2f36] rounded focus:ring-[#5865f2] focus:ring-2"
                        />
                        <label
                          htmlFor="anonymous"
                          className="ml-2 text-sm text-[#b9bbbe]"
                        >
                          Post anonymously
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#2d2f36]">
                        <RadixDialog.Close asChild>
                          <button
                            type="button"
                            className="px-4 py-2 text-[#e4e6eb] hover:bg-[#2a2d35] rounded-lg transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </RadixDialog.Close>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                          <span>🔥</span>
                          <span>{isSubmitting ? "Posting..." : "Confess"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </RadixDialog.Content>
            </>
          )}
        </AnimatePresence>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

