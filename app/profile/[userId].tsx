import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/services/api";
import { logger } from "@/lib/logger";
import {
  ArrowLeft,
  Settings,
  Users,
  Heart,
  Gift,
  Crown,
  Star,
  MessageCircle,
  UserX,
  MoreVertical,
  Camera,
  BarChart3,
} from "lucide-react-native";
import { BarChart } from "react-native-chart-kit";
import ProfileImageViewer from "@/components/ProfileImageViewer";

const { width: screenWidth } = Dimensions.get("window");

export default function UserProfileScreen() {
  const { user: currentUser } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [streamDurationData, setStreamDurationData] = useState<any[]>([]);
  const [topGifter, setTopGifter] = useState<any>(null);
  const [topGifts, setTopGifts] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const [
        userResponse,
        durationResponse,
        topGifterResponse,
        topGiftsResponse,
        canMessageResponse
      ] = await Promise.all([
        apiClient.getUserById(userId),
        apiClient.getUserStreamDuration(userId, 'weekly'),
        apiClient.getUserTopGifter(userId),
        apiClient.getUserTopGifts(userId, 4),
        apiClient.canUserMessage(userId)
      ]);

      setUser(userResponse.user);
      setStreamDurationData(durationResponse.data || []);
      setTopGifter(topGifterResponse.top_gifter);
      setTopGifts(topGiftsResponse.top_gifts || []);
      setCanMessage(canMessageResponse.can_message);

      // Check if current user is following this user
      if (currentUser?.id) {
        try {
          const followersResponse = await apiClient.getUserFollowers(userId, 1, 1000);
          const isFollowingUser = followersResponse.followers.some(
            (follower: any) => follower.id === currentUser.id
          );
          setIsFollowing(isFollowingUser);
        } catch (error) {
          logger.error('UI', 'Error checking follow status', { userId }, error);
        }
      }

      logger.info('UI', 'User profile loaded successfully', { userId });
    } catch (error) {
      logger.error('UI', 'Error loading user profile', { userId }, error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!currentUser?.id || !userId) return;

    try {
      if (isFollowing) {
        await apiClient.unfollowUser(userId);
        setIsFollowing(false);
        Alert.alert('Success', 'Unfollowed user');
      } else {
        await apiClient.followUser(userId);
        setIsFollowing(true);
        Alert.alert('Success', 'Started following user');
      }
      
      // Refresh user data to update follower counts
      await loadUserProfile();
    } catch (error) {
      logger.error('UI', 'Error following/unfollowing user', { userId, isFollowing }, error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = () => {
    if (!canMessage) {
      Alert.alert(
        'Message Locked',
        'You need to send at least 99 coins to this user before you can message them.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to chat
    router.push(`/chat/${userId}`);
  };

  const openFullScreenImage = (imageUrl: string) => {
    setShowFullScreenImage(true);
  };

  const closeFullScreenImage = () => {
    setShowFullScreenImage(false);
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${user?.username}? You won't see their content and they won't be able to interact with you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.blockUser(userId, 'User blocked from profile');
              Alert.alert('Success', 'User has been blocked');
              router.back();
            } catch (error) {
              logger.error('UI', 'Error blocking user', { userId }, error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      'Report this user for inappropriate behavior?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            router.push('/settings');
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const weeklyData = streamDurationData.length > 0 
    ? streamDurationData.map(item => item.total_hours)
    : [3, 2, 5, 1, 4, 6, 2]; // Default mock data

  const getKYCBadge = () => {
    if (!user?.kyc_status) return null;
    
    switch (user.kyc_status) {
      case 'verified':
        return (
          <View style={styles.kycBadge}>
            <Text style={styles.kycBadgeText}>✓ KYC Verified</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.kycBadge, styles.kycPendingBadge]}>
            <Text style={styles.kycBadgeText}>⏳ KYC Pending</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E30CBD" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>@{user.username}</Text>
          <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
            <MoreVertical size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showOptions && (
          <View style={styles.optionsMenu}>
            {!isOwnProfile && (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
                  <UserX size={20} color="#FF5252" />
                  <Text style={[styles.optionText, { color: '#FF5252' }]}>Block User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                  <Settings size={20} color="#FFA500" />
                  <Text style={[styles.optionText, { color: '#FFA500' }]}>Report User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

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
          <LinearGradient
            colors={["#E30CBD", "#6900D1"]}
            style={styles.profileHeader}
          >
            <View style={styles.profilePicContainer}>
              <TouchableOpacity 
                onPress={() => user?.profile_pic && openFullScreenImage(user.profile_pic)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: user.profile_pic || "https://via.placeholder.com/100" }}
                  style={styles.profilePic}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.username}>
                {user.username}
                {user.is_verified && " ✓"}
              </Text>
              {getKYCBadge()}
              <Text style={styles.bio}>{user.bio || "No bio yet"}</Text>
            </View>

            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, isFollowing && styles.unfollowButton]} 
                  onPress={handleFollow}
                >
                  <Text style={styles.actionButtonText}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.messageButton, !canMessage && styles.disabledButton]} 
                  onPress={handleMessage}
                  disabled={!canMessage}
                >
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={20} color="#E30CBD" />
              <Text style={styles.statNumber}>{user.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={20} color="#6900D1" />
              <Text style={styles.statNumber}>{user.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={20} color="#FF006E" />
              <Text style={styles.statNumber}>{user.total_likes || 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Gift size={20} color="#FFD700" />
                             <Text style={styles.statNumber}>{user.credits_earned || 0}</Text>
               <Text style={styles.statLabel}>Credits</Text>
            </View>
          </View>

          {/* Highlights Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <View style={styles.highlightsRow}>
              <View style={[styles.highlightItem, { backgroundColor: 'rgba(227,12,189,0.12)' }]}>
                <Crown size={16} color="#E30CBD" />
                <Text style={styles.highlightTitle}>Top Gifter</Text>
                <Text style={styles.highlightValue}>
                  {topGifter ? `@${topGifter.sender_username}` : 'No gifts yet'}
                </Text>
                {topGifter && (
                  <Text style={styles.highlightSubtext}>{topGifter.total_coins_sent} credits</Text>
                )}
              </View>
              <View style={[styles.highlightItem, { backgroundColor: 'rgba(255,215,0,0.12)' }]}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.highlightTitle}>Best Gift</Text>
                <Text style={styles.highlightValue}>
                  {topGifts.length > 0 ? `${topGifts[0].gift_icon} ${topGifts[0].gift_name}` : 'No gifts yet'}
                </Text>
                {topGifts.length > 0 && (
                  <Text style={styles.highlightSubtext}>{topGifts[0].total_coins} credits</Text>
                )}
              </View>
            </View>
          </View>

          {/* Top Gifts Section */}
          {topGifts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Gifts</Text>
              <View style={styles.topGiftsGrid}>
                {topGifts.slice(0, 4).map((gift, index) => (
                  <View key={gift.gift_id} style={[styles.giftCard, { borderColor: ['#E30CBD', '#6900D1', '#FF006E', '#FFD700'][index] }]}>
                    <Text style={styles.giftIcon}>{gift.gift_icon}</Text>
                    <Text style={styles.giftName}>{gift.gift_name}</Text>
                    <Text style={styles.giftValue}>{gift.total_coins} credits</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stream Stats Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stream Duration Charts</Text>
            <View style={styles.chartsContainer}>
              {/* Weekly Chart */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <BarChart3 size={20} color="#FF006E" />
                  <Text style={styles.chartTitle}>This Week</Text>
                </View>
                <BarChart
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        data: weeklyData,
                      },
                    ],
                  }}
                  width={screenWidth - 60}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix="h"
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'transparent',
                    backgroundGradientTo: 'transparent',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 0, 110, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.7,
                    propsForLabels: {
                      fontSize: 12,
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  showBarTops={true}
                  showValuesOnTopOfBars={true}
                  fromZero={true}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Full Screen Image Modal */}
        <ProfileImageViewer
          visible={showFullScreenImage}
          imageUrl={user?.profile_pic || ""}
          onClose={closeFullScreenImage}
          showBackButton={true}
        />
      </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  optionsMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: "center",
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profilePicContainer: { 
    position: 'relative', 
    marginBottom: 15 
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userInfo: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 10,
  },
  kycBadge: { 
    backgroundColor: 'rgba(0,255,0,0.2)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  kycPendingBadge: { 
    backgroundColor: 'rgba(255,165,0,0.2)' 
  },
  kycBadgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  unfollowButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  messageButton: {
    backgroundColor: '#E30CBD',
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  statLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  highlightsRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  highlightItem: { 
    flex: 1, 
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    alignItems: 'center' 
  },
  highlightTitle: { 
    color: '#bbb', 
    marginBottom: 6, 
    fontWeight: '600', 
    fontSize: 12 
  },
  highlightValue: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  highlightSubtext: { 
    color: '#999', 
    fontSize: 11, 
    marginTop: 2 
  },
  topGiftsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  giftCard: { 
    width: '48%', 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1, 
    alignItems: 'center' 
  },
  giftIcon: { 
    fontSize: 24, 
    marginBottom: 4 
  },
  giftName: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  giftValue: { 
    color: '#bbb', 
    fontSize: 10, 
    marginTop: 2 
  },
  chartsContainer: {
    gap: 20,
  },
  chartCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  chartTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});