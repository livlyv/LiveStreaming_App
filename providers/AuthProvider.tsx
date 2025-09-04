import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService, User } from "@/services/authService";
import { router } from "expo-router";
import { logger } from "@/lib/logger";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    logger.info('AUTH', 'AuthProvider mounted, loading user');
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      logger.info('AUTH', 'Loading user from storage');
      const userData = await AsyncStorage.getItem("user");
      const tokenData = await AsyncStorage.getItem("auth_tokens");
      
      logger.debug('AUTH', 'Storage data retrieved', {
        hasUserData: !!userData,
        hasTokenData: !!tokenData,
        userDataLength: userData?.length,
        tokenDataLength: tokenData?.length
      });
      
      if (userData && tokenData) {
        const parsedUser = JSON.parse(userData);
        const parsedTokens = JSON.parse(tokenData);
        
        logger.debug('AUTH', 'Parsed auth data', {
          userId: parsedUser.id,
          username: parsedUser.username,
          tokenExpiresAt: parsedTokens.expiresAt,
          currentTime: Date.now(),
          isExpired: Date.now() > parsedTokens.expiresAt
        });
        
        // Only use tokens if they're still valid (no auto-refresh)
        if (Date.now() < parsedTokens.expiresAt) {
          logger.info('AUTH', 'Tokens are valid, setting user');
          setUser(parsedUser);
          setTokens(parsedTokens);
        } else {
          logger.warn('AUTH', 'Tokens expired, clearing auth data');
          // Tokens expired, clear auth data and redirect to login
          await clearAuthData();
          router.replace("/auth");
        }
      } else {
        logger.info('AUTH', 'No stored auth data found');
      }
    } catch (error) {
      logger.error('AUTH', 'Failed to load user', null, error);
    } finally {
      setIsLoading(false);
      logger.info('AUTH', 'User loading completed', { isLoading: false });
    }
  };

  const clearAuthData = async () => {
    logger.info('AUTH', 'Clearing auth data');
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("auth_tokens");
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      setUser(null);
      setTokens(null);
      logger.info('AUTH', 'Auth data cleared successfully');
    } catch (error) {
      logger.error('AUTH', 'Error clearing auth data', null, error);
    }
  };

  const saveAuthData = async (userData: User, authTokens: AuthTokens) => {
    logger.info('AUTH', 'Saving auth data', {
      userId: userData.id,
      username: userData.username,
      tokenExpiresAt: authTokens.expiresAt
    });
    
    try {
      setUser(userData);
      setTokens(authTokens);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("auth_tokens", JSON.stringify(authTokens));
      logger.info('AUTH', 'Auth data saved successfully');
    } catch (error) {
      logger.error('AUTH', 'Error saving auth data', null, error);
    }
  };



  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      logger.warn('AUTH', 'Cannot update user - no user logged in');
      return;
    }

    logger.info('AUTH', 'Updating user', { updates });
    try {
      const updatedUser: User = { ...user, ...updates } as User;
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      logger.info('AUTH', 'User updated successfully');
    } catch (error) {
      logger.error('AUTH', 'Error updating user', null, error);
    }
  };

  const logout = async () => {
    logger.info('AUTH', 'Logout initiated');
    try {
      if (tokens) {
        logger.info('AUTH', 'Calling backend logout');
        await authService.logout();
      }
    } catch (error) {
      logger.error('AUTH', 'Logout error', null, error);
    } finally {
      await clearAuthData();
      logger.info('AUTH', 'Navigating to auth screen');
      // Force navigation to auth screen
      router.replace("/auth");
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