import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { StreamProvider } from "@/providers/StreamProvider";
import { WalletProvider } from "@/providers/WalletProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: '#070506' }
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="stream/[streamId]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="broadcast" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="profile/[userId]" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="chat/inbox" />
      <Stack.Screen name="chat/[chatId]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <StreamProvider>
            <WalletProvider>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
            </WalletProvider>
          </StreamProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}