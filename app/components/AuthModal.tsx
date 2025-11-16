"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as RadixDialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useSupabase } from "../lib/supabase/provider";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { supabase } = useSupabase();
  const router = useRouter();

  // Update mode when initialMode changes (when modal is opened with different mode)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Reset errors and form states when modal opens
      setLoginError(null);
      setSignUpError(null);
      setPendingEmail(null);
      setShowLoginPassword(false);
      setShowSignUpPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialMode]);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
    setValue: setLoginValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
    reset: resetSignUp,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Provide more user-friendly error messages
        let errorMessage = "Failed to sign in";
        const errorMsg = error.message.toLowerCase();
        
        // Check for email not confirmed first
        if (errorMsg.includes("email not confirmed") || 
            errorMsg.includes("not confirmed") ||
            errorMsg.includes("email_not_confirmed")) {
          errorMessage = "Please verify your email before signing in. Check your inbox for the verification link.";
          setPendingEmail(data.email); // Store email for resend option
        } 
        // Check for invalid credentials - this could mean user doesn't exist OR wrong password
        // Supabase returns same error for both for security reasons
        else if (errorMsg.includes("invalid login credentials") || 
                 errorMsg.includes("invalid") ||
                 error.status === 400) {
          // Show message suggesting to create account first
          errorMessage = "Invalid email or password. If you don't have an account, please create one first.";
        } 
        // Check if explicitly says user doesn't exist
        else if (errorMsg.includes("user not found") || 
                 errorMsg.includes("does not exist") ||
                 errorMsg.includes("no user found") ||
                 errorMsg.includes("user_not_found")) {
          errorMessage = "First create an account. This email is not registered.";
        } 
        else {
          errorMessage = error.message || "Failed to sign in";
        }
        
        setLoginError(errorMessage);
        toast.error(errorMessage);
        console.error("Login error:", error);
        return;
      }

      if (authData.user) {
        toast.success("Welcome back! 🎉");
        resetLogin();
        setLoginError(null);
        onClose();
        router.refresh();
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      const errorMsg = error?.message || "An unexpected error occurred. Please try again.";
      setLoginError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setSignUpError(null);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // Auto confirm user - this bypasses email verification if enabled in Supabase settings
        },
      });

      if (error) {
        let errorMessage = "Failed to create account";
        
        // Check if email is already registered
        const errorMsgLower = error.message.toLowerCase();
        const errorCode = error.status || error.code;
        
        // Check for duplicate email errors
        if (errorMsgLower.includes("already registered") || 
            errorMsgLower.includes("already exists") ||
            errorMsgLower.includes("user already registered") ||
            errorMsgLower.includes("email address is already registered") ||
            errorMsgLower.includes("user_exists") ||
            errorMsgLower.includes("email_already_registered") ||
            errorCode === 422 || // Supabase returns 422 for duplicate emails
            errorMsgLower.includes("duplicate")) {
          errorMessage = "This email is already registered. Please sign in instead.";
          setSignUpError(errorMessage);
          toast.error(errorMessage);
          // Switch to login mode immediately and pre-fill email
          setMode("login");
          setTimeout(() => {
            setLoginValue("email", data.email);
          }, 100);
          console.error("Sign up error:", error);
          return;
        } else if (error.message.includes("Password")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message || "Failed to create account";
        }
        
        setSignUpError(errorMessage);
        toast.error(errorMessage);
        console.error("Sign up error:", error);
        return;
      }
      
      if (authData.user) {
        // Always switch to login mode after successful signup
        // User needs to manually sign in
        toast.success("Account created successfully! Please sign in.");
        resetSignUp();
        setSignUpError(null);
        
        // Switch to login mode
        setMode("login");
        
        // Pre-fill the login form email using react-hook-form setValue
        setTimeout(() => {
          setLoginValue("email", data.email);
        }, 100);
      }
    } catch (error: any) {
      console.error("Sign up exception:", error);
      const errorMsg = error?.message || "An unexpected error occurred. Please try again.";
      setSignUpError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === "login" ? "signup" : "login");
    setLoginError(null);
    setSignUpError(null);
    setPendingEmail(null);
    setShowLoginPassword(false);
    setShowSignUpPassword(false);
    setShowConfirmPassword(false);
    resetLogin();
    resetSignUp();
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setIsResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setPendingEmail(null);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend verification email");
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#232428] rounded-2xl shadow-2xl border border-[#2d2f36] z-50 focus:outline-none p-6">
          <div className="flex items-center justify-between mb-6">
            <RadixDialog.Title className="text-2xl font-bold text-[#e4e6eb]">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </RadixDialog.Title>
            <RadixDialog.Close className="text-[#9ca3af] hover:text-[#e4e6eb] transition-colors p-2 hover:bg-[#2a2d35] rounded-lg">
              <IoClose className="w-6 h-6" />
            </RadixDialog.Close>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmitLogin(onLogin)}
                className="space-y-4"
              >
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{loginError}</p>
                    {pendingEmail && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={isResendingEmail}
                          className="text-xs text-[#5865f2] hover:text-[#4752c4] font-medium hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          {isResendingEmail ? "Sending..." : "Resend verification email"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Email
                  </label>
                  <input
                    {...registerLogin("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#1a1b23] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{loginErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerLogin("password")}
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 bg-[#1a1b23] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#e4e6eb] transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <FaEyeSlash className="w-5 h-5" />
                      ) : (
                        <FaEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{loginErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center text-sm text-[#b9bbbe]">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeSwitch}
                    className="text-[#5865f2] hover:text-[#4752c4] font-medium hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmitSignUp(onSignUp)}
                className="space-y-4"
              >
                {signUpError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{signUpError}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Email
                  </label>
                  <input
                    {...registerSignUp("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#1a1b23] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                  />
                  {signUpErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerSignUp("password")}
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 bg-[#1a1b23] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#e4e6eb] transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? (
                        <FaEyeSlash className="w-5 h-5" />
                      ) : (
                        <FaEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {signUpErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#b9bbbe] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerSignUp("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 bg-[#1a1b23] border border-[#2d2f36] rounded-lg text-[#e4e6eb] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#e4e6eb] transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="w-5 h-5" />
                      ) : (
                        <FaEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {signUpErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{signUpErrors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </button>

                <div className="text-center text-sm text-[#b9bbbe]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeSwitch}
                    className="text-[#5865f2] hover:text-[#4752c4] font-medium hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

