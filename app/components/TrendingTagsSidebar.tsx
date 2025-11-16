"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface TrendingTag {
  tag: string;
  count: number;
}

interface TrendingTagsSidebarProps {
  onTagClick?: (tag: string) => void;
  selectedTag?: string | null;
}

export function TrendingTagsSidebar({ onTagClick, selectedTag }: TrendingTagsSidebarProps) {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] lg:flex-shrink-0">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 shadow-2xl sticky top-8 backdrop-blur-sm"
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
            Trending Tags
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
                  whileHover={{ 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTagClick?.(tagItem.tag)}
                  className={`w-full relative overflow-hidden rounded-xl transition-all duration-200 group cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${tagColor} shadow-lg shadow-[#5865f2]/30`
                      : "bg-gradient-to-br from-[#1a1b23] to-[#2d2f36] hover:from-[#2d2f36] hover:to-[#3d3f47] border border-[#3d3f47]/30"
                  } ${isTopThree && !isSelected ? "ring-2 ring-[#5865f2]/20" : ""}`}
                >
                  
                  <div className="relative flex items-center justify-between p-4">
                    {/* Left side: Rank and Tag */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank Badge */}
                      <motion.div
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-sm ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isTopThree
                            ? `bg-gradient-to-br ${tagColor} text-white shadow-md`
                            : "bg-[#2d2f36] text-[#b9bbbe] border border-[#3d3f47]"
                        }`}
                        style={{ borderRadius: '100px' }}
                        whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                      >
                        {index + 1}
                      </motion.div>
                      
                      {/* Tag Name with Hash and Border */}
                      <div className="relative inline-block">
                        {/* Outer gradient border */}
                        {!isSelected && (
                          <div className={`absolute -inset-[2px] bg-gradient-to-r ${tagColor} opacity-80`} style={{ borderRadius: '100px' }}></div>
                        )}
                        {/* Inner content with background */}
                        <div className={`relative flex items-center gap-1.5 px-3 py-1.5 ${
                          isSelected
                            ? "bg-white/10 border-2 border-white/30"
                            : "bg-[#1a1b23]"
                        }`}
                        style={{ borderRadius: '100px' }}>
                          <span className={`text-base font-bold ${
                            isSelected 
                              ? "text-white" 
                              : `text-transparent bg-gradient-to-r ${tagColor} bg-clip-text`
                          }`}>
                            #
                          </span>
                          <span className={`font-semibold truncate text-base ${
                            isSelected 
                              ? "text-white" 
                              : `text-transparent bg-gradient-to-r ${tagColor} bg-clip-text`
                          }`}>
                            {capitalizeTag(tagItem.tag)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side: Count (perfect circle) */}
                    <div
                      className={`flex-shrink-0 ml-3 w-9 h-9 flex items-center justify-center font-bold text-base ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : `bg-gradient-to-r ${tagColor} text-white shadow-sm`
                      } rounded-full`}
                    >
                      {tagItem.count}
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

