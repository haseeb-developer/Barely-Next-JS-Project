"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { User } from "lucide-react";
import Image from "next/image";

interface ClerkProfileImageProps {
  userId: string;
  size?: number;
}

export function ClerkProfileImage({ userId, size = 40 }: ClerkProfileImageProps) {
  const { user: currentUser } = useUser();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // If this is the current user, use their image
    if (currentUser?.id === userId && currentUser?.imageUrl) {
      setImageUrl(currentUser.imageUrl);
      return;
    }

    // For other Clerk users, we need to fetch from Clerk API
    // Since we can't easily fetch other users' images on client side,
    // we'll show a default avatar for now
    // In a production app, you'd want to store Clerk image URLs in the database
    setImageUrl(null);
  }, [userId, currentUser]);

  if (imageUrl) {
    return (
      <div 
        className="rounded-full overflow-hidden border-2 border-[#5865f2] bg-[#1a1b23]"
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt="Profile"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className="rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <User className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

