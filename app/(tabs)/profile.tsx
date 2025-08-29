import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import {
  Settings,
  Edit,
  Heart,
  Gift,
  Users,
  Clock,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState<string>(user?.username ?? "");
  const [draftBio, setDraftBio] = useState<string>(user?.bio ?? "");
  const [draftPic, setDraftPic] = useState<string>(user?.profilePic ?? "");

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

  const weeklyData = [3, 2, 5, 1, 4, 6, 2];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/settings' })}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#E30CBD", "#6900D1"]}
            style={styles.profileHeader}
          >
            <Image
              source={{ uri: user?.profilePic }}
              style={styles.profilePic}
            />
            <Text style={styles.username}>
              {user?.username}
              {user?.isVerified && " ✓"}
            </Text>
            <Text style={styles.bio}>{user?.bio}</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setDraftName(user?.username ?? "");
                setDraftBio(user?.bio ?? "");
                setDraftPic(user?.profilePic ?? "");
                setEditOpen(true);
              }}
              testID="editProfileBtn"
            >
              <Edit size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: '#E30CBD' }]}> 
              <Text style={styles.statCardLabel}>Followers</Text>
              <Text style={styles.statCardValue}>{user?.followers ?? 0}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#6900D1' }]}> 
              <Text style={styles.statCardLabel}>Following</Text>
              <Text style={styles.statCardValue}>{user?.following ?? 0}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#FF006E' }]}> 
              <Text style={styles.statCardLabel}>Likes</Text>
              <Text style={styles.statCardValue}>{user?.totalLikes ?? 0}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#FFD700' }]}> 
              <Text style={styles.statCardLabel}>Coins</Text>
              <Text style={styles.statCardValue}>{user?.coinsEarned ?? 0}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <View style={styles.highlightsRow}>
              <View style={[styles.highlightItem, { backgroundColor: 'rgba(227,12,189,0.12)' }]}>
                <Text style={styles.highlightTitle}>Top Gifter</Text>
                <Text style={styles.highlightValue}>@rich_fan</Text>
              </View>
              <View style={[styles.highlightItem, { backgroundColor: 'rgba(255,215,0,0.12)' }]}>
                <Text style={styles.highlightTitle}>Best Gift</Text>
                <Text style={styles.highlightValue}>👑 Crown x2</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stream Stats</Text>
            <View style={styles.chartRow}>
              {weeklyData.map((h, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: 16 + h * 12 }]} />
                  <Text style={styles.barLabel}>{['S','M','T','W','T','F','S'][i]}</Text>
                </View>
              ))}
            </View>
          </View>

          {editOpen && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Profile Image URL</Text>
                  <TextInput
                    testID="editPic"
                    style={styles.textInput}
                    placeholder="https://..."
                    placeholderTextColor="#777"
                    value={draftPic}
                    onChangeText={setDraftPic}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    testID="editName"
                    style={styles.textInput}
                    placeholder="Your name"
                    placeholderTextColor="#777"
                    value={draftName}
                    onChangeText={setDraftName}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    testID="editBio"
                    style={[styles.textInput, { height: 90 }]}
                    placeholder="Tell something about you"
                    placeholderTextColor="#777"
                    value={draftBio}
                    onChangeText={setDraftBio}
                    multiline
                  />
                </View>
                <View style={styles.modalRow}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]} onPress={() => setEditOpen(false)}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="saveProfile"
                    style={[styles.modalButton, { backgroundColor: '#E30CBD' }]}
                    onPress={() => {
                      updateUser({
                        username: draftName ?? user?.username ?? '',
                        bio: draftBio ?? user?.bio ?? '',
                        profilePic: draftPic ?? user?.profilePic ?? '',
                      });
                      setEditOpen(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070506" },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  profileHeader: { alignItems: "center", padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  profilePic: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#FFFFFF", marginBottom: 15 },
  username: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 10 },
  bio: { fontSize: 16, color: "rgba(255, 255, 255, 0.9)", textAlign: "center", marginBottom: 20 },
  editButton: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.2)", paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold", marginLeft: 5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, borderWidth: 1 },
  statCardLabel: { color: '#bbb', marginBottom: 6, fontWeight: '600' },
  statCardValue: { color: '#fff', fontSize: 22, fontWeight: '800' },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  highlightsRow: { flexDirection: 'row', gap: 12 },
  highlightItem: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  highlightTitle: { color: '#bbb', marginBottom: 6, fontWeight: '600' },
  highlightValue: { color: '#fff', fontSize: 16, fontWeight: '700' },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 8 },
  barCol: { alignItems: 'center', width: 28 },
  bar: { width: 20, borderRadius: 10, backgroundColor: 'linear-gradient(180deg, #E30CBD, #6900D1)' as unknown as string },
  barLabel: { color: '#777', fontSize: 12, marginTop: 6 },

  logoutButton: { marginHorizontal: 20, marginBottom: 30, backgroundColor: "rgba(255, 0, 0, 0.2)", paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  logoutText: { color: "#FF5252", fontSize: 16, fontWeight: "bold" },

  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { color: '#bbb', marginBottom: 6, fontWeight: '600' },
  textInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, color: '#fff' },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalButtonText: { color: '#fff', fontWeight: '700' },
});