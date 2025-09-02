import React from "react";
import { Tabs } from "expo-router";
import { Platform, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  Home,
  MessageCircle,
  Wallet,
  User,
  Video,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(7, 5, 6, 0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 80 : 64,
        },
        tabBarActiveTintColor: "#E30CBD",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="go-live"
        options={{
          title: "",
          tabBarButton: () => (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/broadcast' })}
              testID="goLiveTabButton"
              style={styles.goLiveButton}
            >
              <LinearGradient colors={["#E30CBD", "#FF006E"]} style={styles.goLiveGradient}>
                <Video size={28} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  goLiveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  goLiveGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E30CBD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
});