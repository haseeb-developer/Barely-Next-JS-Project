"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/app/lib/supabase/client";
import {
  generateAnonUserId,
  setAnonUserId,
  getAnonUserId,
  getAnonUserEmail,
  setAnonUserEmail,
  getAnonUsername,
  setAnonUsername,
  clearAnonUser,
  setRememberMe,
  getRememberMe,
  getRememberedUsername,
  setRememberedPassword,
  getRememberedPassword,
  clearRememberedPassword,
} from "@/app/lib/anon-auth";
import { getUserIP, isIPBanned, banIPAddress } from "@/app/lib/ip-utils";
import { LogIn, UserPlus, Lock, ArrowLeft, User, Eye, EyeOff, AlertTriangle, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// Strong password validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(50, "Password must be less than 50 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Username validation (min 3, max 12 characters, alphanumeric and underscore only)
// Usernames are normalized to lowercase for global uniqueness (like Roblox)
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(12, "Username must be 12 characters or less")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .regex(/^[a-zA-Z]/, "Username must start with a letter")
  .transform((val) => val.toLowerCase().trim()); // Normalize to lowercase for global uniqueness

// Manual list of prohibited words (case-insensitive)
const PROHIBITED_WORDS = [
  'sex', 'sexx', 'sexxx', 'sexxxx', 'sexs', 'sexxs', '8itch',
  'bitches', 'bitchesss', 'bitch', 'btch', 'butch', '8ltch', 'p00or',
  'suckmydck', 'dck', 'dick', 'd1ck', 'd1c', 'dik',
  'boobs', 'boob', 'b00bs', 'b00b', 'bo0bs',
  'tits', 'tit', 't1ts', 't1t', 'titties',
  'fuck', 'fck', 'fuk', 'fuc', 'f*ck',
  'ass', 'asshole', 'a$$', 'a55',
  'porn', 'p0rn', 'pr0n',
  'cum', 'c*m', 'c0m',
  'cock', 'c0ck', 'cok',
  'pussy', 'puss', 'p*ssy',
  'slut', 'sl*t', 's1ut',
  'whore', 'wh0re', 'wh*re',
  'nude', 'nud3', 'n*de',
  'naked', 'nak3d', 'n*k*d',
];

// Normalize username to detect obfuscation
const normalizeUsername = (username: string): string => {
  return username
    .toLowerCase()
    // Replace common obfuscation characters with letters
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    // Remove special characters and numbers
    .replace(/[^a-z]/g, '')
    // Remove repeated characters (e.g., "sexxx" -> "sex")
    .replace(/(.)\1{2,}/g, '$1$1');
};

// Check if username contains prohibited words
const containsProhibitedWord = (username: string): boolean => {
  const normalized = normalizeUsername(username);
  const lowerUsername = username.toLowerCase();
  
  // Check against prohibited words list
  for (const word of PROHIBITED_WORDS) {
    const normalizedWord = normalizeUsername(word);
    const lowerWord = word.toLowerCase();
    
    // Check 1: Normalized username contains normalized prohibited word (catches obfuscation)
    if (normalized.includes(normalizedWord) || normalizedWord.includes(normalized)) {
      return true;
    }
    
    // Check 2: Original username contains prohibited word (case-insensitive)
    if (lowerUsername.includes(lowerWord) || lowerWord.includes(lowerUsername)) {
      return true;
    }
    
    // Check 3: Check if any substring of normalized username matches prohibited word
    // This catches cases like "boobs123" or "123boobs"
    for (let i = 0; i <= normalized.length - normalizedWord.length; i++) {
      const substring = normalized.substring(i, i + normalizedWord.length);
      if (substring === normalizedWord) {
        return true;
      }
    }
    
    // Check 4: Check if username is too similar (fuzzy match for short usernames)
    if (normalized.length <= normalizedWord.length + 2) {
      // Check if they share significant characters
      const similarity = calculateSimilarity(normalized, normalizedWord);
      if (similarity > 0.7) {
        return true;
      }
    }
  }
  
  return false;
};

// Calculate similarity between two strings (simple Levenshtein-like)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Simple Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Profanity check function with multiple layers
const checkProfanity = async (username: string): Promise<boolean> => {
  // Layer 1: Manual prohibited words check (fastest)
  if (containsProhibitedWord(username)) {
    return false; // Contains profanity
  }
  
  // Layer 2: API check
  try {
    const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(username)}`);
    if (response.ok) {
      const isProfane = await response.json();
      if (isProfane) {
        return false; // Contains profanity
      }
    }
  } catch {
    // Continue to next layer if API fails
  }
  
  // Layer 3: Check normalized version with API
  try {
    const normalized = normalizeUsername(username);
    if (normalized !== username.toLowerCase()) {
      const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(normalized)}`);
      if (response.ok) {
        const isProfane = await response.json();
        if (isProfane) {
          return false; // Contains profanity
        }
      }
    }
  } catch {
    // Continue to next layer if API fails
  }
  
  // Layer 4: bad-words library check
  try {
    const { Filter } = await import("bad-words");
    const filter = new Filter();
    if (filter.isProfane(username)) {
      return false; // Contains profanity
    }
    
    // Also check normalized version
    const normalized = normalizeUsername(username);
    if (normalized !== username.toLowerCase() && filter.isProfane(normalized)) {
      return false; // Contains profanity
    }
  } catch {
    // Continue if library fails
  }
  
  // Layer 5: Check for character substitution patterns
  const normalized = normalizeUsername(username);
  if (containsProhibitedWord(normalized)) {
    return false; // Contains profanity
  }
  
  return true; // Username is clean
};

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const signUpSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .superRefine(async (data, ctx) => {
    // Check for profanity in username
    const isClean = await checkProfanity(data.username);
    if (!isClean) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Username contains inappropriate language. Please choose another.",
        path: ["username"],
      });
    }
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function AnonAccountPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [existingUser, setExistingUser] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check IP ban on mount
  useEffect(() => {
    const checkBan = async () => {
      const ip = await getUserIP();
      if (ip) {
        const banStatus = await isIPBanned(ip);
        if (banStatus.banned) {
          setIsBanned(true);
          setBanReason(banStatus.reason || "Violation of Terms of Service");
        }
      }
    };
    checkBan();
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  // Watch username field for real-time validation
  const watchedUsername = signUpForm.watch("username");
  // Watch password field for real-time validation
  const watchedPassword = signUpForm.watch("password");

  // Check password requirements in real-time
  const passwordRequirements = {
    minLength: watchedPassword ? watchedPassword.length >= 8 : false,
    hasUppercase: watchedPassword ? /[A-Z]/.test(watchedPassword) : false,
    hasLowercase: watchedPassword ? /[a-z]/.test(watchedPassword) : false,
    hasNumber: watchedPassword ? /[0-9]/.test(watchedPassword) : false,
    hasSpecial: watchedPassword ? /[^a-zA-Z0-9]/.test(watchedPassword) : false,
  };

  // Real-time username availability check with debouncing
  useEffect(() => {
    // Only check in signup mode
    if (mode !== "signup") {
      return;
    }

    const username = watchedUsername;
    
    // Reset state if username is empty or too short
    if (!username || username.trim().length < 3) {
      setUsernameTaken(false);
      setIsCheckingUsername(false);
      signUpForm.clearErrors("username");
      return;
    }

    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();

    // Only check if username meets basic requirements
    if (!/^[a-zA-Z]/.test(username) || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameTaken(false);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    
    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const exists = await checkUserExists(normalizedUsername);
        setUsernameTaken(exists);
        
        // Set form error if username is taken
        if (exists) {
          signUpForm.setError("username", {
            type: "manual",
            message: "This username is already taken. Please choose another.",
          });
        } else {
          // Clear error if username is available
          signUpForm.clearErrors("username");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // 500ms debounce

    // Cleanup function to clear timeout
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedUsername, mode]);

  // Password generator function
  // Generates a strong password (12-20 characters) that meets all requirements
  const generatePassword = (): string => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    // Ensure at least one of each required character type
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)]; // At least 1 lowercase
    password += uppercase[Math.floor(Math.random() * uppercase.length)]; // At least 1 uppercase
    password += numbers[Math.floor(Math.random() * numbers.length)]; // At least 1 number
    password += special[Math.floor(Math.random() * special.length)]; // At least 1 special
    
    // Fill the rest randomly (total length: 12-20 characters for strong password)
    // We already have 4 characters, so add 8-16 more to get 12-20 total
    const allChars = lowercase + uppercase + numbers + special;
    const remainingLength = 8 + Math.floor(Math.random() * 9); // 8-16 more characters
    
    for (let i = 0; i < remainingLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize character positions
    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join("");
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    signUpForm.setValue("password", newPassword);
    signUpForm.setValue("confirmPassword", newPassword);
    // Trigger validation to show that password meets requirements
    signUpForm.trigger(["password", "confirmPassword"]);
    toast.success("Strong password generated!");
  };

  useEffect(() => {
    // Check if user already has an account
    const userId = getAnonUserId();
    const username = getAnonUsername();
    
    if (userId && username) {
      // Check if user exists in Supabase
      // Username in localStorage has "anon-" prefix, but checkUserExists expects username without prefix
      const usernameWithoutPrefix = username.startsWith("anon-") 
        ? username.substring(5) 
        : username;
      checkUserExists(usernameWithoutPrefix).then((exists) => {
        if (exists) {
          setExistingUser(true);
          setMode("login");
        }
      });
    }

    // Check if "Remember Me" was enabled and auto-fill username and password
    if (getRememberMe()) {
      const rememberedUsername = getRememberedUsername();
      const rememberedPassword = getRememberedPassword();
      if (rememberedUsername) {
        setRememberMeState(true);
        // Strip "anon-" prefix when auto-filling login form (user should see just the username part)
        const usernameWithoutPrefix = rememberedUsername.startsWith("anon-") 
          ? rememberedUsername.substring(5) 
          : rememberedUsername;
        loginForm.setValue("username", usernameWithoutPrefix);
      }
      if (rememberedPassword) {
        loginForm.setValue("password", rememberedPassword);
      }
    }
  }, []);

  const checkUserExists = async (username: string): Promise<boolean> => {
    try {
      // Add "anon-" prefix when checking for anonymous usernames
      const normalizedUsername = username.toLowerCase().trim();
      const usernameWithPrefix = `anon-${normalizedUsername}`;
      const { data, error } = await supabase
        .from("anon_users")
        .select("id")
        .eq("username", usernameWithPrefix) // Check with "anon-" prefix
        .maybeSingle();
      
      // maybeSingle() returns null data and null error when no rows found
      return !error && data !== null;
    } catch {
      return false;
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    // Clear any previous errors
    loginForm.clearErrors();
    
    try {
      // Check IP ban first
      const ip = await getUserIP();
      if (ip) {
        const banStatus = await isIPBanned(ip);
        if (banStatus.banned) {
          toast.error(`Access denied: ${banStatus.reason || "Your IP has been permanently banned."}`);
          setIsBanned(true);
          setBanReason(banStatus.reason || "Violation of Terms of Service");
          setIsLoading(false);
          return;
        }
      }

      // Normalize username to lowercase and add "anon-" prefix for lookup
      const normalizedUsername = data.username.toLowerCase().trim();
      const usernameWithPrefix = `anon-${normalizedUsername}`;

      // Check if user exists by username (usernames are stored with "anon-" prefix)
      const { data: userData, error: fetchError } = await supabase
        .from("anon_users")
        .select("*")
        .eq("username", usernameWithPrefix) // Lookup with prefix
        .maybeSingle();

      // Handle query errors
      if (fetchError) {
        // Log the error for debugging
        console.error("Login error:", {
          code: fetchError.code,
          message: fetchError.message,
        });
        toast.error("An error occurred. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if username exists
      if (!userData) {
        const errorMessage = "Account with this username doesn't exist. Please check your username or sign up.";
        loginForm.setError("username", {
          type: "manual",
          message: errorMessage,
        });
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Verify password (in production, use proper hashing)
      if (userData.password !== data.password) {
        const errorMessage = "Incorrect password. Please check your password and try again.";
        loginForm.setError("password", {
          type: "manual",
          message: errorMessage,
        });
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Update IP address if changed
      if (ip && userData.ip_address !== ip) {
        await supabase
          .from("anon_users")
          .update({ ip_address: ip })
          .eq("id", userData.id);
      }

      // Set user in localStorage (email is optional)
      setAnonUserId(userData.id);
      if (userData.email) {
        setAnonUserEmail(userData.email);
      }
      setAnonUsername(userData.username); // Username already includes "anon-" prefix

      // Handle "Remember Me" - keep session active and store password
      if (data.rememberMe ?? false) {
        setRememberMe(true);
        setRememberedPassword(data.password); // Store password for auto-fill
      } else {
        setRememberMe(false);
        clearRememberedPassword(); // Clear password if not remembering
      }

      toast.success("Logged in successfully!");
      router.push("/home");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Check IP ban first
      const ip = await getUserIP();
      if (ip) {
        const banStatus = await isIPBanned(ip);
        if (banStatus.banned) {
          toast.error(`Access denied: ${banStatus.reason || "Your IP has been permanently banned."}`);
          setIsBanned(true);
          setBanReason(banStatus.reason || "Violation of Terms of Service");
          return;
        }
      }

      // Final profanity check before signup (double-check)
      const isClean = await checkProfanity(data.username);
      if (!isClean) {
        // Ban IP for attempting to use profane username
        if (ip) {
          await banIPAddress(ip, "Attempted to create account with inappropriate username");
        }
        toast.error("Username contains inappropriate language. Your IP has been permanently banned.");
        setIsBanned(true);
        setBanReason("Attempted to create account with inappropriate username");
        return;
      }

      // Normalize username to lowercase and add "anon-" prefix
      const normalizedUsername = data.username.toLowerCase().trim();
      const usernameWithPrefix = `anon-${normalizedUsername}`;

      // Check if username already exists (we store usernames with "anon-" prefix in lowercase)
      const { data: existingUsername, error: checkError } = await supabase
        .from("anon_users")
        .select("id")
        .eq("username", usernameWithPrefix) // Check with prefix
        .maybeSingle();

      // maybeSingle() returns { data: null, error: null } when no rows found (which is good)
      // Only log errors that are actual problems (not expected "no rows found")
      // Ignore errors if we got data back (means query succeeded)
      if (checkError && !existingUsername) {
        // Only log if it's a real error (not a 400 from invalid query syntax)
        // 400 errors might be from old cached code trying to use .ilike()
        if (checkError.code && checkError.code !== "PGRST116" && !checkError.message?.includes("ilike")) {
          console.error("Error checking username:", {
            code: checkError.code,
            message: checkError.message,
          });
        }
        // Continue anyway - the database unique constraint will catch duplicates
      }

      // If username exists, block signup
      if (existingUsername) {
        toast.error("Username already taken. Please choose another.");
        setIsLoading(false);
        return;
      }

      // Generate user ID
      const userId = generateAnonUserId();

      // Create user in Supabase with IP address (no email required)
      // Store username with "anon-" prefix in lowercase to ensure global uniqueness
      const { error } = await supabase
        .from("anon_users")
        .insert({
          id: userId,
          username: usernameWithPrefix, // Store with "anon-" prefix in lowercase
          email: null, // Email is optional for anonymous accounts
          password: data.password, // In production, hash this!
          ip_address: ip || null,
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation (username) - this should never happen due to our checks above
          // But handle it just in case
          toast.error("Username already taken globally. Please choose another.");
        } else if (error.message?.includes("username") || error.message?.includes("unique")) {
          toast.error("Username already taken. Please choose another.");
        } else {
          console.error("Signup error:", error);
          toast.error("Failed to create account. Please try again.");
        }
        return;
      }

      // Set user in localStorage (no email needed)
      // Store the original username (with case) for display, but database has lowercase
      setAnonUserId(userId);
      setAnonUsername(usernameWithPrefix); // Store username with "anon-" prefix
      
      // Handle "Remember Me" - keep session active and store password (default to true on signup)
      setRememberMe(true);
      setRememberedPassword(data.password); // Store password for auto-fill

      toast.success("Account created successfully!");
      router.push("/home");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b23] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-full max-w-2xl"
      >
        {/* Back Button */}
                <Link href="/home">
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="mb-6 flex items-center gap-2 text-[#e4e6eb] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        </Link>

        {/* IP Ban Message */}
        {isBanned && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="mb-6 bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-400 mb-2">Access Denied - IP Permanently Banned</h3>
                <p className="text-red-300/90 mb-2">
                  Your IP address has been permanently banned from this platform.
                </p>
                {banReason && (
                  <p className="text-red-300/80 text-sm mb-3">
                    <strong>Reason:</strong> {banReason}
                  </p>
                )}
                <p className="text-red-300/90 text-sm">
                  This ban is permanent and cannot be appealed. Please review our{" "}
                  <Link href="/terms" className="underline hover:text-red-200">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-red-200">
                    Privacy Policy
                  </Link>{" "}
                  for more information.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Information Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-[#2d2f36]/50 border border-[#5865f2]/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-[#e4e6eb] mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#5865f2]" />
            About Anonymous Accounts
          </h3>
          <div className="space-y-3 text-sm text-[#b9bbbe]">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#5865f2] mt-1.5 flex-shrink-0" />
                      <p>
                        <span className="text-[#e4e6eb] font-medium">Anonymous accounts</span> are simple accounts that only require a username and password.
                        No email needed! Perfect for quick access without committing to a full account.
                      </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#5865f2] mt-1.5 flex-shrink-0" />
              <p>
                <span className="text-[#e4e6eb] font-medium">Clerk accounts</span> offer full features, email verification, password recovery, 
                and secure authentication with industry-standard security.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#5865f2] mt-1.5 flex-shrink-0" />
              <p>
                Your anonymous account data is stored securely and persists across sessions. 
                You can log out and log back in anytime with your username and password.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <div className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-[#e4e6eb] mb-2"
            >
              Anonymous Account
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[#b9bbbe] text-sm"
            >
              {mode === "login" ? "Welcome back!" : "Create your anonymous account"}
            </motion.p>
          </div>

          {/* Mode Toggle */}
          {!existingUser && (
            <div className="flex gap-2 mb-6 bg-[#2d2f36]/50 p-1 rounded-lg">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  mode === "signup"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#b9bbbe] hover:text-[#e4e6eb]"
                }`}
              >
                Sign Up
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("login")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  mode === "login"
                    ? "bg-[#5865f2] text-white"
                    : "text-[#b9bbbe] hover:text-[#e4e6eb]"
                }`}
              >
                Login
              </motion.button>
            </div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isBanned ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-4"
                style={{ pointerEvents: isBanned ? "none" : "auto" }}
              >
                <div>
                  <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                    Username <span className="text-[#b9bbbe] text-xs">(without "anon-" prefix)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b9bbbe]" />
                    <input
                      {...loginForm.register("username")}
                      type="text"
                      maxLength={12}
                      className="w-full pl-10 pr-4 py-3 bg-[#2d2f36] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                      placeholder="your_username"
                    />
                  </div>
                  {loginForm.formState.errors.username && (
                    <p className="mt-1 text-sm text-red-400">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b9bbbe]" />
                    <input
                      {...loginForm.register("password")}
                      type={showLoginPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 bg-[#2d2f36] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#b9bbbe] hover:text-[#e4e6eb] transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-400">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex items-center"
                  >
                    <input
                      {...loginForm.register("rememberMe")}
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => {
                        setRememberMeState(e.target.checked);
                        loginForm.setValue("rememberMe", e.target.checked);
                      }}
                      className="sr-only"
                    />
                    <label
                      htmlFor="rememberMe"
                      className={`flex items-center gap-2 cursor-pointer select-none ${
                        rememberMe ? "text-[#5865f2]" : "text-[#b9bbbe]"
                      } transition-colors`}
                    >
                      <motion.div
                        animate={{
                          backgroundColor: rememberMe ? "#5865f2" : "transparent",
                          borderColor: rememberMe ? "#5865f2" : "#2d2f36",
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          rememberMe ? "border-[#5865f2]" : "border-[#2d2f36]"
                        }`}
                      >
                        {rememberMe && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      <span className="text-sm">Remember me</span>
                    </label>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  {isLoading ? "Logging in..." : "Login"}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isBanned ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={signUpForm.handleSubmit(handleSignUp)}
                className="space-y-4"
                style={{ pointerEvents: isBanned ? "none" : "auto" }}
              >
                <div>
                  <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                    Username <span className="text-[#b9bbbe] text-xs">(3-12 characters)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b9bbbe]" />
                    <input
                      {...signUpForm.register("username")}
                      type="text"
                      maxLength={12}
                      className={`w-full pl-10 pr-12 py-3 bg-[#2d2f36] border rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 transition-colors ${
                        usernameTaken
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : signUpForm.formState.errors.username
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-[#2d2f36] focus:ring-[#5865f2] focus:border-transparent"
                      }`}
                      placeholder="your_username"
                    />
                    {/* Loading/Status indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCheckingUsername ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-[#5865f2] border-t-transparent rounded-full"
                        />
                      ) : usernameTaken ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-red-500"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      ) : watchedUsername && watchedUsername.trim().length >= 3 && !signUpForm.formState.errors.username ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-500"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                  {signUpForm.formState.errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-400"
                    >
                      {signUpForm.formState.errors.username.message}
                    </motion.p>
                  )}
                  {!signUpForm.formState.errors.username && watchedUsername && watchedUsername.trim().length >= 3 && !usernameTaken && !isCheckingUsername && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-green-400"
                    >
                      ✓ Username is available!
                    </motion.p>
                  )}
                  <p className="mt-1 text-xs text-[#b9bbbe]">
                    Minimum 3 characters. Letters, numbers, and underscores only. Must start with a letter.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#e4e6eb]">
                      Password
                    </label>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGeneratePassword}
                      className="flex items-center gap-1.5 text-xs text-[#5865f2] hover:text-[#4752c4] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate
                    </motion.button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b9bbbe]" />
                    <input
                      {...signUpForm.register("password")}
                      type={showSignUpPassword ? "text" : "password"}
                      className="w-full pl-10 pr-24 py-3 bg-[#2d2f36] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleGeneratePassword}
                        className="text-[#5865f2] hover:text-[#4752c4] transition-colors p-1 cursor-pointer"
                        title="Generate password"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="text-[#b9bbbe] hover:text-[#e4e6eb] transition-colors"
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-400">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                  <div className="mt-2 text-xs space-y-1.5">
                    <p className="text-[#b9bbbe] mb-2">Password must contain:</p>
                    <div className="space-y-1.5">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                      >
                        {passwordRequirements.minLength ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#5865f2]"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={passwordRequirements.minLength ? "text-[#5865f2]" : "text-[#b9bbbe]"}>
                          At least 8 characters
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                        className="flex items-center gap-2"
                      >
                        {passwordRequirements.hasUppercase ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#5865f2]"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={passwordRequirements.hasUppercase ? "text-[#5865f2]" : "text-[#b9bbbe]"}>
                          One uppercase letter
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2"
                      >
                        {passwordRequirements.hasLowercase ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#5865f2]"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={passwordRequirements.hasLowercase ? "text-[#5865f2]" : "text-[#b9bbbe]"}>
                          One lowercase letter
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        {passwordRequirements.hasNumber ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#5865f2]"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={passwordRequirements.hasNumber ? "text-[#5865f2]" : "text-[#b9bbbe]"}>
                          One number
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        {passwordRequirements.hasSpecial ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#5865f2]"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={passwordRequirements.hasSpecial ? "text-[#5865f2]" : "text-[#b9bbbe]"}>
                          One special character
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#e4e6eb] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b9bbbe]" />
                    <input
                      {...signUpForm.register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 bg-[#2d2f36] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder-[#b9bbbe] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#b9bbbe] hover:text-[#e4e6eb] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox for Signup */}
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex items-center"
                  >
                    <input
                      type="checkbox"
                      id="rememberMeSignup"
                      checked={rememberMe}
                      onChange={(e) => {
                        setRememberMeState(e.target.checked);
                      }}
                      className="sr-only"
                    />
                    <label
                      htmlFor="rememberMeSignup"
                      className={`flex items-center gap-2 cursor-pointer select-none ${
                        rememberMe ? "text-[#5865f2]" : "text-[#b9bbbe]"
                      } transition-colors`}
                    >
                      <motion.div
                        animate={{
                          backgroundColor: rememberMe ? "#5865f2" : "transparent",
                          borderColor: rememberMe ? "#5865f2" : "#2d2f36",
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          rememberMe ? "border-[#5865f2]" : "border-[#2d2f36]"
                        }`}
                      >
                        {rememberMe && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      <span className="text-sm">Remember me (keep me logged in)</span>
                    </label>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={usernameTaken ? {} : { scale: 1.02 }}
                  whileTap={usernameTaken ? {} : { scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isBanned || usernameTaken || isCheckingUsername}
                  className="w-full py-3 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#5865f2] text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-5 h-5" />
                  {isLoading ? "Creating account..." : usernameTaken ? "Username Already Taken" : isCheckingUsername ? "Checking..." : "Sign Up"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

