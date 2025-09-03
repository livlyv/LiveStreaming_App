import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { GoogleSignInButton } from './GoogleSignInButton';

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = (user: any) => {
    Alert.alert(
      'Success!',
      `Welcome ${user.username}! You have successfully signed in with Google.`,
      [{ text: 'OK' }]
    );
    console.log('🎉 User signed in:', user);
  };

  const handleGoogleError = (error: string) => {
    Alert.alert('Error', error, [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Live Streaming App</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
      <View style={styles.buttonContainer}>
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          onLoading={setIsLoading}
          disabled={isLoading}
        />
      </View>

      {isLoading && (
        <Text style={styles.loadingText}>Signing in...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
