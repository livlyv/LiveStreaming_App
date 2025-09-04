import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const scaleAnim = new Animated.Value(0.8);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    console.log("🚀 Splash screen mounted");
    
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigation logic
    const navigate = async () => {
      try {
        console.log("🔍 Checking auth status...", { user: !!user, isLoading });
        
        // Wait for auth provider to finish loading
        if (isLoading) {
          console.log("⏳ Still loading auth, waiting...");
          return;
        }
        
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        console.log("📱 Onboarding status:", hasSeenOnboarding);
        
        // Add a delay to ensure splash screen is visible
        setTimeout(() => {
          if (user) {
            console.log("✅ User authenticated, navigating to tabs");
            router.replace("/(tabs)/home");
          } else if (hasSeenOnboarding) {
            console.log("🔐 Navigating to auth");
            router.replace("/auth");
          } else {
            console.log("👋 Navigating to onboarding");
            router.replace("/onboarding");
          }
        }, 2000);
      } catch (error) {
        console.error("❌ Auth check error:", error);
        setTimeout(() => {
          router.replace("/onboarding");
        }, 2000);
      }
    };

    navigate();
  }, [user, isLoading]);



  return (
    <LinearGradient
      colors={["#6900D1", "#E30CBD", "#FF006E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>DS</Text>
        </View>
        <Text style={styles.appName}>Demo Streaming</Text>
        <Text style={styles.tagline}>Go Live & Connect Worldwide</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
});