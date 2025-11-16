"use client";

import { v4 as uuidv4 } from "uuid";

export interface AnonUser {
  id: string;
  email?: string;
  createdAt: string;
}

const ANON_USER_KEY = "anon_user_id";
const ANON_USER_EMAIL_KEY = "anon_user_email";
const ANON_USERNAME_KEY = "anon_username";
const REMEMBER_ME_KEY = "remember_me";
const REMEMBERED_PASSWORD_KEY = "remembered_password";

export function generateAnonUserId(): string {
  return uuidv4();
}

export function getAnonUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ANON_USER_KEY);
}

export function setAnonUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANON_USER_KEY, userId);
}

export function getAnonUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ANON_USER_EMAIL_KEY);
}

export function setAnonUserEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANON_USER_EMAIL_KEY, email);
}

export function getAnonUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ANON_USERNAME_KEY);
}

export function setAnonUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANON_USERNAME_KEY, username);
}

export function clearAnonUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANON_USER_KEY);
  localStorage.removeItem(ANON_USER_EMAIL_KEY);
  localStorage.removeItem(ANON_USERNAME_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
}

export function isAnonUser(): boolean {
  return getAnonUserId() !== null;
}

export function setRememberMe(remember: boolean): void {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function getRememberedUsername(): string | null {
  if (typeof window === "undefined") return null;
  if (getRememberMe()) {
    return getAnonUsername();
  }
  return null;
}

export function setRememberedPassword(password: string): void {
  if (typeof window === "undefined") return;
  // Store password (in production, use encryption)
  localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
}

export function getRememberedPassword(): string | null {
  if (typeof window === "undefined") return null;
  if (getRememberMe()) {
    return localStorage.getItem(REMEMBERED_PASSWORD_KEY);
  }
  return null;
}

export function clearRememberedPassword(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
}

