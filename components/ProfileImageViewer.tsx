import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ProfileImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  showBackButton?: boolean;
}

export default function ProfileImageViewer({
  visible,
  imageUrl,
  onClose,
  showBackButton = false,
}: ProfileImageViewerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3.0}
          minimumZoomScale={1.0}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity 
            onPress={onClose}
            activeOpacity={1}
          >
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight,
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    maxWidth: '100%',
    maxHeight: '100%',
  },
});
