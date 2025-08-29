import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import {
  ArrowLeft,
  Settings,
  Edit,
  Heart,
  Gift,
  Users,
  Clock,
  MessageCircle,
  UserCheck,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user, logout, updateUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profilePic, setProfilePic] = useState(user?.profilePic ?? "");

  const isOwnProfile = userId === user?.id;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace({ pathname: '/auth' });
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile || !user) {
      setEditOpen(false);
      return;
    }
    await updateUser({ username: name, bio, profilePic });
    setEditOpen(false);
  };

  const profileData = isOwnProfile
    ? user
    : {
        id: userId,
        username: "StreamUser",
        bio: "Live streaming enthusiast",
        profilePic: `https://i.pravatar.cc/150?u=${userId}`,
        followers: 1234,
        following: 567,
        totalLikes: 45678,
        coinsEarned: 12345,
        isVerified: false,
      };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          {isOwnProfile && (
            <TouchableOpacity onPress={() => router.push({ pathname: '/settings' })}>
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#E30CBD", "#6900D1"]}
            style={styles.profileHeader}
          >
            <Image
              source={{ uri: profileData?.profilePic }}
              style={styles.profilePic}
            />
            <Text style={styles.username}>
              {profileData?.username}
              {profileData?.isVerified && " ✓"}
            </Text>
            <Text style={styles.bio}>{profileData?.bio}</Text>

            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  onPress={() => setIsFollowing(!isFollowing)}
                >
                  <UserCheck size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            {isOwnProfile && (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditOpen(true)}>
                <Edit size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={20} color="#E30CBD" />
              <Text style={styles.statNumber}>{profileData?.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={20} color="#6900D1" />
              <Text style={styles.statNumber}>{profileData?.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={20} color="#FF006E" />
              <Text style={styles.statNumber}>{profileData?.totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Gift size={20} color="#FFD700" />
              <Text style={styles.statNumber}>{profileData?.coinsEarned}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          </View>

          {isOwnProfile && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream Stats</Text>
              <View style={styles.streamStats}>
                <View style={[styles.streamStatCard, { borderColor: '#FF006E' }] }>
                  <Clock size={24} color="#FF006E" />
                  <Text style={styles.streamStatValue}>12h 30m</Text>
                  <Text style={styles.streamStatLabel}>This Week</Text>
                </View>
                <View style={[styles.streamStatCard, { borderColor: '#00E5FF' }] }>
                  <Clock size={24} color="#00E5FF" />
                  <Text style={styles.streamStatValue}>48h 15m</Text>
                  <Text style={styles.streamStatLabel}>This Month</Text>
                </View>
              </View>
            </View>
          )}

          {isOwnProfile && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Profile Image URL"
              placeholderTextColor="#999"
              value={profilePic}
              onChangeText={setProfilePic}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Bio"
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#E30CBD' }]} onPress={handleSaveProfile}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileHeader: {
    alignItems: "center",
    padding: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
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
  streamStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  streamStatCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(227, 12, 189, 0.2)",
  },
  streamStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  streamStatLabel: {
    color: "#999",
    fontSize: 12,
    marginTop: 5,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});