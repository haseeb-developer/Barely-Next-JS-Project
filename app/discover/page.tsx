"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/app/components/PostCard";
import { CreatePostModal } from "@/app/components/CreatePostModal";
import { TrendingTagsSidebar } from "@/app/components/TrendingTagsSidebar";
import { Filter, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId } from "@/app/lib/anon-auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  content: string;
  username: string;
  user_id: string;
  user_type: "clerk" | "anonymous";
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  profile_picture?: string | null;
  is_admin?: boolean;
}

type FilterType = "all" | "recent" | "popular";

export default function DiscoverPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Check authentication on client side only to avoid hydration mismatch
  useEffect(() => {
    const anonUserId = getAnonUserId();
    setIsAuthenticated(!!user || !!anonUserId);
  }, [user]);

  // If user signs out (and not anon), redirect to /home
  useEffect(() => {
    const anonUserId = getAnonUserId();
    if (!user && !anonUserId) {
      router.replace("/home");
    }
  }, [user, router]);

  // Listen for custom event from header to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      // Double-check authentication before opening modal
      const anonUserId = getAnonUserId();
      if (!user && !anonUserId) {
        toast.error("Please sign in to post a confession");
        return;
      }
      // Small delay to ensure component is ready
      setTimeout(() => {
        setIsCreateModalOpen(true);
      }, 50);
    };

    window.addEventListener("openCreatePostModal", handleOpenModal);
    return () => {
      window.removeEventListener("openCreatePostModal", handleOpenModal);
    };
  }, [user]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/posts", window.location.origin);
      url.searchParams.set("filter", filter);
      if (selectedTag) {
        url.searchParams.set("tag", selectedTag);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter, selectedTag]);

  const handleTagClick = (tag: string) => {
    // If clicking the same tag, deselect it
    if (selectedTag?.toLowerCase() === tag.toLowerCase()) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
    // Reset filter when selecting a tag
    setFilter("all");
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = () => {
    fetchPosts();
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#1a1b23] py-8">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#e4e6eb] mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#5865f2]" />
                Discover Confessions
              </h1>
              <p className="text-sm sm:text-base text-[#b9bbbe]">
                {selectedTag 
                  ? `Showing posts tagged with "${selectedTag}"` 
                  : "Share your thoughts and discover others"}
              </p>
              {selectedTag && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedTag(null)}
                  className="mt-2 px-3 py-1 text-sm bg-[#2d2f36] hover:bg-[#3d3f47] text-[#b9bbbe] rounded-lg transition-colors cursor-pointer"
                >
                  Clear filter
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Filter className="w-5 h-5 text-[#b9bbbe]" />
            {filters.map((filterOption) => (
              <motion.button
                key={filterOption.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterOption.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  filter === filterOption.id
                    ? "bg-[#5865f2] text-white"
                    : "bg-[#2d2f36] text-[#b9bbbe] hover:bg-[#3d3f47]"
                }`}
              >
                {filterOption.label}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Mobile Trending Row (compact) */}
        <div className="mb-6 lg:hidden">
          <TrendingTagsSidebar
            onTagClick={handleTagClick}
            selectedTag={selectedTag}
            compact
          />
        </div>

        {/* Main Content: Flex layout with sidebar and posts */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Trending Tags Sidebar - desktop only */}
          <div className="hidden lg:block lg:order-1">
            <TrendingTagsSidebar
              onTagClick={handleTagClick}
              selectedTag={selectedTag}
            />
          </div>

          {/* Posts Section - Second on mobile, first on desktop */}
          <div className="flex-1 order-1 lg:order-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-[#5865f2] border-t-transparent rounded-full"
                />
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-[#b9bbbe] text-lg mb-4">No confessions yet</p>
                {isAuthenticated ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Be the first to share!
                  </motion.button>
                ) : (
                  <p className="text-[#b9bbbe]">Sign in to share your first confession</p>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard post={post} onDelete={handlePostDeleted} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
