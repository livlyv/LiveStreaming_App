import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, User } from "@/services/authService";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const demoUser: User = {
  id: "demo-1",
  username: "DemoStreamer",
  phone: "+91 90000 00000",
  email: "demo@demostreaming.app",
  bio: "Vibes. Music. Gifts. Welcome to my live!",
  profile_pic: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800&q=80&auto=format&fit=crop",
  followers: 13450,
  following: 182,
  total_likes: 203400,
  coins_earned: 54230,
  is_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const tokenData = await AsyncStorage.getItem("auth_tokens");
      
      if (userData && tokenData) {
        const parsedUser = JSON.parse(userData);
        const parsedTokens = JSON.parse(tokenData);
        
        // Check if tokens are still valid
        if (Date.now() < parsedTokens.expiresAt) {
          setUser(parsedUser);
          setTokens(parsedTokens);
        } else {
          // Try to refresh tokens
          try {
            const refreshResponse = await authService.refreshToken(parsedTokens.refreshToken);
            const newTokens = {
              accessToken: refreshResponse.accessToken,
              refreshToken: parsedTokens.refreshToken,
              expiresAt: Date.now() + (refreshResponse.expiresIn * 1000)
            };
            
            setUser(refreshResponse.user);
            setTokens(newTokens);
            await AsyncStorage.setItem("user", JSON.stringify(refreshResponse.user));
            await AsyncStorage.setItem("auth_tokens", JSON.stringify(newTokens));
          } catch (error) {
            console.error("Failed to refresh tokens:", error);
            await clearAuthData();
          }
        }
      } else {
        // For demo purposes, set demo user
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

  const clearAuthData = async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("auth_tokens");
    setUser(null);
    setTokens(null);
  };

  const saveAuthData = async (userData: User, authTokens: AuthTokens) => {
    setUser(userData);
    setTokens(authTokens);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("auth_tokens", JSON.stringify(authTokens));
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser: User = { ...user, ...updates } as User;
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      if (tokens) {
        await authService.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await clearAuthData();
    }
  };

  return {
    user,
    setUser,
    updateUser,
    logout,
    isLoading,
    tokens,
    saveAuthData,
    clearAuthData,
  };
});