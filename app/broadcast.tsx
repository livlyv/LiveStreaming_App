import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import {
  X,
  FlipHorizontal,
  Camera,
  Mic,
  MicOff,
  Users,
  Clock,
  Gift,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface LiveViewer { id: string; username: string; avatar: string; coins: number }
interface LiveMessage { id: string; text: string; username: string; isGift?: boolean }

export default function BroadcastScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Music");
  const [beautyFilter, setBeautyFilter] = useState("none");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftsEarned, setGiftsEarned] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [messages, setMessages] = useState<LiveMessage[]>([]);

  const categories = ["Music", "Gaming", "Dance", "Talk", "Food", "Fitness"];
  const beautyFilters = [
    { id: "none", name: "None", icon: "✨" },
    { id: "smooth", name: "Smooth", icon: "🌟" },
    { id: "bright", name: "Bright", icon: "☀️" },
    { id: "glamour", name: "Glamour", icon: "💫" },
  ];

  const viewers = useMemo<LiveViewer[]>(() => Array.from({ length: 14 }).map((_, i) => ({ id: `${i+1}`, username: `fan_${i+1}`, avatar: `https://i.pravatar.cc/100?u=lv${i+1}`, coins: Math.floor(Math.random()*1000) })), []);

  useEffect(() => {
    if (isLive) {
      const tick = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
        if (Math.random() > 0.6) setViewerCount((prev) => prev + Math.floor(Math.random() * 5));
        if (Math.random() > 0.8) setMessages((prev) => [...prev, { id: Math.random().toString(), text: '🔥 Awesome!', username: `user_${prev.length%20}` }]);
        if (Math.random() > 0.9) {
          const giftCoins = [1,10,100,250][Math.floor(Math.random()*4)];
          setGiftsEarned((g) => g + giftCoins);
          setMessages((prev) => [...prev, { id: Math.random().toString(), text: `sent a gift (${giftCoins} coins)`, username: `gifter_${prev.length%10}`, isGift: true }]);
        }
        // Mock NSFW detection
        if (Math.random() > 0.995) {
          if (warnings < 2) {
            setWarnings((w) => w + 1);
            Alert.alert('Safety Warning', 'Potential inappropriate content detected. Please adjust your stream.');
          } else {
            setIsLive(false);
            setShowSummary(true);
            Alert.alert('Stream Ended', 'Your stream was ended due to repeated safety violations.');
          }
        }
      }, 1000);
      return () => clearInterval(tick);
    }
  }, [isLive, warnings]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGoLive = () => {
    if (!streamTitle.trim()) {
      Alert.alert("Error", "Please enter a stream title");
      return;
    }
    Alert.alert(
      "Content Guidelines",
      "By going live, you agree to our community guidelines. Inappropriate content may result in suspension.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go Live", onPress: () => { setIsLive(true); setViewerCount(Math.floor(Math.random()*50)+10); } },
      ]
    );
  };

  const handleEndStream = () => {
    Alert.alert("End Stream?", "Are you sure you want to end your live stream?", [
      { text: "Cancel", style: "cancel" },
      { text: "End Stream", style: "destructive", onPress: () => { setIsLive(false); setShowSummary(true); } },
    ]);
  };

  const filterOverlayStyle = useMemo(() => {
    if (beautyFilter === 'smooth') return { backgroundColor: 'rgba(255,192,203,0.08)' };
    if (beautyFilter === 'bright') return { backgroundColor: 'rgba(255,255,255,0.12)' };
    if (beautyFilter === 'glamour') return { backgroundColor: 'rgba(227,12,189,0.10)' };
    return { backgroundColor: 'transparent' };
  }, [beautyFilter]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to access the camera</Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient colors={["#E30CBD", "#6900D1"]} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLive) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.preStreamOverlay}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={[StyleSheet.absoluteFillObject as unknown as {}, filterOverlayStyle]} />
            <View style={styles.preStreamContent}>
              <Text style={styles.preStreamTitle}>Prepare Your Stream</Text>
              <TextInput style={styles.titleInput} placeholder="Enter stream title..." placeholderTextColor="#999" value={streamTitle} onChangeText={setStreamTitle} />
              <Text style={styles.sectionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat} style={[ styles.categoryChip, selectedCategory === cat && styles.categoryChipActive ]} onPress={() => setSelectedCategory(cat)}>
                    <Text style={[ styles.categoryText, selectedCategory === cat && styles.categoryTextActive ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.sectionLabel}>Beauty Filter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {beautyFilters.map((filter) => (
                  <TouchableOpacity key={filter.id} style={[ styles.filterChip, beautyFilter === filter.id && styles.filterChipActive ]} onPress={() => setBeautyFilter(filter.id)}>
                    <Text style={styles.filterIcon}>{filter.icon}</Text>
                    <Text style={[ styles.filterText, beautyFilter === filter.id && styles.filterTextActive ]}>{filter.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
                <FlipHorizontal size={20} color="#FFFFFF" />
                <Text style={styles.flipText}>Flip Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoLive}>
                <LinearGradient colors={["#E30CBD", "#FF006E"]} style={styles.goLiveButton}>
                  <Text style={styles.goLiveText}>Go Live</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraOn ? (
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.liveOverlay}>
            <View style={[StyleSheet.absoluteFillObject as unknown as {}, filterOverlayStyle]} />
            <View style={styles.liveHeader}>
              <View style={styles.liveStats}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={16} color="#FFFFFF" />
                  <Text style={styles.statText}>{formatDuration(streamDuration)}</Text>
                </View>
                <TouchableOpacity style={styles.statItem} onPress={() => setShowViewers(true)}>
                  <Users size={16} color="#FFFFFF" />
                  <Text style={styles.statText}>{viewerCount}</Text>
                </TouchableOpacity>
                <View style={styles.statItem}>
                  <Gift size={16} color="#FFFFFF" />
                  <Text style={styles.statText}>{giftsEarned}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.endButton} onPress={handleEndStream}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {messages.slice(-20).map(m => (
                  <View key={m.id} style={[styles.chatBubble, m.isGift && styles.chatGift]}>
                    <Text style={styles.chatUser}>{m.username}</Text>
                    <Text style={styles.chatText}>{m.text}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.liveControls}>
              <TouchableOpacity style={styles.controlButton} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
                <FlipHorizontal size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => setIsCameraOn(!isCameraOn)}>
                <Camera size={24} color={isCameraOn ? "#FFFFFF" : "#FF0000"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => setIsMuted(!isMuted)}>
                {isMuted ? (<MicOff size={24} color="#FF0000" />) : (<Mic size={24} color="#FFFFFF" />)}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.cameraOffView}>
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profileInitial}>{user?.username?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <Text style={styles.cameraOffText}>Camera is off</Text>
        </View>
      )}

      <Modal visible={showViewers} transparent animationType="fade" onRequestClose={() => setShowViewers(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Viewers</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {viewers.map(v => (
                <View key={v.id} style={styles.viewerRow}>
                  <View style={styles.viewerAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewerName}>{v.username}</Text>
                    <Text style={styles.viewerCoins}>Coins sent: {v.coins}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowViewers(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSummary} transparent animationType="slide" onRequestClose={() => setShowSummary(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderColor: 'rgba(227,12,189,0.5)' }] }>
            <Text style={styles.modalTitle}>Stream Ended</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: '#4159A4' }]}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{formatDuration(streamDuration)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#E30CBD' }]}>
                <Text style={styles.summaryLabel}>Viewers</Text>
                <Text style={styles.summaryValue}>{viewerCount}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: '#FFD700' }]}>
                <Text style={styles.summaryLabel}>Gifts earned</Text>
                <Text style={styles.summaryValue}>{giftsEarned} coins</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#00C2FF' }]}>
                <Text style={styles.summaryLabel}>New Followers</Text>
                <Text style={styles.summaryValue}>{Math.floor(viewerCount/5)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.endBtn} onPress={() => { setShowSummary(false); router.back(); }} testID="summaryClose">
              <LinearGradient colors={["#E30CBD", "#6900D1"]} style={styles.endBtnGrad}>
                <Text style={styles.endBtnText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070506", justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  permissionText: { color: "#FFFFFF", fontSize: 18, marginBottom: 20, textAlign: "center" },
  permissionButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  permissionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  preStreamOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)" },
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 },
  preStreamContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  preStreamTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  titleInput: { backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 15, color: "#FFFFFF", fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: "rgba(227, 12, 189, 0.3)" },
  sectionLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginBottom: 10, marginTop: 10 },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.1)", marginRight: 10, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" },
  categoryChipActive: { backgroundColor: "rgba(227, 12, 189, 0.3)", borderColor: "#E30CBD" },
  categoryText: { color: "#999", fontSize: 14 },
  categoryTextActive: { color: "#FFFFFF", fontWeight: "bold" },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.1)", marginRight: 10, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" },
  filterChipActive: { backgroundColor: "rgba(227, 12, 189, 0.3)", borderColor: "#E30CBD" },
  filterIcon: { fontSize: 20, marginRight: 5 },
  filterText: { color: "#999", fontSize: 14 },
  filterTextActive: { color: "#FFFFFF", fontWeight: "bold" },
  flipButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.1)", paddingVertical: 12, borderRadius: 25, marginTop: 20, marginBottom: 20 },
  flipText: { color: "#FFFFFF", fontSize: 16, marginLeft: 10 },
  goLiveButton: { paddingVertical: 18, borderRadius: 30, alignItems: "center" },
  goLiveText: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  liveOverlay: { flex: 1, justifyContent: "space-between" },
  liveHeader: { flexDirection: "row", justifyContent: "space-between", paddingTop: 50, paddingHorizontal: 20 },
  liveStats: { flexDirection: "row", alignItems: "center" },
  liveBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FF0000", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", marginRight: 5 },
  liveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  statItem: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 },
  statText: { color: "#FFFFFF", fontSize: 14, marginLeft: 5 },
  endButton: { backgroundColor: "#FF0000", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  chatBox: { position: 'absolute', left: 12, right: 12, bottom: 110, maxHeight: 180, padding: 8 },
  chatBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
  chatGift: { borderWidth: 1, borderColor: 'rgba(255,215,0,0.6)' },
  chatUser: { color: '#E30CBD', fontWeight: '700', fontSize: 12 },
  chatText: { color: '#fff', fontSize: 14 },
  liveControls: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingBottom: 30 },
  controlButton: { backgroundColor: "rgba(0, 0, 0, 0.5)", width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginLeft: 10 },
  cameraOffView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#070506" },
  profilePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(227, 12, 189, 0.3)", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  profileInitial: { color: "#FFFFFF", fontSize: 48, fontWeight: "bold" },
  cameraOffText: { color: "#999", fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalClose: { alignSelf: 'flex-end', marginTop: 8 },
  modalCloseText: { color: '#E30CBD', fontWeight: '700' },
  viewerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  viewerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: 'rgba(227,12,189,0.3)' },
  viewerName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewerCoins: { color: '#FFD700', fontSize: 12, marginTop: 2, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, borderWidth: 1 },
  summaryLabel: { color: '#bbb', marginBottom: 6, fontWeight: '600' },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  endBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  endBtnGrad: { paddingVertical: 12, alignItems: 'center' },
  endBtnText: { color: '#fff', fontWeight: '800' },
});