"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId, getAnonUsername, setAnonUsername as setAnonUsernameInStorage } from "@/app/lib/anon-auth";
import { ArrowLeft, User, Upload, X, Check, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { InsufficientTokensAlert } from "@/app/components/InsufficientTokensAlert";

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

  // Username change states
  const [previousUsernames, setPreviousUsernames] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [showInsufficientTokensAlert, setShowInsufficientTokensAlert] = useState(false);
  const [tokensNeeded, setTokensNeeded] = useState(0);
  const [requiredTokens, setRequiredTokens] = useState(1000);
  const [gifProfileEnabled, setGifProfileEnabled] = useState(false);
  const [isPurchasingGif, setIsPurchasingGif] = useState(false);

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
          setGifProfileEnabled(data.gif_profile_enabled || false);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, [anonUserId, clerkUser]);

  // Fetch token balance and previous username for anonymous users
  useEffect(() => {
    const fetchUserData = async () => {
      if (!anonUserId || clerkUser) return;

      try {
        // Fetch token balance
        const tokenResponse = await fetch(`/api/tokens?anonUserId=${anonUserId}`);
        const tokenData = await tokenResponse.json();
        if (tokenResponse.ok) {
          setTokenBalance(tokenData.balance || 0);
        }

        // Fetch previous usernames from user data
        const userResponse = await fetch(`/api/users/profile-picture?anonUserId=${anonUserId}`);
        const userData = await userResponse.json();
        if (userResponse.ok && userData.previousUsernames) {
          setPreviousUsernames(userData.previousUsernames || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [anonUserId, clerkUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isGif = file.type === "image/gif";
    
    if (!isImage) {
      toast.error("Please upload an image file");
      return;
    }

    // Check if GIF is allowed
    if (isGif && !gifProfileEnabled) {
      toast.error("GIF profile feature is not enabled. Purchase it to upload GIFs.");
      return;
    }

    // Validate file size (max 2MB for images, 5MB for GIFs)
    const maxSize = isGif ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${isGif ? '5MB' : '2MB'}`);
      return;
    }

    setIsUploading(true);

    // For GIFs, convert directly to base64 without resizing
    if (isGif) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewPicture(result);
        setHasChanges(true);
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read GIF file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

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

  const handlePurchaseGifProfile = async () => {
    if (!anonUserId) return;

    const GIF_PROFILE_COST = 1000;
    if (tokenBalance < GIF_PROFILE_COST) {
      const needed = GIF_PROFILE_COST - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(GIF_PROFILE_COST);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsPurchasingGif(true);
    try {
      const response = await fetch("/api/users/gif-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || GIF_PROFILE_COST - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(data.required || GIF_PROFILE_COST);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to purchase GIF profile feature");
      }

      setGifProfileEnabled(true);
      setTokenBalance(data.newBalance);
      toast.success("GIF profile feature enabled! You can now upload GIF profile pictures.");
    } catch (error: any) {
      console.error("Error purchasing GIF profile:", error);
      toast.error(error.message || "Failed to purchase GIF profile feature");
    } finally {
      setIsPurchasingGif(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!anonUserId || !newUsername.trim()) {
      toast.error("Please enter a new username");
      return;
    }

    // Combine "anon-" prefix with user input
    const fullUsername = `anon-${newUsername.trim().toLowerCase()}`;

    // Check if user has enough tokens
    const USERNAME_CHANGE_COST = 1000;
    if (tokenBalance < USERNAME_CHANGE_COST) {
      const needed = USERNAME_CHANGE_COST - tokenBalance;
      setTokensNeeded(needed);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsChangingUsername(true);
    try {
      const response = await fetch("/api/users/change-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          newUsername: fullUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || USERNAME_CHANGE_COST - tokenBalance;
          setTokensNeeded(needed);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to change username");
      }

      // Update local storage with new username
      setAnonUsernameInStorage(data.newUsername);
      
      // Update state
      setAnonUsername(data.newUsername);
      setNewUsername("");
      setTokenBalance(data.newBalance);
      
      // Refresh previous usernames
      const refreshResponse = await fetch(`/api/users/profile-picture?anonUserId=${anonUserId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.previousUsernames) {
        setPreviousUsernames(refreshData.previousUsernames || []);
      }
      
      toast.success("Username changed successfully!");
      
      // Refresh the page to update all displayed usernames
      window.location.reload();
    } catch (error: any) {
      console.error("Error changing username:", error);
      toast.error(error.message || "Failed to change username");
    } finally {
      setIsChangingUsername(false);
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
                      {(previewPicture || profilePicture)?.startsWith("data:image/gif") ? (
                        <img
                          src={previewPicture || profilePicture || ""}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={previewPicture || profilePicture || ""}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      )}
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
                      accept={gifProfileEnabled ? "image/*" : "image/png,image/jpeg,image/jpg,image/webp"}
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
                  Upload a profile picture ({gifProfileEnabled ? 'GIF max 5MB, other images max 2MB' : 'max 2MB'}). This will be visible on all your posts.
                </p>

                {/* GIF Profile Feature Section */}
                {!gifProfileEnabled && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#e4e6eb] mb-1 flex items-center gap-2">
                          <span className="text-lg">🎬</span>
                          GIF Profile Feature
                        </h3>
                        <p className="text-xs text-[#b9bbbe]">
                          Unlock the ability to upload animated GIF profile pictures
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePurchaseGifProfile}
                        disabled={isPurchasingGif}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isPurchasingGif ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Purchasing...</span>
                          </>
                        ) : (
                          <>
                            <span>Purchase</span>
                            <span className="text-yellow-400 font-bold">(1000 tokens)</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {gifProfileEnabled && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-400 font-medium flex items-center gap-2">
                      <span>✓</span>
                      GIF profile feature enabled - You can upload animated GIFs!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
          )}

          {/* Change Username Section - Only for Anonymous Users */}
          {!clerkUser && (
            <div className="mb-8 pt-6 border-t border-[#3d3f47]">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-[#e4e6eb] mb-2 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#5865f2]" />
                  Change Username
                </h2>
                <p className="text-sm text-[#b9bbbe]">
                  Update your username across all posts and comments
                </p>
              </motion.div>
              
              <div className="space-y-5">
                {/* Current Username Display */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-gradient-to-br from-[#1a1b23] to-[#2d2f36] rounded-xl border border-[#3d3f47] shadow-lg"
                >
                  <p className="text-xs text-[#9aa0a6] mb-2 uppercase tracking-wide">Current Username</p>
                  <p className="text-[#e4e6eb] font-semibold text-lg">{anonUsername || "N/A"}</p>
                </motion.div>

                {/* Previous Usernames Display */}
                {previousUsernames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gradient-to-br from-[#1a1b23] to-[#2d2f36] rounded-xl border border-[#3d3f47] shadow-lg"
                  >
                    <p className="text-xs text-[#9aa0a6] mb-3 uppercase tracking-wide">
                      Previous Usernames ({previousUsernames.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {previousUsernames.map((username, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="px-3 py-1.5 bg-[#2d2f36] border border-[#3d3f47] rounded-lg text-[#b9bbbe] text-sm font-medium"
                        >
                          {username}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* New Username Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-[#e4e6eb] mb-3">
                      New Username
                    </label>
                    <div className="inline-flex items-center shadow-lg">
                      {/* Fixed "anon-" prefix */}
                      <div className="px-4 py-3 bg-gradient-to-br from-[#5865f2] to-[#4752c4] border border-[#5865f2] rounded-l-xl text-white font-semibold text-sm">
                        anon-
                      </div>
                      {/* Input for the rest of the username */}
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          // Only allow alphanumeric, hyphens, and underscores after anon-
                          const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                          setNewUsername(value);
                        }}
                        placeholder="yourname"
                        className="w-56 px-4 py-3 bg-[#1a1b23] border border-l-0 border-[#3d3f47] rounded-r-xl text-[#e4e6eb] placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-[#5865f2] transition-all"
                        disabled={isChangingUsername}
                      />
                    </div>
                    {!newUsername.trim() && (
                      <p className="mt-2 text-xs text-[#9aa0a6]">
                        Enter the part after "anon-" (e.g., "raregem" for "anon-raregem")
                      </p>
                    )}
                  </div>

                  {/* Change Username Button */}
                  <div className="flex flex-col items-start gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleChangeUsername}
                      disabled={isChangingUsername || !newUsername.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#5865f2]/30"
                    >
                      {isChangingUsername ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Changing Username...</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          <span>Change Username</span>
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-bold">
                            1000 tokens
                          </span>
                        </>
                      )}
                    </motion.button>

                    <p className="text-xs text-[#9aa0a6] max-w-md">
                      Changing your username will update it in all your previous posts and comments.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
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

      {/* Insufficient Tokens Alert */}
      <InsufficientTokensAlert
        isOpen={showInsufficientTokensAlert}
        onClose={() => setShowInsufficientTokensAlert(false)}
        tokensNeeded={tokensNeeded}
        currentBalance={tokenBalance}
        required={requiredTokens || 1000}
      />
    </div>
  );
}

