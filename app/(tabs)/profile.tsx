import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/services/api";
import { logger } from "@/lib/logger";
import * as ImagePicker from "expo-image-picker";
import {
  Settings,
  Edit3,
  Camera,
  Image as ImageIcon,
  Users,
  Heart,
  Gift,
  Crown,
  Star,
  Wallet,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  BarChart3,
} from "lucide-react-native";
import { BarChart } from "react-native-chart-kit";
import ProfileImageViewer from "@/components/ProfileImageViewer";

const { width: screenWidth } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [streamDurationData, setStreamDurationData] = useState<any[]>([]);
  const [topGifter, setTopGifter] = useState<any>(null);
  const [topGifts, setTopGifts] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePicTimestamp, setProfilePicTimestamp] = useState(Date.now());
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState("");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, earningsResponse, durationResponse, gifterResponse, giftsResponse] = await Promise.all([
        apiClient.getUserById(user?.id || ''),
        apiClient.getEarnings(),
        apiClient.getUserStreamDuration(user?.id || '', 'weekly'),
        apiClient.getUserTopGifter(user?.id || ''),
        apiClient.getUserTopGifts(user?.id || '', 4),
      ]);

      setProfileData(profileResponse.user);
      setEarnings(earningsResponse);
      setStreamDurationData(durationResponse.data || []);
      setTopGifter(gifterResponse.top_gifter);
      setTopGifts(giftsResponse.top_gifts || []);
      
      // Initialize edit form
      setEditForm({
        username: profileResponse.user.username,
        bio: profileResponse.user.bio || "",
      });
      
      logger.info('UI', 'Profile data loaded successfully', {
        username: profileResponse.user.username,
        coinsEarned: earningsResponse.coins_earned,
        totalGifts: earningsResponse.total_gifts
      });
    } catch (error) {
      logger.error('UI', 'Error loading profile data', null, error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleEditProfile = async () => {
    if (!editForm.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    try {
      const response = await apiClient.updateProfile({
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
      });
      
      setProfileData(response.user);
      setShowEditModal(false);
      
      Alert.alert('Success', 'Profile updated successfully');
      
      logger.info('UI', 'Profile updated successfully', { username: response.user.username });
    } catch (error) {
      logger.error('UI', 'Error updating profile', null, error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleImagePicker = async (type: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (type === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take a photo');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Gallery permission is required to select a photo');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('UI', 'Error picking image', null, error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('profile_picture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_picture.jpg',
      } as any);
      
      const response = await apiClient.uploadProfilePicture(formData);
      
      // Update local profile data immediately
      setProfileData((prev: any) => ({
        ...prev,
        profile_pic: response.profile_pic
      }));
      
      // Update timestamp to force image refresh
      setProfilePicTimestamp(Date.now());
      
      // Update user in auth provider
      if (updateUser && user) {
        updateUser({
          profile_pic: response.profile_pic
        });
      }
      
      // Don't refresh from server immediately to avoid overwriting the updated image
      // The local state update should be sufficient
      
      setShowImagePicker(false);
      Alert.alert('Success', 'Profile picture updated successfully');
      
      logger.info('UI', 'Profile picture uploaded successfully', { 
        profilePicUrl: response.profile_pic 
      });
    } catch (error) {
      logger.error('UI', 'Error uploading profile picture', null, error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const openFullScreenImage = (imageUrl: string) => {
    setFullScreenImageUrl(imageUrl);
    setShowFullScreenImage(true);
  };

  const closeFullScreenImage = () => {
    setShowFullScreenImage(false);
    setFullScreenImageUrl("");
  };

  const getKYCBadge = () => {
    if (!earnings?.kyc_status) return null;
    
    switch (earnings.kyc_status) {
      case 'verified':
        return (
          <View style={styles.kycBadge}>
            <CheckCircle size={16} color="#00FF00" />
            <Text style={styles.kycBadgeText}>KYC Verified</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.kycBadge, styles.kycPendingBadge]}>
            <Clock size={16} color="#FFA500" />
            <Text style={styles.kycBadgeText}>KYC Pending</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.kycBadge, styles.kycRejectedBadge]}>
            <AlertCircle size={16} color="#FF0000" />
            <Text style={styles.kycBadgeText}>KYC Rejected</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const progressPercentage = Math.min((earnings?.coins_earned || 0) / 5000 * 100, 100);
  const remainingCoins = Math.max(5000 - (earnings?.coins_earned || 0), 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Settings size={24} color="#E30CBD" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E30CBD" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
                     <View style={styles.headerActions}>
             <TouchableOpacity onPress={loadProfileData} style={styles.headerButton} disabled={refreshing}>
               <RefreshCw 
                 size={20} 
                 color="#E30CBD" 
                 style={[
                   refreshing && { transform: [{ rotate: '360deg' }] }
                 ]}
               />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerButton}>
               <Settings size={24} color="#E30CBD" />
             </TouchableOpacity>
           </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E30CBD"
              colors={["#E30CBD"]}
            />
          }
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={["#E30CBD", "#6900D1", "#FF006E"]}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
                             <View style={styles.profilePicContainer}>
                 <TouchableOpacity 
                   onPress={() => profileData?.profile_pic && openFullScreenImage(profileData.profile_pic)}
                   activeOpacity={0.8}
                 >
                   <Image 
                     source={{ 
                       uri: profileData?.profile_pic 
                         ? `${profileData.profile_pic}?t=${profilePicTimestamp}` 
                         : "https://via.placeholder.com/100" 
                     }} 
                     style={styles.profilePic}
                     key={profilePicTimestamp} // Force re-render when timestamp changes
                   />
                 </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editPicButton}
                  onPress={() => setShowImagePicker(true)}
                >
                  <Edit3 size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.username}>
                  {profileData?.username}
                  {profileData?.is_verified && " ✓"}
                </Text>
                {getKYCBadge()}
                <Text style={styles.bio}>{profileData?.bio || "No bio yet"}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => setShowEditModal(true)}
              >
                <Edit3 size={16} color="#FFFFFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Users size={20} color="#E30CBD" />
              <Text style={styles.statValue}>{profileData?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={20} color="#00E5FF" />
              <Text style={styles.statValue}>{profileData?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={20} color="#FF6B6B" />
              <Text style={styles.statValue}>{profileData?.total_likes || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Gift size={20} color="#FFD700" />
              <Text style={styles.statValue}>{earnings?.total_gifts || 0}</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </View>
          </View>

          {/* Earnings Section */}
          <View style={styles.earningsSection}>
            <TouchableOpacity 
              style={styles.earningsCard}
              onPress={() => router.push('/earnings')}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2", "#f093fb"]}
                style={styles.earningsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                                 <View style={styles.earningsHeader}>
                   <RefreshCw 
                     size={24} 
                     color="#FFFFFF" 
                     style={[
                       refreshing && { transform: [{ rotate: '360deg' }] }
                     ]}
                   />
                   <Text style={styles.earningsTitle}>Total Earnings</Text>
                 </View>
                
                <Text style={styles.earningsAmount}>
                  {earnings?.coins_earned?.toLocaleString() || 0} coins
                </Text>
                <Text style={styles.earningsSubtitle}>
                  {earnings?.can_withdraw ? "Ready to withdraw!" : `${remainingCoins} coins needed`}
                </Text>
                
                                 {/* Progress Bar */}
                 <View style={styles.progressContainer}>
                   <View style={[styles.progressBar, progressPercentage >= 100 && styles.progressBarComplete]}>
                     <LinearGradient 
                       colors={progressPercentage >= 100 ? ["#FFD700", "#FFA500", "#FF6B6B", "#FFD700"] : ["#E30CBD", "#6900D1", "#FF006E"]} 
                       style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 1, y: 0 }}
                     />
                     {progressPercentage >= 100 && (
                       <View style={[styles.celebrationOverlay, { transform: [{ scale: 1.1 }] }]}>
                         <Text style={styles.celebrationText}>🎉</Text>
                       </View>
                     )}
                   </View>
                   <View style={styles.progressLabels}>
                     <Text style={styles.progressLabel}>0</Text>
                     <Text style={styles.progressLabel}>5,000</Text>
                   </View>
                 </View>
                
                <TouchableOpacity 
                  style={[
                    styles.withdrawButton,
                    (!earnings?.can_withdraw || earnings?.coins_earned < 5000) && styles.disabledButton
                  ]}
                  onPress={() => router.push('/earnings')}
                  disabled={!earnings?.can_withdraw || earnings?.coins_earned < 5000}
                >
                  <Wallet size={16} color="#FFFFFF" />
                  <Text style={styles.withdrawButtonText}>
                    {earnings?.can_withdraw ? "Withdraw Now" : "View Earnings"}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Highlights Section */}
          <View style={styles.highlightsSection}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            
            {/* Top Gifter */}
            {topGifter && (
              <View style={styles.highlightCard}>
                <Crown size={20} color="#FFD700" />
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Top Gifter</Text>
                  <Text style={styles.highlightValue}>{topGifter.username}</Text>
                  <Text style={styles.highlightSubtitle}>{topGifter.total_coins} coins</Text>
                </View>
              </View>
            )}

            {/* Top Gifts */}
            {topGifts.length > 0 && (
              <View style={styles.highlightCard}>
                <Star size={20} color="#FFD700" />
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Top Gifts</Text>
                  <View style={styles.topGiftsContainer}>
                    {topGifts.slice(0, 4).map((gift, index) => (
                      <View key={index} style={styles.giftItem}>
                        <Image source={{ uri: gift.icon_url }} style={styles.giftIcon} />
                        <Text style={styles.giftName}>{gift.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Stream Duration Charts */}
          <View style={styles.chartsSection}>
            <Text style={styles.sectionTitle}>Stream Activity</Text>
            
            {/* Weekly Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weekly Stream Duration</Text>
              {streamDurationData.length > 0 ? (
                <BarChart
                  data={{
                    labels: streamDurationData.slice(0, 7).map(item => item.day_name?.slice(0, 3) || 'N/A'),
                    datasets: [{
                      data: streamDurationData.slice(0, 7).map(item => item.total_duration || 0)
                    }]
                  }}
                  width={screenWidth - 40}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix="h"
                  chartConfig={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    backgroundGradientFrom: 'rgba(255,255,255,0.05)',
                    backgroundGradientTo: 'rgba(255,255,255,0.05)',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(227, 12, 189, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    barPercentage: 0.7,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No stream data available</Text>
                  <Text style={styles.noDataSubtext}>Start streaming to see your activity</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Username</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter username"
                  placeholderTextColor="#666"
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#666"
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleEditProfile}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={showImagePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Picture</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('camera')}
                disabled={uploadingImage}
              >
                <Camera size={24} color="#E30CBD" />
                <Text style={styles.imagePickerText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.imagePickerOption}
                onPress={() => handleImagePicker('gallery')}
                disabled={uploadingImage}
              >
                <ImageIcon size={24} color="#E30CBD" />
                <Text style={styles.imagePickerText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              {uploadingImage && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#E30CBD" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
                     </View>
         </View>
       </Modal>

       {/* Full Screen Image Modal */}
       <ProfileImageViewer
         visible={showFullScreenImage}
         imageUrl={fullScreenImageUrl}
         onClose={closeFullScreenImage}
       />
     </View>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070506",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  profileHeader: {
    padding: 20,
  },
  profileGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#E30CBD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editPicButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E30CBD',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  bio: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    gap: 6,
  },
  kycPendingBadge: {
    backgroundColor: 'rgba(255,165,0,0.2)',
  },
  kycRejectedBadge: {
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  kycBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  earningsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  earningsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  earningsGradient: {
    padding: 20,
    alignItems: 'center',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  earningsAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  earningsSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
     progressBar: {
     height: 6,
     backgroundColor: 'rgba(255,255,255,0.2)',
     borderRadius: 3,
     overflow: 'hidden',
   },
   progressBarComplete: {
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.8,
     shadowRadius: 4,
     elevation: 3,
   },
     progressFill: {
     height: '100%',
     borderRadius: 3,
   },
   celebrationOverlay: {
     position: 'absolute',
     right: -10,
     top: -5,
     backgroundColor: 'rgba(255,255,255,0.9)',
     borderRadius: 15,
     padding: 5,
     shadowColor: '#FFD700',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.8,
     shadowRadius: 4,
     elevation: 5,
   },
   celebrationText: {
     fontSize: 16,
   },
   progressLabels: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: 8,
   },
   progressLabel: {
     color: 'rgba(255,255,255,0.7)',
     fontSize: 12,
     fontWeight: '500',
   },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  highlightContent: {
    marginLeft: 12,
    flex: 1,
  },
  highlightTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  highlightValue: {
    color: '#E30CBD',
    fontSize: 14,
    fontWeight: '700',
  },
  highlightSubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  topGiftsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  giftItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  giftIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  giftName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    color: '#999',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E30CBD',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  imagePickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  uploadingText: {
    color: '#E30CBD',
    fontSize: 14,
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginVertical: 8,
  },
  noDataText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
     noDataSubtext: {
     color: '#999',
     fontSize: 14,
     textAlign: 'center',
   },
 });