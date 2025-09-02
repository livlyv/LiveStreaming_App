import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  Image,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useStreams } from "@/providers/StreamProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import {
  Bell,
  Search,
  MapPin,
  Trophy,
  Sparkles,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 30) / 2;

export default function HomeScreen() {
  const { user } = useAuth();
  const { liveStreams, refreshStreams } = useStreams();
  const { unreadCount } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState("Popular");
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const categories = [
    { name: "Popular", icon: Trophy },
    { name: "Nearby", icon: MapPin },
    { name: "New", icon: Sparkles },
    { name: "Music", icon: null },
    { name: "Gaming", icon: null },
    { name: "Dance", icon: null },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStreams();
    setRefreshing(false);
  };

  const filteredStreams = useMemo(() => {
    const base = liveStreams.filter((stream) => {
      if (selectedCategory === "Popular") return stream.viewers > 1000;
      if (selectedCategory === "New") return stream.isNew;
      if (selectedCategory === "Nearby") return stream.isNearby;
      return stream.category === selectedCategory;
    });
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(s => s.username.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [liveStreams, selectedCategory, query]);

  const renderStreamCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.streamCard}
      onPress={() => router.push({ pathname: '/stream/[streamId]', params: { streamId: String(item.id) } })}
      testID={`stream-card-${item.id}`}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.streamThumbnail} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.streamOverlay}
      >
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.streamInfo}>
          <Image source={{ uri: item.profilePic }} style={styles.streamerAvatar} />
          <View style={styles.streamDetails}>
            <Text style={styles.streamerName} numberOfLines={1}>
              {item.username}
            </Text>
            <Text style={styles.viewerCount}>👁 {item.viewers}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          {searchOpen ? (
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search streamers or categories"
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
                autoFocus
                testID="home-search-input"
              />
              <TouchableOpacity onPress={() => { setSearchOpen(false); setQuery(""); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.headerTitle}>Demo Streaming</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.push({ pathname: '/notifications' })}
                  testID="notifications-button"
                >
                  <Bell size={24} color="#FFFFFF" />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={() => setSearchOpen(true)} testID="open-search-button">
                  <Search size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const active = selectedCategory === category.name;
            return (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.name)}
                testID={`category-${category.name}`}
              >
                {Icon && <Icon size={16} color={active ? "#FFFFFF" : "#999"} />}
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList
          data={filteredStreams}
          renderItem={renderStreamCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.streamGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 20,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF006E",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  cancelText: {
    color: '#E30CBD',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    maxHeight: 40,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryChipActive: {
    backgroundColor: "rgba(227, 12, 189, 0.3)",
    borderColor: "#E30CBD",
  },
  categoryText: {
    color: "#999",
    fontSize: 14,
    marginLeft: 5,
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  streamGrid: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  streamCard: {
    width: cardWidth,
    height: 220,
    margin: 5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  streamThumbnail: {
    width: "100%",
    height: "100%",
  },
  streamOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "space-between",
    padding: 10,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 0, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 5,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  streamInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  streamerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#E30CBD",
  },
  streamDetails: {
    marginLeft: 8,
    flex: 1,
  },
  streamerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  viewerCount: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
});