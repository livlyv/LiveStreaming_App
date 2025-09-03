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
import { authService } from "@/services/authService";
import { googleAuthService } from "@/services/googleAuth";
import { Phone, Mail, Lock, User } from "lucide-react-native";
import NetworkTest from "@/components/NetworkTest";

export default function AuthScreen() {
  const { saveAuthData } = useAuth();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.requestOTP(phoneNumber);
      setShowOtp(true);
      Alert.alert(
        "OTP Sent", 
        response.message + (response.mockCode ? `\n\nDev Code: ${response.mockCode}` : "")
      );
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    if (!isLogin && !username) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyOTP(
        phoneNumber, 
        otp, 
        !isLogin ? username : undefined, 
        !isLogin ? bio : undefined
      );
      
      const authTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + (response.expiresIn * 1000)
      };
      
      await saveAuthData(response.user, authTokens);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (!isLogin && !username) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await authService.login(email, password);
        const authTokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: Date.now() + (response.expiresIn * 1000)
        };
        await saveAuthData(response.user, authTokens);
        router.replace("/(tabs)" as any);
      } else {
        const response = await authService.signup(email, password, username, bio);
        if (response.needsEmailVerification) {
          Alert.alert(
            "Check Your Email", 
            "We've sent you a verification link. Please verify your email before logging in.",
            [{ text: "OK", onPress: () => setIsLogin(true) }]
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    if (provider === 'google') {
      setIsLoading(true);
      try {
        console.log('🔐 Starting Google OAuth from auth screen...');
        
        // Use the updated Google Auth service
        const googleResponse = await googleAuthService.signIn();
        console.log('✅ Google OAuth successful:', googleResponse.user.email);
        
        // Create auth tokens
        const authTokens = {
          accessToken: googleResponse.accessToken,
          refreshToken: googleResponse.idToken, // Using idToken as refresh token
          expiresAt: Date.now() + (3600 * 1000) // 1 hour
        };
        
        // Save user data
        const userData = {
          id: googleResponse.user.id,
          email: googleResponse.user.email,
          username: googleResponse.user.name,
          profile_pic: googleResponse.user.picture,
          bio: `Hi, I'm ${googleResponse.user.name}!`,
          is_verified: googleResponse.user.verified_email,
          phone: undefined,
          followers: 0,
          following: 0,
          total_likes: 0,
          coins_earned: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await saveAuthData(userData, authTokens);
        console.log('✅ Auth data saved successfully');
        
        router.replace("/(tabs)" as any);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        Alert.alert("Error", error instanceof Error ? error.message : "Google login failed");
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert(
        `${provider} Login`,
        `${provider} login will be implemented soon`,
        [{ text: "OK" }]
      );
    }
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
            <View style={styles.authModeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'phone' && styles.activeModeButton]}
                onPress={() => {
                  setAuthMode('phone');
                  setShowOtp(false);
                  setOtp('');
                }}
              >
                <Text style={[styles.modeButtonText, authMode === 'phone' && styles.activeModeButtonText]}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, authMode === 'email' && styles.activeModeButton]}
                onPress={() => {
                  setAuthMode('email');
                  setShowOtp(false);
                  setOtp('');
                }}
              >
                <Text style={[styles.modeButtonText, authMode === 'email' && styles.activeModeButtonText]}>Email</Text>
              </TouchableOpacity>
            </View>

            {authMode === 'phone' ? (
              <>
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
                    editable={!isLoading}
                  />
                  <Text style={styles.countryCode}>+91</Text>
                </View>

                {!showOtp && (
                  <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                    <LinearGradient
                      colors={["#E30CBD", "#6900D1"]}
                      style={[styles.button, isLoading && styles.disabledButton]}
                    >
                      <Text style={styles.buttonText}>
                        {isLoading ? "Sending..." : "Send OTP"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#E30CBD" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={20} color="#E30CBD" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            {(showOtp && authMode === 'phone') && (
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
                  editable={!isLoading}
                />
              </View>
            )}

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
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    placeholder="Write a short bio (optional)"
                    placeholderTextColor="#666"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            {((showOtp && authMode === 'phone') || authMode === 'email') && (
              <TouchableOpacity 
                onPress={authMode === 'phone' ? handleVerifyOtp : handleEmailAuth}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#E30CBD", "#6900D1"]}
                  style={[styles.button, isLoading && styles.disabledButton]}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <Text style={styles.socialButtonText}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin("facebook")}
                disabled={isLoading}
              >
                <Text style={styles.socialButtonText}>f</Text>
              </TouchableOpacity>

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin("apple")}
                  disabled={isLoading}
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
                setUsername("");
                setBio("");
              }}
              disabled={isLoading}
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

            <NetworkTest />
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
  authModeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 25,
    marginBottom: 20,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeModeButton: {
    backgroundColor: "#E30CBD",
  },
  modeButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  activeModeButtonText: {
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
});