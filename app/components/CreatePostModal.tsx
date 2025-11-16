"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle, Hash } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { isAdminEmail } from "@/app/lib/admin";
import { getAnonUserId, getAnonUsername } from "@/app/lib/anon-auth";
import { checkProfanity } from "@/app/lib/profanity-check";
import toast from "react-hot-toast";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tagErrors, setTagErrors] = useState<string[]>([]);
  const [contentProfanityError, setContentProfanityError] = useState(false);
  const [tagProfanityErrors, setTagProfanityErrors] = useState<string[]>([]);
  const [isCheckingProfanity, setIsCheckingProfanity] = useState(false);
  const { user } = useUser();
  const anonUserId = getAnonUserId();
  const anonUsername = getAnonUsername();

  // Close modal if user is not authenticated
  useEffect(() => {
    if (isOpen && !user && !anonUserId) {
      toast.error("Please sign in to post a confession");
      onClose();
    }
  }, [isOpen, user, anonUserId, onClose]);

  const minWords = 10;
  const maxWords = 50;
  const isAdmin = !!(user?.primaryEmailAddress?.emailAddress && isAdminEmail(user.primaryEmailAddress.emailAddress));
  
  // Count words in content
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const isValidWordCount = isAdmin ? wordCount >= 1 : (wordCount >= minWords && wordCount <= maxWords);
  
  // Check for profanity in content (debounced)
  useEffect(() => {
    if (!content.trim() || (!isAdmin && wordCount < minWords)) {
      setContentProfanityError(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingProfanity(true);
      try {
        const isClean = await checkProfanity(content.trim());
        setContentProfanityError(!isClean);
      } catch (error) {
        console.error("Error checking profanity:", error);
        setContentProfanityError(false);
      } finally {
        setIsCheckingProfanity(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [content, wordCount, minWords, isAdmin]);

  // Check for profanity in tags (debounced)
  useEffect(() => {
    if (!tags.trim()) {
      setTagProfanityErrors([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const tagArray = tags
        .split(",")
        .map(tag => tag.trim().replace(/^#+/, "").toLowerCase())
        .filter(tag => tag.length > 0);

      const profanityErrors: string[] = [];
      
      for (const tag of tagArray) {
        try {
          const isClean = await checkProfanity(tag);
          if (!isClean) {
            profanityErrors.push(tag);
          }
        } catch (error) {
          console.error("Error checking tag profanity:", error);
        }
      }
      
      setTagProfanityErrors(profanityErrors);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [tags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please enter a confession");
      return;
    }

    if (!isAdmin && wordCount < minWords) {
      toast.error(`Confession must be at least ${minWords} words`);
      return;
    }

    if (!isAdmin && wordCount > maxWords) {
      toast.error(`Confession must be ${maxWords} words or less`);
      return;
    }

    if (!user && !anonUserId) {
      toast.error("Please sign in to post");
      return;
    }

    // Check for profanity in content
    setIsLoading(true);
    try {
      const isClean = await checkProfanity(content.trim());
      if (!isClean) {
        toast.error("Your confession contains inappropriate content. Please revise it.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error checking profanity:", error);
      // Continue if profanity check fails (don't block user)
    }

    // Parse and validate tags
    const tagsArray = tags
      .split(",")
      .map(tag => tag.trim().replace(/^#+/, "").toLowerCase())
      .filter(tag => tag.length > 0);

    // Validate tag length (max 8 characters per tag)
    const invalidTags: string[] = [];
    for (const tag of tagsArray) {
      if (tag.length > 8) {
        invalidTags.push(tag);
      }
    }

    if (invalidTags.length > 0) {
      toast.error(`Tags must be 8 characters or less: ${invalidTags.join(", ")}`);
      setIsLoading(false);
      return;
    }

    // Check tags for profanity
    try {
      for (const tag of tagsArray) {
        const isClean = await checkProfanity(tag);
        if (!isClean) {
          toast.error(`Tag "${tag}" contains inappropriate content. Please revise it.`);
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking tag profanity:", error);
      // Continue if profanity check fails
    }

    try {
      // Get Clerk username if available
      let clerkUsername = "";
      if (user) {
        clerkUsername = user.username || 
                       user.firstName || 
                       user.primaryEmailAddress?.emailAddress?.split("@")[0] || 
                       "User";
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          tags: tagsArray,
          anonUserId: anonUserId || null,
          anonUsername: anonUsername || null,
          clerkUsername: clerkUsername || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      toast.success("Confession posted!");
      setContent("");
      setTags("");
      onPostCreated();
      // Dispatch event to refresh trending tags
      window.dispatchEvent(new CustomEvent("postCreated"));
      onClose();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsLoading(false);
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
              className="bg-[#2d2f36] rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto border border-[#3d3f47] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3d3f47]">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[#e4e6eb]">Share Your Confession</h2>
                  {isAdmin && (
                    <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      You’re admin — limits disabled
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[#3d3f47] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#b9bbbe]" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                      Your Confession
                    </label>
                    <div className="relative">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className={`w-full px-4 py-3 bg-[#1a1b23] border rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                          contentProfanityError
                            ? "border-red-500 focus:ring-red-500"
                            : wordCount > 0 && !isValidWordCount
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#3d3f47] focus:ring-[#5865f2]"
                        }`}
                        placeholder="Share your thoughts..."
                        disabled={isLoading}
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        {wordCount > 0 && !isValidWordCount && !isAdmin && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-red-400"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </motion.div>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            !isAdmin && wordCount < minWords
                              ? "text-red-400"
                              : !isAdmin && wordCount > maxWords
                              ? "text-red-400"
                              : isValidWordCount
                              ? "text-green-400"
                              : "text-[#b9bbbe]"
                          }`}
                        >
                          {isAdmin ? `${wordCount} words` : `${wordCount}/${maxWords} words`}
                        </span>
                      </div>
                    </div>
                    {!isAdmin && (
                      <p className="mt-1 text-xs text-[#b9bbbe]">
                        Minimum {minWords} words, maximum {maxWords} words
                      </p>
                    )}
                    {!isAdmin && wordCount > 0 && wordCount < minWords && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-400"
                      >
                        Need {minWords - wordCount} more word{minWords - wordCount !== 1 ? "s" : ""}
                      </motion.div>
                    )}
                    {contentProfanityError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-400 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Your confession contains inappropriate content. Please revise it.
                      </motion.div>
                    )}
                    {isCheckingProfanity && (!isAdmin ? wordCount >= minWords : wordCount >= 1) && !contentProfanityError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 text-xs text-[#b9bbbe] flex items-center gap-1"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border-2 border-[#5865f2] border-t-transparent rounded-full"
                        />
                        Checking content...
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e4e6eb] mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tags (optional)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => {
                        let newValue = e.target.value;
                        const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                        
                        // Split by comma to get individual tags
                        const parts = newValue.split(",");
                        const lastIndex = parts.length - 1;
                        const lastPart = parts[lastIndex];
                        
                        // Check if cursor is in the last tag
                        const textBeforeCursor = newValue.substring(0, cursorPos);
                        const commasBeforeCursor = (textBeforeCursor.match(/,/g) || []).length;
                        const isInLastTag = commasBeforeCursor === lastIndex;
                        
                        if (isInLastTag) {
                          // Remove # and trim to get actual tag content
                          const cleanTag = lastPart.trim().replace(/^#+/, "");
                          
                          // If tag exceeds 8 characters, auto-add comma
                          if (cleanTag.length > 8) {
                            // Find where to split (after 8 characters of clean content)
                            let charCount = 0;
                            let splitIndex = 0;
                            
                            for (let i = 0; i < lastPart.length; i++) {
                              const char = lastPart[i];
                              if (char !== ' ' && char !== '#') {
                                charCount++;
                                if (charCount === 8) {
                                  splitIndex = i + 1;
                                  break;
                                }
                              }
                            }
                            
                            if (splitIndex > 0) {
                              const beforeComma = lastPart.substring(0, splitIndex);
                              const afterComma = lastPart.substring(splitIndex);
                              
                              if (parts.length > 1) {
                                newValue = parts.slice(0, -1).join(",") + "," + beforeComma + "," + afterComma;
                              } else {
                                newValue = beforeComma + "," + afterComma;
                              }
                              
                              // Set cursor position after the comma
                              setTimeout(() => {
                                const input = e.target as HTMLInputElement;
                                const newPos = newValue.indexOf(afterComma) + afterComma.length;
                                input.setSelectionRange(newPos, newPos);
                              }, 0);
                            }
                          }
                        }
                        
                        setTags(newValue);
                        
                        // Validate tags and show errors
                        const tagArray = newValue
                          .split(",")
                          .map(tag => tag.trim().replace(/^#+/, "").toLowerCase())
                          .filter(tag => tag.length > 0);
                        
                        const errors: string[] = [];
                        for (const tag of tagArray) {
                          if (tag.length > 8) {
                            errors.push(tag);
                          }
                        }
                        setTagErrors(errors);
                      }}
                      className={`w-full px-4 py-3 bg-[#1a1b23] border rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:border-transparent ${
                        tagProfanityErrors.length > 0 || tagErrors.length > 0
                          ? "border-red-500 focus:ring-red-500"
                          : "border-[#3d3f47] focus:ring-[#5865f2]"
                      }`}
                      placeholder="nature, love, life (comma-separated)"
                      disabled={isLoading}
                    />
                    <div className="mt-1">
                      <p className="text-xs text-[#b9bbbe]">
                        Separate tags with commas. Each tag max 8 characters. Example: nature, love, life
                      </p>
                      {tagErrors.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-red-400 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Tags too long (max 8 chars): {tagErrors.join(", ")}
                        </motion.div>
                      )}
                      {tagProfanityErrors.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-xs text-red-400 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Tags contain inappropriate content: {tagProfanityErrors.join(", ")}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !content.trim() || (!isAdmin && !isValidWordCount) || tagErrors.length > 0 || contentProfanityError || tagProfanityErrors.length > 0}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#3d3f47] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Post Confession</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

