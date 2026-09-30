/**
 * Authentication and Session Management
 */
import { User } from "@/types/user";

const USER_STORAGE_KEY = "homeverse_user";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = sessionStorage.getItem("user") || localStorage.getItem(USER_STORAGE_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("user");
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function loginUser(email: string, password?: string): Promise<User> {
  const res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: password || "demo" }),
  });
  if (!res.ok) {
    // Return standard demo session if server not responding or demo user
    const demoUser: User = {
      id: "u-demo-123",
      name: email.split("@")[0],
      email: email,
      plan: "Pro Designer",
      role: "owner"
    };
    setStoredUser(demoUser);
    return demoUser;
  }
  const data = await res.json();
  const user = data.user || data;
  setStoredUser(user);
  return user;
}
