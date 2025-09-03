import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { googleAuthService } from '@/services/googleAuth';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  onLoading,
  disabled = false
}) => {
  const handleGoogleSignIn = async () => {
    if (disabled) return;

    try {
      onLoading?.(true);
      console.log('🔐 Starting Google Sign-In...');

      // Get Google OAuth tokens
      const googleResponse = await googleAuthService.signIn();
      console.log('✅ Google OAuth successful:', googleResponse.user.email);

      // Send ID token to backend
      const authResponse = await authService.googleSignIn(googleResponse.idToken);
      console.log('✅ Backend authentication successful');

      // Call success callback
      onSuccess?.(authResponse.user);

    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google Sign-In failed';
      onError?.(errorMessage);
    } finally {
      onLoading?.(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handleGoogleSignIn}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons name="logo-google" size={20} color="#4285F4" />
        <Text style={styles.text}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
});
