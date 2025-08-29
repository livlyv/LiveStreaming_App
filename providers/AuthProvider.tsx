import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  username: string;
  phoneNumber?: string;
  email?: string;
  bio: string;
  profilePic: string;
  followers: number;
  following: number;
  totalLikes: number;
  coinsEarned: number;
  isVerified: boolean;
}

const demoUser: User = {
  id: "demo-1",
  username: "DemoStreamer",
  phoneNumber: "+91 90000 00000",
  email: "demo@demostreaming.app",
  bio: "Vibes. Music. Gifts. Welcome to my live!",
  profilePic: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800&q=80&auto=format&fit=crop",
  followers: 13450,
  following: 182,
  totalLikes: 203400,
  coinsEarned: 54230,
  isVerified: true,
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(demoUser);
        await AsyncStorage.setItem("user", JSON.stringify(demoUser));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      setUser(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser: User = { ...user, ...updates } as User;
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return {
    user,
    setUser,
    updateUser,
    logout,
    isLoading,
  };
});