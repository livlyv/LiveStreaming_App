import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Phone, Mail, Lock, User } from "lucide-react-native";

export default function AuthScreen() {
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }
    setShowOtp(true);
    Alert.alert("OTP Sent", "A 6-digit OTP has been sent to your phone");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    if (!isLogin && (!username || !bio)) {
      Alert.alert("Error", "Please complete your profile");
      return;
    }

    const userData = {
      id: Date.now().toString(),
      phoneNumber,
      username: username || `user_${phoneNumber.slice(-4)}`,
      bio: bio || "Hey there! I'm new here",
      profilePic: `https://ui-avatars.com/api/?name=${username || phoneNumber}&background=E30CBD&color=fff`,
      followers: 0,
      following: 0,
      totalLikes: 0,
      coinsEarned: 0,
      isVerified: false,
    };

    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    router.replace("/(tabs)" as any);
  };

  const handleSocialLogin = async (provider: string) => {
    Alert.alert(
      `${provider} Login`,
      "Enter your email and password",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Login",
          onPress: async () => {
            const userData = {
              id: Date.now().toString(),
              email: `user@${provider.toLowerCase()}.com`,
              username: `${provider.toLowerCase()}_user`,
              bio: "Hey there! I'm new here",
              profilePic: `https://ui-avatars.com/api/?name=${provider}&background=6900D1&color=fff`,
              followers: 0,
              following: 0,
              totalLikes: 0,
              coinsEarned: 0,
              isVerified: false,
            };

            await AsyncStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            router.replace("/(tabs)" as any);
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#070506", "#1a0d1a", "#070506"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back!" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Sign in to continue streaming"
                : "Join millions of streamers worldwide"}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#E30CBD" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Text style={styles.countryCode}>+91</Text>
            </View>

            {!showOtp && (
              <TouchableOpacity onPress={handleSendOtp}>
                <LinearGradient
                  colors={["#E30CBD", "#6900D1"]}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Send OTP</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {showOtp && (
              <>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#E30CBD" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#666"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                {!isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <User size={20} color="#E30CBD" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Choose username"
                        placeholderTextColor="#666"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, styles.bioInput]}
                        placeholder="Write a short bio"
                        placeholderTextColor="#666"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity onPress={handleVerifyOtp}>
                  <LinearGradient
                    colors={["#E30CBD", "#6900D1"]}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>
                      {isLogin ? "Login" : "Sign Up"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("Google")}
              >
                <Text style={styles.socialButtonText}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("Facebook")}
              >
                <Text style={styles.socialButtonText}>f</Text>
              </TouchableOpacity>

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("Apple")}
                >
                  <Text style={styles.socialButtonText}>🍎</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setShowOtp(false);
                setOtp("");
              }}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Login"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By signing up, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(227, 12, 189, 0.3)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#FFFFFF",
    fontSize: 16,
  },
  bioInput: {
    height: 80,
    paddingTop: 15,
    textAlignVertical: "top",
  },
  countryCode: {
    color: "#E30CBD",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    color: "#666",
    marginHorizontal: 10,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  socialButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  switchButton: {
    alignItems: "center",
    marginTop: 20,
  },
  switchText: {
    color: "#E30CBD",
    fontSize: 16,
  },
  terms: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 20,
  },
  termsLink: {
    color: "#E30CBD",
    textDecorationLine: "underline",
  },
});