import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NetworkTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');

    try {
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000';
      console.log('🔧 Testing connection to:', baseUrl);

      // Test 1: Root endpoint
      const rootResponse = await fetch(`${baseUrl}/api/`);
      const rootData = await rootResponse.json();
      console.log('✅ Root test:', rootData);

      // Test 2: Test endpoint
      const testResponse = await fetch(`${baseUrl}/api/test`);
      const testData = await testResponse.json();
      console.log('✅ Test endpoint:', testData);

      // Test 3: Auth signup endpoint (just check if it's reachable)
      const authResponse = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body to trigger validation error
      });
      const authData = await authResponse.json();
      console.log('✅ Auth endpoint reachable:', authData);

      setTestResult(`✅ All tests passed!\nRoot: ${rootData.status}\nTest: ${testData.message}\nAuth: ${authData.error || 'reachable'}`);
    } catch (error) {
      console.error('❌ Network test failed:', error);
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      <Text style={styles.info}>Base URL: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000'}</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#E30CBD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});