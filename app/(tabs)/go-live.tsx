import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function GoLiveTabPlaceholder() {
  return <View style={styles.container} testID="goLivePlaceholder"/>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
});