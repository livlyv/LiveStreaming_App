import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const { setUser } = useAuth();
  const scaleAnim = new Animated.Value(0.8);
  const opacityAnim = new Animated.Value(0);

  const checkAuthStatus = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      
      setTimeout(() => {
        if (userData) {
          setUser(JSON.parse(userData));
          router.replace("/(tabs)" as any);
        } else if (hasSeenOnboarding) {
          router.replace("/auth" as any);
        } else {
          router.replace("/onboarding" as any);
        }
      }, 2000);
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/onboarding" as any);
    }
  }, [setUser]);

  useEffect(() => {
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

    checkAuthStatus();
  }, [checkAuthStatus, scaleAnim, opacityAnim]);



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