"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { isAdminEmail } from "@/app/lib/admin";

interface TrendingTag {
  tag: string;
  count: number;
}

interface TrendingTagsSidebarProps {
  onTagClick?: (tag: string) => void;
  selectedTag?: string | null;
  compact?: boolean; // mobile row variant
}

export function TrendingTagsSidebar({ onTagClick, selectedTag, compact }: TrendingTagsSidebarProps) {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const adminEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || undefined;
  const isAdmin = isAdminEmail(adminEmail);

  const fetchTrendingTags = async () => {
    try {
      const response = await fetch("/api/tags/trending");
      const data = await response.json();

      if (response.ok) {
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching trending tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTags();
    // Refresh every 30 seconds to keep tags updated
    const interval = setInterval(fetchTrendingTags, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for post creation events to refresh tags
  useEffect(() => {
    const handlePostCreated = () => {
      fetchTrendingTags();
    };

    window.addEventListener("postCreated", handlePostCreated);
    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
    };
  }, []);

  const capitalizeTag = (tag: string): string => {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  // Generate a color based on tag name for consistent coloring (no orange hues)
  const getTagColor = (tag: string, index: number): string => {
    // 20 distinct, vibrant gradients (no oranges/yellows)
    const colors = [
      "from-[#3b82f6] to-[#1d4ed8]", // Blue
      "from-[#6366f1] to-[#4338ca]", // Indigo
      "from-[#8b5cf6] to-[#6d28d9]", // Violet
      "from-[#a78bfa] to-[#7c3aed]", // Soft Purple
      "from-[#ec4899] to-[#db2777]", // Fuchsia
      "from-[#f43f5e] to-[#b91c1c]", // Rose/Red
      "from-[#22c55e] to-[#16a34a]", // Green
      "from-[#10b981] to-[#047857]", // Emerald
      "from-[#34d399] to-[#059669]", // Teal-Green
      "from-[#14b8a6] to-[#0d9488]", // Teal
      "from-[#06b6d4] to-[#0891b2]", // Cyan
      "from-[#38bdf8] to-[#0284c7]", // Sky
      "from-[#67e8f9] to-[#22d3ee]", // Light Cyan
      "from-[#f472b6] to-[#be185d]", // Pink
      "from-[#94a3b8] to-[#475569]", // Slate
      "from-[#64748b] to-[#334155]", // Blue-Grey
      "from-[#84cc16] to-[#65a30d]", // Lime-Green
      "from-[#22d3ee] to-[#06b6d4]", // Aqua
      "from-[#7dd3fc] to-[#38bdf8]", // Light Sky
      "from-[#c084fc] to-[#a855f7]", // Light Purple
    ];

    // djb2 hash for better distribution; mix index slightly to avoid collisions
    let hash = 5381;
    for (let i = 0; i < tag.length; i++) {
      hash = ((hash << 5) + hash) + tag.charCodeAt(i);
    }
    hash = Math.abs(hash + index * 13);
    return colors[hash % colors.length];
  };

  // Compact chip-style row for mobile
  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#5865f2]" />
            <span className="text-sm font-semibold text-[#e4e6eb]">Top 20 Trending Tags</span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-[#5865f2] border-t-transparent rounded-full"
            />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-[#b9bbbe] text-xs py-2">No trending tags yet.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tags.map((tagItem, index) => {
              const isSelected = selectedTag?.toLowerCase() === tagItem.tag.toLowerCase();
              const tagColor = getTagColor(tagItem.tag, index);
              return (
                <motion.button
                  key={tagItem.tag}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onTagClick?.(tagItem.tag)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#1a1b23] border-[#5865f2] text-white"
                      : "bg-[#1b1e27] border-[#3d3f47] text-[#e4e6eb] hover:bg-[#1f2330]"
                  }`}
                >
                  <span className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${tagColor}`}>#</span>
                  <span className="font-medium">{capitalizeTag(tagItem.tag)}</span>
                  <span className={`ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] text-white bg-gradient-to-r ${tagColor}`}>
                    {tagItem.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 backdrop-blur-sm h-fit max-h-[calc(100vh-9rem)] overflow-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-2 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-lg"
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-[#e4e6eb] bg-gradient-to-r from-[#e4e6eb] to-[#b9bbbe] bg-clip-text text-transparent">
            Top 20 Trending Tags
          </h2>
        </div>

        {/* Tags List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-[#5865f2] border-t-transparent rounded-full"
            />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-[#b9bbbe] text-sm text-center py-4">
            No trending tags yet. Be the first to use a tag!
          </p>
        ) : (
          <div className="space-y-3">
            {tags.map((tagItem, index) => {
              const isSelected = selectedTag?.toLowerCase() === tagItem.tag.toLowerCase();
              const tagColor = getTagColor(tagItem.tag, index);
              const isTopThree = index < 3;
              
              return (
                <motion.button
                  key={tagItem.tag}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTagClick?.(tagItem.tag)}
                  className={`w-full rounded-xl border transition-colors text-left ${
                    isSelected ? "border-[#5865f2] bg-[#1a1b23]/60" : "border-[#3d3f47] bg-[#171a22] hover:bg-[#1b1e27]"
                  }`}
                >
                  
                  <div className="relative flex items-center justify-between p-4">
                    {/* Left side: Rank and Tag */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank Badge */}
                      <motion.div
                        className={`flex-shrink-0 w-7 h-7 flex items-center justify-center font-bold text-xs rounded-full ${
                          isTopThree ? `bg-gradient-to-br ${tagColor} text-white` : "bg-[#2d2f36] text-[#b9bbbe] border border-[#3d3f47]"
                        }`}
                        style={{ borderRadius: '100px' }}
                        whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                      >
                        {index + 1}
                      </motion.div>
                      
                      {/* Tag chip */}
                      <div className="relative inline-flex items-center gap-1.5">
                        <div
                          className={`px-3 py-1.5 rounded-full border-2 ${
                            isSelected
                              ? `bg-gradient-to-r ${tagColor} border-transparent text-white`
                              : "bg-[#1b1e27] border-[#3d3f47]"
                          }`}
                        >
                          <span className={`text-base font-bold ${isSelected ? "text-white" : `text-transparent bg-gradient-to-r ${tagColor} bg-clip-text`}`}>
                            #
                          </span>
                          <span className={`font-semibold truncate text-base ${isSelected ? "text-white" : "text-[#e4e6eb]"}`}>
                            {capitalizeTag(tagItem.tag)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side: Count (perfect circle) + admin delete */}
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 ml-3 w-9 h-9 flex items-center justify-center font-bold text-base rounded-full text-white bg-gradient-to-r ${tagColor}`}
                      >
                        {tagItem.count}
                      </div>
                      {isAdmin && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = confirm(`Delete tag "${tagItem.tag}" from all posts?`);
                            if (!ok) return;
                            try {
                              const res = await fetch(`/api/tags/${encodeURIComponent(tagItem.tag)}`, { method: "DELETE" });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "Failed to delete tag");
                              fetchTrendingTags();
                            } catch (err: any) {
                              console.error(err);
                              alert(err.message || "Failed to delete tag");
                            }
                          }}
                          className="ml-2 px-2 py-0.5 rounded-md text-xs bg-red-600/20 text-red-300 border border-red-600/30 cursor-pointer"
                          title="Delete tag (admin)"
                        >
                          Delete
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </aside>
  );
}

