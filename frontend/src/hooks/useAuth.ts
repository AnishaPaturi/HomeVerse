"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { getStoredUser, setStoredUser, clearStoredUser, loginUser } from "@/lib/auth";

export function useAuth(requireAuth = false) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored && requireAuth) {
      router.push("/login");
    } else {
      setUser(stored);
    }
    setLoading(false);
  }, [requireAuth, router]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const u = await loginUser(email, password);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
