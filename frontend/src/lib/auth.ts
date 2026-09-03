/**
 * Authentication and Session Management
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan?: string;
}

const USER_STORAGE_KEY = "homeverse_user";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_STORAGE_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
}
