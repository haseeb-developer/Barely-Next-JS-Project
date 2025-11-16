"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Trash2, User, Hash, AlertTriangle, Flag } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";
import toast from "react-hot-toast";
import Image from "next/image";
import { ClerkProfileImage } from "./ClerkProfileImage";
import { isAdminEmail } from "@/app/lib/admin";

interface Post {
  id: string;
  content: string;
  username: string;
  user_id: string;
  user_type: "clerk" | "anonymous";
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  flags_count?: number;
  profile_picture?: string | null;
  is_admin?: boolean;
  tags?: string[];
}

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [dislikesCount, setDislikesCount] = useState(post.dislikes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagsCount, setFlagsCount] = useState(post.flags_count || 0);
  const [profilePicture, setProfilePicture] = useState<string | null>(post.profile_picture || null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [showResetFlags, setShowResetFlags] = useState(false);
  const [isResettingFlags, setIsResettingFlags] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useUser();
  const anonUserId = getAnonUserId();

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      // Refresh profile picture if this post belongs to current user
      if (post.user_type === "anonymous" && post.user_id === anonUserId) {
        fetch(`/api/users/profile-picture?anonUserId=${anonUserId}`)
          .then(res => res.json())
          .then(data => {
            if (data.profilePicture) {
              setProfilePicture(data.profilePicture);
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    return () => {
      window.removeEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    };
  }, [post.user_id, post.user_type, anonUserId]);

  const currentUserId = user?.id || anonUserId;
  const currentEmail = user?.primaryEmailAddress?.emailAddress || null;
  const isAdmin = isAdminEmail(currentEmail);
  const canDelete = isAdmin || currentUserId === post.user_id;

  // Check user's reaction and flag status on mount
  useEffect(() => {
    const checkReaction = async () => {
      if (!currentUserId) return;

      try {
        // Check reaction
        const url = new URL(`/api/posts/${post.id}/user-reaction`, window.location.origin);
        if (anonUserId) {
          url.searchParams.set("anonUserId", anonUserId);
        }

        const response = await fetch(url);
        const data = await response.json();

        setIsLiked(data.liked || false);
        setIsDisliked(data.disliked || false);

        // Check flag status
        const flagUrl = new URL(`/api/posts/${post.id}/flag`, window.location.origin);
        if (anonUserId) {
          flagUrl.searchParams.set("anonUserId", anonUserId);
        }

        const flagResponse = await fetch(flagUrl);
        const flagData = await flagResponse.json();

        setIsFlagged(flagData.hasFlagged || false);
        setFlagsCount(flagData.flagCount || 0);
      } catch (error) {
        console.error("Error checking reaction:", error);
      }
    };

    checkReaction();
  }, [post.id, currentUserId, anonUserId]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to react");
      return;
    }

    if (isReacting) return;
    setIsReacting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId: anonUserId || null,
          anonUserType: anonUserId ? "anonymous" : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to like post");
      }

      // Update state based on response
      if (data.liked) {
        // User just liked
        if (isDisliked) {
          // Was disliked, now liked - remove dislike count
          setDislikesCount((prev) => Math.max(0, prev - 1));
          setIsDisliked(false);
        }
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      } else {
        // User unliked
        setLikesCount((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      }
    } catch (error: any) {
      console.error("Error liking post:", error);
      toast.error(error.message || "Failed to react");
    } finally {
      setIsReacting(false);
    }
  };

  const handleFlag = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to flag posts");
      return;
    }

    // Admin flow: open reset dialog instead of flagging
    if (isAdmin) {
      setShowResetFlags(true);
      return;
    }

    if (isFlagging) return;
    setIsFlagging(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId: anonUserId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to flag post");
      }

      setIsFlagged(true);
      setFlagsCount(data.flagCount || 0);
      toast.success("Post flagged. Thank you for keeping the community safe!");
      
      // If post was deleted (15+ flags), refresh the page
      if (data.flagCount >= 15) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error flagging post:", error);
      toast.error(error.message || "Failed to flag post");
    } finally {
      setIsFlagging(false);
    }
  };

  const confirmResetFlags = async () => {
    setIsResettingFlags(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/flag`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset flags");
      }
      setFlagsCount(0);
      setIsFlagged(false);
      toast.success("Flags reset to 0");
      setShowResetFlags(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to reset flags");
    } finally {
      setIsResettingFlags(false);
    }
  };

  const handleDislike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to react");
      return;
    }

    if (isReacting) return;
    setIsReacting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId: anonUserId || null,
          anonUserType: anonUserId ? "anonymous" : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to dislike post");
      }

      // Update state based on response
      if (data.disliked) {
        // User just disliked
        if (isLiked) {
          // Was liked, now disliked - remove like count
          setLikesCount((prev) => Math.max(0, prev - 1));
          setIsLiked(false);
        }
        setDislikesCount((prev) => prev + 1);
        setIsDisliked(true);
      } else {
        // User removed dislike
        setDislikesCount((prev) => Math.max(0, prev - 1));
        setIsDisliked(false);
      }
    } catch (error: any) {
      console.error("Error disliking post:", error);
      toast.error(error.message || "Failed to react");
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId: anonUserId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete post");
      }

      toast.success("Confession deleted");
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#2d2f36] rounded-xl p-6 border border-[#3d3f47] hover:border-[#5865f2]/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          {post.profile_picture ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#5865f2] bg-[#1a1b23]">
              <Image
                src={post.profile_picture}
                alt={post.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : profilePicture ? (
            // Anonymous user with profile picture
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#5865f2] bg-[#1a1b23]">
              <Image
                src={profilePicture}
                alt={post.username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            // Anonymous user without profile picture
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#e4e6eb] flex items-center gap-2">
              By {post.username}
              {(post.is_admin || (isAdmin && post.user_id === currentUserId)) && (
                <span className="relative inline-flex group">
                  <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" className="w-4 h-4 text-blue-400 cursor-pointer" data-testid="icon-verified">
                    <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="currentColor"></path></g>
                  </svg>
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 hidden group-hover:block bg-[#111318] text-white text-xs px-2 py-1 rounded-md border border-[#3d3f47] whitespace-nowrap shadow-lg">
                    Verified Developer | Creator
                  </span>
                </span>
              )}
            </p>
            <p className="text-xs text-[#b9bbbe]">{formatDate(post.created_at)}</p>
          </div>
        </div>
        {canDelete && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
              />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </div>

      {/* Content */}
      <p className="text-[#e4e6eb] mb-4 text-lg leading-relaxed">{post.content}</p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5865f2]/20 text-[#5865f2] rounded-full text-xs font-medium"
            >
              <Hash className="w-3 h-3" />
              {tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#3d3f47]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLike}
          disabled={isReacting || !currentUserId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            isLiked
              ? "bg-[#5865f2] text-white"
              : "bg-[#1a1b23] text-[#b9bbbe] hover:bg-[#3d3f47]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{likesCount}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDislike}
          disabled={isReacting || !currentUserId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            isDisliked
              ? "bg-red-500 text-white"
              : "bg-[#1a1b23] text-[#b9bbbe] hover:bg-[#3d3f47]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ThumbsDown className={`w-4 h-4 ${isDisliked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{dislikesCount}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFlag}
          disabled={isFlagging || !currentUserId || (!isAdmin && isFlagged)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            isFlagged
              ? "bg-orange-500 text-white"
              : "bg-[#1a1b23] text-[#b9bbbe] hover:bg-[#3d3f47]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Flag className={`w-4 h-4 ${isFlagged ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">{flagsCount}</span>
        </motion.button>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2d2f36] rounded-2xl shadow-2xl max-w-md w-full mx-4 z-50 border border-[#3d3f47]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#e4e6eb]">
                      Delete Confession
                    </h3>
                    <p className="text-sm text-[#b9bbbe] mt-1">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                {/* Message */}
                <p className="text-[#e4e6eb] mb-6">
                  Are you sure you want to delete this confession? This will permanently remove it from the platform.
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-[#1a1b23] hover:bg-[#3d3f47] text-[#e4e6eb] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin: Reset Flags Modal */}
      <AnimatePresence>
        {showResetFlags && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetFlags(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2d2f36] rounded-2xl shadow-2xl max-w-md w-full mx-4 z-50 border border-[#3d3f47]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <Flag className="w-6 h-6 text-orange-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#e4e6eb]">
                      Reset Flags
                    </h3>
                    <p className="text-sm text-[#b9bbbe] mt-1">
                      Set this post’s flag count back to 0? Users will be able to flag it again.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowResetFlags(false)}
                    className="flex-1 px-4 py-3 bg-[#1a1b23] hover:bg-[#3d3f47] text-[#e4e6eb] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmResetFlags}
                    disabled={isResettingFlags}
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResettingFlags ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Resetting...
                      </>
                    ) : (
                      "Reset to 0"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

