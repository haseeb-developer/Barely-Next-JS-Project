"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getAnonUserId, getAnonUsername } from "@/app/lib/anon-auth";
import { ArrowLeft, Sparkles, Palette, Layers, X, Check, Trash2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { InsufficientTokensAlert } from "@/app/components/InsufficientTokensAlert";
import { ColorPickerPopover } from "@/app/components/ColorPickerPopover";
import { PurchasedColorsModal } from "@/app/components/PurchasedColorsModal";

// Add CSS animation for smooth gradient movement in all directions
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes gradientMove {
      0% {
        background-position: 0% 50%;
      }
      25% {
        background-position: 100% 0%;
      }
      50% {
        background-position: 100% 100%;
      }
      75% {
        background-position: 0% 100%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    .animated-gradient {
      animation: gradientMove 8s ease-in-out infinite;
      background-size: 300% 300%;
    }
  `;
  if (!document.head.querySelector('style[data-gradient-animation]')) {
    style.setAttribute('data-gradient-animation', 'true');
    document.head.appendChild(style);
  }
}

const PRESET_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", 
  "#FF33F5", "#FF3366", "#33FFF5",
];

export default function PerksPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [anonUserId, setAnonUserId] = useState<string | null>(null);
  const [anonUsername, setAnonUsername] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Token and color states
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [currentGradient, setCurrentGradient] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedSolidColors, setPurchasedSolidColors] = useState<string[]>([]);
  const [purchasedGradientColors, setPurchasedGradientColors] = useState<string[][]>([]);
  const [purchasedGradientSlots, setPurchasedGradientSlots] = useState<number>(0);
  const [animatedGradientEnabled, setAnimatedGradientEnabled] = useState<boolean>(false);
  const [isPurchasingAnimated, setIsPurchasingAnimated] = useState<boolean>(false);

  // Solid color states
  const [selectedSolidColor, setSelectedSolidColor] = useState("#FF5733");
  const [customSolidColor, setCustomSolidColor] = useState("#FF5733");
  const [isApplyingSolid, setIsApplyingSolid] = useState(false);
  const [isSolidColorPickerOpen, setIsSolidColorPickerOpen] = useState(false);

  // Gradient states
  const [gradientColors, setGradientColors] = useState<string[]>(["#FF5733", "#33FF57"]);
  const [isApplyingGradient, setIsApplyingGradient] = useState(false);
  const [openGradientPickerIndex, setOpenGradientPickerIndex] = useState<number | null>(null);

  // Modal states
  const [showPurchasedColorsModal, setShowPurchasedColorsModal] = useState(false);
  const [purchasedModalType, setPurchasedModalType] = useState<"solid" | "gradient">("solid");

  // Alert states
  const [showInsufficientTokensAlert, setShowInsufficientTokensAlert] = useState(false);
  const [tokensNeeded, setTokensNeeded] = useState(0);
  const [requiredTokens, setRequiredTokens] = useState(0);

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
      toast.error("Please sign in to access perks");
      router.push("/anon-account");
    }
  }, [clerkUser, anonUserId, router, isClient]);

  // Fetch token balance and current username color
  useEffect(() => {
    const fetchData = async () => {
      if (!anonUserId || clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch token balance
        const tokenResponse = await fetch(`/api/tokens?anonUserId=${anonUserId}`);
        const tokenData = await tokenResponse.json();
        if (tokenResponse.ok) {
          setTokenBalance(tokenData.balance || 0);
        }

        // Fetch current username color
        const colorResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
        const colorData = await colorResponse.json();
        if (colorResponse.ok) {
          setCurrentColor(colorData.username_color || null);
          setCurrentGradient(colorData.username_color_gradient || null);
          setPurchasedSolidColors(colorData.purchased_solid_colors || []);
          setPurchasedGradientColors(colorData.purchased_gradient_colors || []);
          setPurchasedGradientSlots(colorData.purchased_gradient_color_slots || 0);
          setAnimatedGradientEnabled(colorData.animated_gradient_enabled || false);
          if (colorData.username_color) {
            setSelectedSolidColor(colorData.username_color);
            setCustomSolidColor(colorData.username_color);
          }
          if (colorData.username_color_gradient) {
            // Restore the full gradient from database
            setGradientColors(colorData.username_color_gradient);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [anonUserId, clerkUser]);

  const handleApplySolidColor = async () => {
    if (!anonUserId) return;

    const SOLID_COST = 250;
    if (tokenBalance < SOLID_COST) {
      const needed = SOLID_COST - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(SOLID_COST);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsApplyingSolid(true);
    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "solid",
          color: selectedSolidColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || SOLID_COST - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(SOLID_COST);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to apply color");
      }

      setCurrentColor(selectedSolidColor);
      setCurrentGradient(null);
      setTokenBalance(data.newBalance);
      // Refresh purchased colors
      const refreshResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setPurchasedSolidColors(refreshData.purchased_solid_colors || []);
      }
      toast.success("Username color applied successfully!");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error applying solid color:", error);
      toast.error(error.message || "Failed to apply color");
    } finally {
      setIsApplyingSolid(false);
    }
  };

  const handleApplyPurchasedSolidColor = async (color: string) => {
    if (!anonUserId) return;

    const SOLID_COST = 250;
    if (tokenBalance < SOLID_COST) {
      const needed = SOLID_COST - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(SOLID_COST);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsApplyingSolid(true);
    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "solid",
          color: color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || SOLID_COST - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(SOLID_COST);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to apply color");
      }

      // Update state with the applied color
      setSelectedSolidColor(color);
      setCustomSolidColor(color);
      setCurrentColor(color);
      setCurrentGradient(null);
      setTokenBalance(data.newBalance);
      // Refresh purchased colors
      const refreshResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setPurchasedSolidColors(refreshData.purchased_solid_colors || []);
      }
      toast.success("Username color applied successfully!");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error applying solid color:", error);
      toast.error(error.message || "Failed to apply color");
    } finally {
      setIsApplyingSolid(false);
    }
  };

  const handleApplyGradient = async () => {
    if (!anonUserId) return;

    if (gradientColors.length < 2) {
      toast.error("Gradient must have at least 2 colors");
      return;
    }

    // Calculate cost: 500 for base gradient, 25 for each NEW slot beyond 3
    // The API will handle the slot calculation, but we need to check balance
    // Estimate: base cost + potential new slots needed
    const baseCost = 500;
    const requiredSlots = Math.max(0, gradientColors.length - 3);
    const newSlotsNeeded = Math.max(0, requiredSlots - purchasedGradientSlots);
    const estimatedCost = baseCost + (newSlotsNeeded * 25);
    
    if (tokenBalance < estimatedCost) {
      const needed = estimatedCost - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(estimatedCost);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsApplyingGradient(true);
    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "gradient",
          gradientColors: gradientColors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || estimatedCost - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(data.required || estimatedCost);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to apply gradient");
      }

      setCurrentGradient(gradientColors);
      setCurrentColor(null);
      setTokenBalance(data.newBalance);
      // Refresh purchased colors and slots
      const refreshResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setPurchasedGradientColors(refreshData.purchased_gradient_colors || []);
        setPurchasedGradientSlots(refreshData.purchased_gradient_color_slots || 0);
      }
      toast.success("Username gradient applied successfully!");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error applying gradient:", error);
      toast.error(error.message || "Failed to apply gradient");
    } finally {
      setIsApplyingGradient(false);
    }
  };

  const handleApplyPurchasedGradient = async (gradient: string[]) => {
    if (!anonUserId) return;

    if (gradient.length < 2) {
      toast.error("Gradient must have at least 2 colors");
      return;
    }

    // Calculate cost: 500 for base gradient, 25 for each NEW slot beyond 3
    const baseCost = 500;
    const requiredSlots = Math.max(0, gradient.length - 3);
    const newSlotsNeeded = Math.max(0, requiredSlots - purchasedGradientSlots);
    const estimatedCost = baseCost + (newSlotsNeeded * 25);
    
    if (tokenBalance < estimatedCost) {
      const needed = estimatedCost - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(estimatedCost);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsApplyingGradient(true);
    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "gradient",
          gradientColors: gradient,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || estimatedCost - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(data.required || estimatedCost);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to apply gradient");
      }

      // Update state with the applied gradient
      setGradientColors(gradient);
      setCurrentGradient(gradient);
      setCurrentColor(null);
      setTokenBalance(data.newBalance);
      // Refresh purchased colors and slots
      const refreshResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setPurchasedGradientColors(refreshData.purchased_gradient_colors || []);
        setPurchasedGradientSlots(refreshData.purchased_gradient_color_slots || 0);
      }
      toast.success("Username gradient applied successfully!");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error applying gradient:", error);
      toast.error(error.message || "Failed to apply gradient");
    } finally {
      setIsApplyingGradient(false);
    }
  };

  const handleRemoveColor = async () => {
    if (!anonUserId) return;

    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "remove",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove color");
      }

      setCurrentColor(null);
      setCurrentGradient(null);
      toast.success("Username color removed");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error removing color:", error);
      toast.error(error.message || "Failed to remove color");
    }
  };

  const addGradientColor = async () => {
    // First 3 colors are free (2 base + 1 additional)
    // 4th, 5th, etc. cost 25 tokens each, but only if we don't have available slots
    const currentCount = gradientColors.length;
    const usedSlots = Math.max(0, currentCount - 3);
    const availableSlots = purchasedGradientSlots - usedSlots;
    
    if (currentCount < 3) {
      // Free to add up to 3 colors
      setGradientColors([...gradientColors, "#3357FF"]);
    } else if (availableSlots > 0) {
      // We have available purchased slots, use one for free
      setGradientColors([...gradientColors, "#3357FF"]);
      toast.success("Added color using purchased slot");
    } else {
      // Need to purchase a new slot
      const ADDITIONAL_COST = 25;
      
      if (tokenBalance < ADDITIONAL_COST) {
        const needed = ADDITIONAL_COST - tokenBalance;
        setTokensNeeded(needed);
        setRequiredTokens(ADDITIONAL_COST);
        setShowInsufficientTokensAlert(true);
        return;
      }

      // Deduct tokens and add color, then update slots via API
      try {
        // First deduct tokens
        const tokenResponse = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonUserId,
            amount: -ADDITIONAL_COST,
            reason: "Additional gradient color slot",
          }),
        });

        if (!tokenResponse.ok) {
          const data = await tokenResponse.json();
          if (data.error === "Insufficient tokens") {
            const needed = ADDITIONAL_COST - tokenBalance;
            setTokensNeeded(needed);
            setRequiredTokens(ADDITIONAL_COST);
            setShowInsufficientTokensAlert(true);
            return;
          }
          throw new Error(data.error || "Failed to deduct tokens");
        }

        const tokenData = await tokenResponse.json();
        setTokenBalance(tokenData.newBalance || tokenBalance - ADDITIONAL_COST);
        
        // Add the color
        const newGradientColors = [...gradientColors, "#3357FF"];
        setGradientColors(newGradientColors);
        
        // Update slots in database by applying the gradient (this will update slots)
        const updateResponse = await fetch("/api/users/username-color", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonUserId,
            colorType: "gradient",
            gradientColors: newGradientColors,
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          // Refresh slots
          const refreshResponse = await fetch(`/api/users/username-color?anonUserId=${anonUserId}`);
          const refreshData = await refreshResponse.json();
          if (refreshResponse.ok) {
            setPurchasedGradientSlots(refreshData.purchased_gradient_color_slots || 0);
          }
          toast.success(`Added color slot for ${ADDITIONAL_COST} tokens`);
        } else {
          // If update fails, we still added the color locally but slots weren't updated
          // This is okay, slots will be updated on next apply
          toast.success(`Added color for ${ADDITIONAL_COST} tokens`);
        }
      } catch (error: any) {
        console.error("Error adding gradient color:", error);
        toast.error(error.message || "Failed to add color");
      }
    }
  };

  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index));
    }
  };

  const handlePurchaseAnimatedGradient = async () => {
    if (!anonUserId) return;

    const ANIMATED_COST = 500;
    if (tokenBalance < ANIMATED_COST) {
      const needed = ANIMATED_COST - tokenBalance;
      setTokensNeeded(needed);
      setRequiredTokens(ANIMATED_COST);
      setShowInsufficientTokensAlert(true);
      return;
    }

    setIsPurchasingAnimated(true);
    try {
      const response = await fetch("/api/users/username-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonUserId,
          colorType: "purchase-animated-gradient",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Insufficient tokens") {
          const needed = data.tokensNeeded || ANIMATED_COST - tokenBalance;
          setTokensNeeded(needed);
          setRequiredTokens(ANIMATED_COST);
          setShowInsufficientTokensAlert(true);
          return;
        }
        throw new Error(data.error || "Failed to purchase animated gradient");
      }

      setAnimatedGradientEnabled(true);
      setTokenBalance(data.newBalance);
      toast.success("Animated gradient enabled! Your gradient colors will now move smoothly.");
      window.dispatchEvent(new CustomEvent("usernameColorUpdated"));
    } catch (error: any) {
      console.error("Error purchasing animated gradient:", error);
      toast.error(error.message || "Failed to purchase animated gradient");
    } finally {
      setIsPurchasingAnimated(false);
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors);
  };

  // Don't render until client-side hydration is complete
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1b23] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#5865f2] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Don't render if not logged in at all
  if (!clerkUser && !anonUserId) return null;

  // Only show for anonymous users
  if (clerkUser) {
    return (
      <div className="min-h-screen bg-[#1a1b23] py-8">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-[#b9bbbe] text-lg">
              Perks are currently only available for anonymous accounts.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Generate gradient CSS
  const getGradientStyle = (colors: string[], animated: boolean = false) => {
    if (colors.length === 2) {
      return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
    } else if (colors.length === 3) {
      return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
    } else {
      // For 4+ colors, create a longer gradient
      const gradientStops = colors.map((color, idx) => 
        `${color} ${(idx / (colors.length - 1)) * 100}%`
      ).join(", ");
      return `linear-gradient(90deg, ${gradientStops})`;
    }
  };

  // Generate animated gradient style
  const getAnimatedGradientStyle = (colors: string[]) => {
    // Create a longer gradient that can animate smoothly
    const extendedColors = [...colors, ...colors]; // Duplicate for seamless loop
    const gradientStops = extendedColors.map((color, idx) => 
      `${color} ${(idx / (extendedColors.length - 1)) * 100}%`
    ).join(", ");
    return `linear-gradient(90deg, ${gradientStops})`;
  };

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
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            Perks & Customization
          </h1>
          <p className="text-[#b9bbbe]">
            Customize your profile and unlock special features with tokens
          </p>
        </motion.div>

        {/* Token Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#b9bbbe] mb-1">Your Token Balance</p>
                <p className="text-2xl font-bold text-yellow-400">{tokenBalance} tokens</p>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Username Color Customization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 shadow-2xl mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#5865f2]/20 rounded-lg">
              <Palette className="w-5 h-5 text-[#5865f2]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#e4e6eb]">Username Color</h2>
              <p className="text-xs text-[#b9bbbe]">Make your username stand out</p>
            </div>
          </div>

          {/* Current Color Preview - Compact */}
          {(currentColor || currentGradient) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-[#1a1b23] rounded-lg border border-[#3d3f47] flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-[#b9bbbe] mb-1">Current Style:</p>
                <span
                  className={`text-base font-bold ${animatedGradientEnabled && currentGradient && currentGradient.length >= 2 ? 'animated-gradient' : ''}`}
                  style={{
                    color: currentColor || undefined,
                    backgroundImage: currentGradient 
                      ? (animatedGradientEnabled && currentGradient.length >= 2
                          ? getAnimatedGradientStyle(currentGradient)
                          : getGradientStyle(currentGradient))
                      : undefined,
                    backgroundSize: animatedGradientEnabled && currentGradient && currentGradient.length >= 2 ? '300% 300%' : '100% 100%',
                    WebkitBackgroundClip: currentGradient ? "text" : undefined,
                    WebkitTextFillColor: currentGradient ? "transparent" : undefined,
                    backgroundClip: currentGradient ? "text" : undefined,
                    animation: animatedGradientEnabled && currentGradient && currentGradient.length >= 2 ? 'gradientMove 8s ease-in-out infinite' : undefined,
                  }}
                >
                  {anonUsername || "Your Username"}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRemoveColor}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </motion.button>
            </motion.div>
          )}

          {/* Solid Color Option */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#5865f2]" />
                <h3 className="text-base font-semibold text-[#e4e6eb]">Solid Color</h3>
              </div>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                250 tokens
              </span>
            </div>

            {/* Preview - Compact */}
            <div className="mb-3 p-3 bg-[#1a1b23] rounded-lg border border-[#3d3f47]">
              <span
                className="text-lg font-bold"
                style={{ color: selectedSolidColor }}
              >
                {anonUsername || "Your Username"}
              </span>
            </div>

            {/* Preset Colors - Compact grid */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setSelectedSolidColor(color);
                      setCustomSolidColor(color);
                    }}
                    className={`w-[30px] h-[30px] rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSolidColor === color
                        ? "border-white shadow-md shadow-white/40"
                        : "border-[#3d3f47] hover:border-[#5865f2]"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Purchased Colors Button */}
            {purchasedSolidColors.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setPurchasedModalType("solid");
                  setShowPurchasedColorsModal(true);
                }}
                className="mb-3 w-auto px-3 py-2 bg-[#2d2f36] hover:bg-[#3d3f47] text-[#e4e6eb] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                <span>Purchased Colors ({purchasedSolidColors.length})</span>
              </motion.button>
            )}

            {/* Custom Color Picker - Compact */}
            <div className="mb-3 flex items-center gap-2">
              <ColorPickerPopover
                color={customSolidColor}
                onChange={(newColor) => {
                  setCustomSolidColor(newColor);
                  setSelectedSolidColor(newColor);
                }}
                isOpen={isSolidColorPickerOpen}
                onOpen={() => setIsSolidColorPickerOpen(true)}
                onClose={() => setIsSolidColorPickerOpen(false)}
              />
              <input
                type="text"
                value={customSolidColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setCustomSolidColor(value);
                    if (value.length === 7) {
                      setSelectedSolidColor(value);
                    }
                  }
                }}
                placeholder="#FF5733"
                className="flex-1 px-3 py-2 bg-[#1a1b23] border border-[#3d3f47] rounded-lg text-[#e4e6eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              />
            </div>

            {/* Apply Button - Small */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApplySolidColor}
              disabled={isApplyingSolid || selectedSolidColor === currentColor}
              className="w-auto px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isApplyingSolid ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply (250 tokens)</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-[#3d3f47]" />

          {/* Gradient Color Option */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#5865f2]" />
                <h3 className="text-base font-semibold text-[#e4e6eb]">Gradient Color</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                  {(() => {
                    const usedSlots = Math.max(0, gradientColors.length - 3);
                    const availableSlots = purchasedGradientSlots - usedSlots;
                    const newSlotsNeeded = Math.max(0, usedSlots - purchasedGradientSlots);
                    if (gradientColors.length <= 3) {
                      return "500 tokens";
                    } else if (newSlotsNeeded === 0) {
                      return "500 tokens (slots owned)";
                    } else {
                      return `${500 + newSlotsNeeded * 25} tokens`;
                    }
                  })()}
                </span>
                {gradientColors.length > 3 && (
                  <span className="text-xs text-[#b9bbbe]">
                    ({purchasedGradientSlots} slots owned)
                  </span>
                )}
              </div>
            </div>

            {/* Preview - Compact */}
            <div className="mb-3 p-3 bg-[#1a1b23] rounded-lg border border-[#3d3f47]">
              <span
                className={`text-lg font-bold ${animatedGradientEnabled && gradientColors.length >= 2 ? 'animated-gradient' : ''}`}
                style={{
                  backgroundImage: animatedGradientEnabled && gradientColors.length >= 2
                    ? getAnimatedGradientStyle(gradientColors)
                    : getGradientStyle(gradientColors),
                  backgroundSize: animatedGradientEnabled && gradientColors.length >= 2 ? '300% 300%' : '100% 100%',
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: animatedGradientEnabled && gradientColors.length >= 2 ? 'gradientMove 8s ease-in-out infinite' : undefined,
                }}
              >
                {anonUsername || "Your Username"}
              </span>
            </div>

            {/* Purchased Gradients Button */}
            {purchasedGradientColors.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setPurchasedModalType("gradient");
                  setShowPurchasedColorsModal(true);
                }}
                className="mb-3 w-auto px-3 py-2 bg-[#2d2f36] hover:bg-[#3d3f47] text-[#e4e6eb] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Purchased Gradients ({purchasedGradientColors.length})</span>
              </motion.button>
            )}

            {/* Gradient Color Pickers - Compact */}
            <div className="mb-3 space-y-2">
              {gradientColors.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-shrink-0">
                    <ColorPickerPopover
                      color={color}
                      onChange={(newColor) => updateGradientColor(index, newColor)}
                      isOpen={openGradientPickerIndex === index}
                      onOpen={() => setOpenGradientPickerIndex(index)}
                      onClose={() => setOpenGradientPickerIndex(null)}
                      size="small"
                    />
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        updateGradientColor(index, value);
                      }
                    }}
                    placeholder="#FF5733"
                    className="flex-1 px-3 py-2 bg-[#1a1b23] border border-[#3d3f47] rounded-lg text-[#e4e6eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  />
                  {gradientColors.length > 2 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeGradientColor(index)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Add Color and Apply Buttons - Flex Layout */}
            <div className="mb-3 flex items-center gap-2">
              {gradientColors.length < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addGradientColor}
                  className="w-auto px-3 py-2 bg-[#2d2f36] hover:bg-[#3d3f47] text-[#e4e6eb] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  <span>Add Third Color</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addGradientColor}
                  className="w-auto px-3 py-2 bg-[#2d2f36] hover:bg-[#3d3f47] text-[#e4e6eb] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span>
                  <span>
                    {(() => {
                      const usedSlots = Math.max(0, gradientColors.length - 3);
                      const availableSlots = purchasedGradientSlots - usedSlots;
                      return availableSlots > 0 ? "Add Color (free slot)" : "Add Color (25 tokens)";
                    })()}
                  </span>
                </motion.button>
              )}

              {/* Apply Button - Small */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyGradient}
                disabled={isApplyingGradient || JSON.stringify(gradientColors) === JSON.stringify(currentGradient)}
                className="w-auto px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
              {isApplyingGradient ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply (500 tokens)</span>
                </>
              )}
              </motion.button>
            </div>

            {/* Animated Gradient Feature */}
            {gradientColors.length >= 2 && (
              <div className="mt-6 pt-6 border-t border-[#3d3f47]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-semibold text-[#e4e6eb]">Animated Gradient</h3>
                  </div>
                  {animatedGradientEnabled ? (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                      Enabled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                      500 tokens
                    </span>
                  )}
                </div>

                {animatedGradientEnabled ? (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400">
                      ✨ Your gradient colors will move smoothly across your username!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#b9bbbe] mb-3">
                      Make your gradient colors move smoothly across your username. One-time purchase, permanent feature.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePurchaseAnimatedGradient}
                      disabled={isPurchasingAnimated}
                      className="w-auto px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isPurchasingAnimated ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full"
                          />
                          <span>Purchasing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Purchase Animated Gradient (500 tokens)</span>
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Future Features Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#2d2f36] to-[#1a1b23] rounded-2xl p-6 xl:p-8 border border-[#3d3f47]/50 shadow-2xl"
        >
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#e4e6eb] mb-2">More Perks Coming Soon!</h3>
            <p className="text-[#b9bbbe]">
              Stay tuned for exciting new customization features
            </p>
          </div>
        </motion.div>
      </div>

      {/* Insufficient Tokens Alert */}
      <InsufficientTokensAlert
        isOpen={showInsufficientTokensAlert}
        onClose={() => setShowInsufficientTokensAlert(false)}
        tokensNeeded={tokensNeeded}
        currentBalance={tokenBalance}
        required={requiredTokens}
      />

      {/* Purchased Colors Modal */}
      <PurchasedColorsModal
        isOpen={showPurchasedColorsModal}
        onClose={() => setShowPurchasedColorsModal(false)}
        purchasedSolidColors={purchasedSolidColors}
        purchasedGradientColors={purchasedGradientColors}
        onSelectSolidColor={(color) => {
          setSelectedSolidColor(color);
          setCustomSolidColor(color);
        }}
        onSelectGradient={(gradient) => {
          setGradientColors(gradient);
        }}
        onApplySolidColor={purchasedModalType === "solid" ? handleApplyPurchasedSolidColor : undefined}
        onApplyGradient={purchasedModalType === "gradient" ? handleApplyPurchasedGradient : undefined}
        type={purchasedModalType}
      />
    </div>
  );
}

