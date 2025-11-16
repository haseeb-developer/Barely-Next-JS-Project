"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/app/components/PostCard";
import { TrendingUp, Hash, Sparkles } from "lucide-react";

interface Post {
  id: string;
  content: string;
  username: string;
  user_id: string;
  user_type: "clerk" | "anonymous";
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  tags?: string[];
}

interface TrendingTag {
  tag: string;
  count: number;
  posts: Post[];
}

export default function TrendingPage() {
  const [trendingData, setTrendingData] = useState<TrendingTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trending");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch trending");
      }

      setTrendingData(data.trending || []);
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTagData = selectedTag
    ? trendingData.find((t) => t.tag === selectedTag)
    : null;

  return (
    <div className="min-h-screen bg-[#1a1b23] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-[#5865f2]" />
            <h1 className="text-3xl font-bold text-[#e4e6eb]">Trending Tags</h1>
          </div>
          <p className="text-[#b9bbbe]">
            Discover the most popular tags with 20+ confessions
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[#5865f2] border-t-transparent rounded-full"
            />
          </div>
        ) : trendingData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 text-[#5865f2] mx-auto mb-4" />
            <p className="text-[#b9bbbe] text-lg mb-2">No trending tags yet</p>
            <p className="text-[#b9bbbe] text-sm">
              Tags need at least 20 confessions to appear here
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trending Tags Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#2d2f36] rounded-xl p-6 border border-[#3d3f47] sticky top-4">
                <h2 className="text-lg font-semibold text-[#e4e6eb] mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-[#5865f2]" />
                  Popular Tags
                </h2>
                <div className="space-y-2">
                  {trendingData.map(({ tag, count }, index) => (
                    <motion.button
                      key={tag}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        selectedTag === tag
                          ? "bg-[#5865f2] text-white"
                          : "bg-[#1a1b23] text-[#e4e6eb] hover:bg-[#3d3f47]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">#{tag}</span>
                        <span
                          className={`text-sm ${
                            selectedTag === tag ? "text-white/80" : "text-[#b9bbbe]"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div className="lg:col-span-2">
              {selectedTagData ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#e4e6eb] mb-2">
                      #{selectedTagData.tag}
                    </h2>
                    <p className="text-[#b9bbbe]">
                      {selectedTagData.count} confession{selectedTagData.count !== 1 ? "s" : ""} with this tag
                    </p>
                  </div>
                  {selectedTagData.posts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#b9bbbe]">No posts found for this tag</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTagData.posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <PostCard post={post} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Hash className="w-16 h-16 text-[#5865f2] mx-auto mb-4" />
                  <p className="text-[#b9bbbe] text-lg mb-2">
                    Select a tag to view confessions
                  </p>
                  <p className="text-[#b9bbbe] text-sm">
                    Click on any trending tag from the sidebar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
