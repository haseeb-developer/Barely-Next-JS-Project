"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId, getAnonUsername } from "@/app/lib/anon-auth";
import { ArrowLeft, User, Upload, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function SettingsPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [anonUserId, setAnonUserId] = useState<string | null>(null);
  const [anonUsername, setAnonUsername] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [originalProfilePicture, setOriginalProfilePicture] = useState<string | null>(null);
  const [previewPicture, setPreviewPicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize client-side only values after hydration
  useEffect(() => {
    setIsClient(true);
    const userId = getAnonUserId();
    const username = getAnonUsername();
    setAnonUserId(userId);
    setAnonUsername(username);
  }, []);

  // Redirect if not logged in (neither Clerk nor anon)
  useEffect(() => {
    if (!isClient) return;
    if (!clerkUser && !anonUserId) {
      toast.error("Please sign in to access settings");
      router.push("/anon-account");
    }
  }, [clerkUser, anonUserId, router, isClient]);

  // Fetch current profile picture (Anon) and prep Clerk info
  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!anonUserId || clerkUser) return;

      try {
        const response = await fetch(
          `/api/users/profile-picture?anonUserId=${anonUserId}`
        );
        const data = await response.json();

        if (response.ok) {
          setProfilePicture(data.profilePicture);
          setOriginalProfilePicture(data.profilePicture);
          setPreviewPicture(null);
          setHasChanges(false);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, [anonUserId, clerkUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setIsUploading(true);

    // Resize/compress image before preview to keep DB payload small
    const resizeImage = async (file: File, maxSize = 256): Promise<string> => {
      const imageBitmap = await createImageBitmap(file);
      const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height, 1);
      const targetWidth = Math.max(1, Math.floor(imageBitmap.width * ratio));
      const targetHeight = Math.max(1, Math.floor(imageBitmap.height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      // Compress to jpeg to reduce size
      // Try a couple of qualities if needed
      let quality = 0.8;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      // Keep it under ~300KB
      const maxBytes = 300 * 1024;
      while (dataUrl.length > maxBytes && quality > 0.4) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      return dataUrl;
    };

    (async () => {
      try {
        const compressedBase64 = await resizeImage(file, 256);
        setPreviewPicture(compressedBase64);
        setHasChanges(true);
      } catch (error: any) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
      } finally {
        setIsUploading(false);
      }
    })();
  };

  const handleSaveChanges = async () => {
    if (!anonUserId || !previewPicture) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/profile-picture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          profilePicture: previewPicture,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update profile picture";
        try {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
            console.error("API Error Response:", data);
          } else {
            console.error("API Error: Empty response body, status:", response.status);
            errorMessage = `Server error (${response.status}). Please check if the database column exists.`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server error (${response.status}). Please check server logs.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setProfilePicture(previewPicture);
      setOriginalProfilePicture(previewPicture);
      setPreviewPicture(null);
      setHasChanges(false);
      toast.success("Profile picture updated!");
      
      // Dispatch event to refresh profile pictures across the app
      window.dispatchEvent(new CustomEvent("profilePictureUpdated"));
    } catch (error: any) {
      console.error("Error saving profile picture:", error);
      toast.error(error.message || "Failed to save profile picture");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreviewPicture(null);
    setHasChanges(false);
    // Reset to original picture
    setProfilePicture(originalProfilePicture);
  };

  const handleRemovePicture = async () => {
    if (!anonUserId) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/profile-picture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          profilePicture: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove profile picture");
      }

      setProfilePicture(null);
      toast.success("Profile picture removed");
      
      // Dispatch event to refresh profile pictures
      window.dispatchEvent(new CustomEvent("profilePictureUpdated"));
    } catch (error: any) {
      console.error("Error removing profile picture:", error);
      toast.error(error.message || "Failed to remove profile picture");
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#1a1b23] flex items-center justify-center">
        <div className="text-[#e4e6eb]">Loading...</div>
      </div>
    );
  }

  // Don't render if not logged in at all
  if (!clerkUser && !anonUserId) return null;

  return (
    <div className="min-h-screen bg-[#1a1b23] py-8">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-[#b9bbbe] hover:text-[#e4e6eb] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e4e6eb] mb-2 flex items-center gap-2">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#5865f2]" />
            Settings {clerkUser ? "(Clerk)" : "(Anonymous)"}
          </h1>
          <p className="text-[#b9bbbe]">
            {clerkUser
              ? "Manage your Clerk account settings applied to posts"
              : "Manage your anonymous account settings"}
          </p>
        </motion.div>

        {/* Clerk Settings */}
        {clerkUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 shadow-2xl mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-[#e4e6eb] mb-4">
              Profile Picture
            </h2>
            <p className="text-[#b9bbbe] mb-4">
              Your current Clerk profile picture will be synced to all your posts.
              Change your avatar in Clerk, then click Sync to update existing posts.
            </p>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/users/sync-clerk-avatar", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to sync");
                    toast.success("Synced profile picture to all posts!");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to sync");
                  }
                }}
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Sync from Clerk
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Anon Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 shadow-2xl"
        >
          {!clerkUser && (
          <>
          {/* Profile Picture Section */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-[#e4e6eb] mb-4">
              Profile Picture
            </h2>
            
            <div className="flex items-start gap-6">
              {/* Current/Preview Profile Picture */}
              <div className="flex-shrink-0">
                {(previewPicture || profilePicture) ? (
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#5865f2] bg-[#1a1b23]"
                    >
                      <Image
                        src={previewPicture || profilePicture || ""}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {previewPicture && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-[#5865f2] rounded-full flex items-center justify-center border-2 border-[#1a1b23]"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center border-4 border-[#5865f2]">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload className="w-4 h-4" />
                    <span>{profilePicture || previewPicture ? "Change Picture" : "Upload Picture"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading || isSaving}
                    />
                  </label>

                  {hasChanges && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveChanges}
                        disabled={isSaving || !previewPicture}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2d2f36] hover:bg-[#3d3f47] text-[#e4e6eb] font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </motion.button>
                    </>
                  )}

                  {!hasChanges && (profilePicture || originalProfilePicture) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemovePicture}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Remove</span>
                    </motion.button>
                  )}
                </div>

                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-[#b9bbbe] text-sm"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-[#5865f2] border-t-transparent rounded-full"
                    />
                    <span>Processing image...</span>
                  </motion.div>
                )}

                {hasChanges && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-[#5865f2] font-medium"
                  >
                    You have unsaved changes. Click "Save Changes" to apply or "Cancel" to discard.
                  </motion.p>
                )}

                <p className="text-xs text-[#b9bbbe]">
                  Upload a profile picture (max 2MB). This will be visible on all your posts.
                </p>
              </div>
            </div>
          </div>
          </>
          )}

          {/* User Info Section */}
          <div className="pt-6 border-t border-[#3d3f47]">
            <h2 className="text-lg sm:text-xl font-semibold text-[#e4e6eb] mb-4">
              Account Information
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#1a1b23] rounded-lg">
                <div>
                  <p className="text-sm text-[#b9bbbe] mb-1">Username</p>
                  <p className="text-[#e4e6eb] font-medium">{clerkUser ? (clerkUser.username || clerkUser.firstName || clerkUser.id) : (anonUsername || "N/A")}</p>
                </div>
                {!clerkUser && (
                  <div className="px-3 py-1 bg-[#5865f2]/20 text-[#5865f2] rounded-lg text-xs font-medium">
                    Anonymous
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#1a1b23] rounded-lg">
                <p className="text-sm text-[#b9bbbe] mb-2">Account Type</p>
                {clerkUser ? (
                  <p className="text-[#e4e6eb]">
                    You are signed in with Clerk. Click "Sync from Clerk" above to update all your posts with your current Clerk avatar.
                  </p>
                ) : (
                  <p className="text-[#e4e6eb]">
                    You are using an anonymous account. Your posts will be displayed with your username and profile picture.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

