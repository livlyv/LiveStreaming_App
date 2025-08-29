import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

interface GiftAnimationProps {
  type: string;
}

export const GiftAnimation: React.FC<GiftAnimationProps> = ({ type }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    if (type === "rose") {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: -height,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleValue, {
            toValue: 1.2,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else if (type === "fireworks") {
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 2,
          friction: 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (type === "heart") {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: -height / 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleValue, {
            toValue: 1.5,
            friction: 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Default animation
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const getGiftEmoji = () => {
    switch (type) {
      case "rose":
        return "🌹";
      case "mic":
        return "🎤";
      case "fireworks":
        return "🎆";
      case "heart":
        return "❤️";
      case "coins":
        return "🪙";
      case "castle":
        return "🏰";
      case "crown":
        return "👑";
      default:
        return "🎁";
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.giftContainer,
          {
            transform: [
              { translateY: animatedValue },
              { scale: scaleValue },
            ],
          },
        ]}
      >
        <Text style={styles.giftEmoji}>{getGiftEmoji()}</Text>
        {type === "fireworks" && (
          <>
            <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle4]}>✨</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    height: height,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  giftContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  giftEmoji: {
    fontSize: 80,
  },
  sparkle: {
    position: "absolute",
    fontSize: 30,
  },
  sparkle1: {
    top: -20,
    left: -30,
  },
  sparkle2: {
    top: -20,
    right: -30,
  },
  sparkle3: {
    bottom: -20,
    left: -30,
  },
  sparkle4: {
    bottom: -20,
    right: -30,
  },
});