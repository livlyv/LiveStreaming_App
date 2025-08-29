import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Alert,
  Animated,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import { useStreams } from "@/providers/StreamProvider";
import { useWallet } from "@/providers/WalletProvider";
import {
  X,
  Heart,
  Gift,
  UserPlus,
  Eye,
  Send,
  AlertTriangle,
} from "lucide-react-native";
import { GiftAnimation } from "@/components/GiftAnimation";
import { checkForProfanity } from "@/utils/moderation";

const { width, height } = Dimensions.get("window");

interface Viewer {
  id: string;
  username: string;
  profilePic: string;
  coinsSent: number;
}

export default function StreamViewerScreen() {
  const { streamId } = useLocalSearchParams();
  const { user } = useAuth();
  const { currentStream, messages, sendMessage, sendGift, viewerCount } = useStreams();
  const { coins, gifts, sendGift: deductCoins } = useWallet();
  
  const [message, setMessage] = useState("");
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [currentGiftAnimation, setCurrentGiftAnimation] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likes, setLikes] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: string; x: number }>>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [newMessageSinceScroll, setNewMessageSinceScroll] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const viewers = useMemo<Viewer[]>(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: `${i + 1}`,
      username: `viewer_${i + 1}`,
      profilePic: `https://i.pravatar.cc/100?u=${i + 1}`,
      coinsSent: Math.floor(Math.random() * 500),
    })),
  []);

  useEffect(() => {
    console.log("Joined stream:", streamId);
  }, [streamId]);

  useEffect(() => {
    const sub = setInterval(() => {
      if (scrolledUp) setNewMessageSinceScroll(true);
    }, 2000);
    return () => clearInterval(sub);
  }, [scrolledUp]);

  const handleSendMessage = () => {
    if (!message.trim() || isMuted) return;

    const hasProfanity = checkForProfanity(message);
    if (hasProfanity) {
      if (warningCount >= 2) {
        setIsMuted(true);
        Alert.alert("Muted", "You have been muted for 10 minutes due to inappropriate language");
        setTimeout(() => setIsMuted(false), 600000);
        return;
      } else {
        setWarningCount(warningCount + 1);
        Alert.alert("Warning", `Inappropriate language detected. Warning ${warningCount + 1}/3`);
        return;
      }
    }

    sendMessage(message, user?.username || "Anonymous");
    setMessage("");
  };

  const handleSendGift = async (gift: any) => {
    if (coins < gift.cost) {
      Alert.alert("Insufficient Coins", "You need more coins to send this gift");
      return;
    }

    const success = await deductCoins(gift, currentStream?.username || "Streamer");
    if (success) {
      sendGift(gift.name, user?.username || "Anonymous");
      setCurrentGiftAnimation(gift.animation);
      setShowGiftPanel(false);
      setTimeout(() => setCurrentGiftAnimation(null), 3000);
    }
  };

  const spawnHeart = () => {
    const id = Math.random().toString();
    const x = Math.random() * (width - 80) + 40;
    setHearts((prev) => [...prev, { id, x }]);
    setLikes((l) => l + 1);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  const onScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setScrolledUp(!atBottom);
    if (atBottom) setNewMessageSinceScroll(false);
  };

  const pinnedMessage = messages.find(m => m.isPinned);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: currentStream?.thumbnail || "https://picsum.photos/400/800" }}
        style={styles.videoBackground}
        blurRadius={2}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.streamerInfo}>
            <Image
              source={{ uri: currentStream?.profilePic || "https://i.pravatar.cc/150" }}
              style={styles.streamerAvatar}
            />
            <View style={styles.streamerDetails}>
              <Text style={styles.streamerName}>
                {currentStream?.username || "Streamer"}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.followText}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.viewerCount}
              onPress={() => setShowViewers(true)}
            >
              <Eye size={16} color="#FFFFFF" />
              <Text style={styles.viewerText}>{viewerCount || 1234}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {pinnedMessage && (
          <View style={styles.pinnedMessage}>
            <Text style={styles.pinnedText}>📌 {pinnedMessage.text}</Text>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: !scrolledUp })}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={styles.message}>
              <Text style={styles.messageUsername}>{msg.username}</Text>
              <Text style={styles.messageText}>
                {msg.isGift ? `${msg.giftType} ${msg.text}` : msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {scrolledUp && newMessageSinceScroll && (
          <TouchableOpacity
            style={styles.newMsgChip}
            onPress={() => {
              setNewMessageSinceScroll(false);
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Text style={styles.newMsgText}>New messages ▾</Text>
          </TouchableOpacity>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.bottomControls}
        >
          <View style={styles.chatInput}>
            <TextInput
              style={styles.input}
              placeholder={isMuted ? "You are muted" : "Send a message..."}
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              editable={!isMuted}
              testID="viewer-chat-input"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!message.trim() || isMuted}
              testID="viewer-send"
            >
              <Send size={20} color={message.trim() && !isMuted ? "#E30CBD" : "#666"} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.reportButton} onPress={() => setReportOpen(true)}>
              <AlertTriangle size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.giftButton}
              onPress={() => setShowGiftPanel(true)}
            >
              <Gift size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heartButton} onPress={spawnHeart}>
              <Heart size={28} color="#FF006E" fill="#FF006E" />
              <Text style={styles.likeCount}>{likes}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {hearts.map((h) => (
          <FloatingHeart key={h.id} x={h.x} />
        ))}
      </View>

      {showGiftPanel && (
        <TouchableOpacity
          style={styles.giftPanelOverlay}
          onPress={() => setShowGiftPanel(false)}
        >
          <View style={styles.giftPanel}>
            <View style={styles.giftPanelHeader}>
              <Text style={styles.giftPanelTitle}>Send Gift</Text>
              <Text style={styles.coinBalance}>💰 {coins} coins</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gifts.map((gift) => (
                <TouchableOpacity
                  key={gift.id}
                  style={styles.giftItem}
                  onPress={() => handleSendGift(gift)}
                >
                  <Text style={styles.giftIcon}>{gift.icon}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftCost}>{gift.cost} coins</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.topUpButton}
              onPress={() => {
                setShowGiftPanel(false);
                router.push({ pathname: '/purchase-coins' });
              }}
            >
              <LinearGradient
                colors={["#E30CBD", "#6900D1"]}
                style={styles.topUpGradient}
              >
                <Text style={styles.topUpText}>Top Up Coins</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={showViewers} transparent animationType="fade" onRequestClose={() => setShowViewers(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Viewers</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {viewers.map(v => (
                <View key={v.id} style={styles.viewerRow}>
                  <Image source={{ uri: v.profilePic }} style={styles.viewerAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewerName}>{v.username}</Text>
                    <Text style={styles.viewerCoins}>Coins sent: {v.coinsSent}</Text>
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

      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Stream</Text>
            <Text style={{ color: '#bbb', marginBottom: 10 }}>Tell us what's wrong</Text>
            {['Spam', 'Nudity', 'Hate Speech', 'Harassment'].map(reason => (
              <TouchableOpacity key={reason} style={styles.reasonChip} onPress={() => { setReportOpen(false); Alert.alert('Thanks', 'Thanks for your report. Our moderators will review this stream.'); }}>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setReportOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {currentGiftAnimation && <GiftAnimation type={currentGiftAnimation} />}
    </View>
  );
}

function FloatingHeart({ x }: { x: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -180, duration: 1200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.heartBubble, { left: x, transform: [{ translateY }], opacity }] }>
      <Heart size={20} color="#FF006E" fill="#FF006E" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoBackground: { position: "absolute", width, height },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" },
  header: { flexDirection: "row", justifyContent: "space-between", paddingTop: 50, paddingHorizontal: 15 },
  streamerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  streamerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#E30CBD" },
  streamerDetails: { marginLeft: 10 },
  streamerName: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  liveIndicator: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF0000", marginRight: 5 },
  liveText: { color: "#FF0000", fontSize: 12, fontWeight: "bold" },
  followButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#E30CBD", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 10 },
  followingButton: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  followText: { color: "#FFFFFF", fontSize: 12, marginLeft: 5, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  viewerCount: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 },
  viewerText: { color: "#FFFFFF", fontSize: 14, marginLeft: 5 },
  closeButton: { padding: 5 },
  pinnedMessage: { backgroundColor: "rgba(227, 12, 189, 0.3)", paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 15, marginTop: 10, borderRadius: 10 },
  pinnedText: { color: "#FFFFFF", fontSize: 14 },
  chatContainer: { flex: 1, paddingHorizontal: 15, marginTop: 10 },
  message: { marginBottom: 8, backgroundColor: "rgba(0, 0, 0, 0.3)", padding: 8, borderRadius: 8, alignSelf: "flex-start", maxWidth: "70%" },
  messageUsername: { color: "#E30CBD", fontSize: 12, fontWeight: "bold" },
  messageText: { color: "#FFFFFF", fontSize: 14, marginTop: 2 },
  newMsgChip: { position: 'absolute', bottom: 140, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  newMsgText: { color: '#fff', fontWeight: '600' },
  bottomControls: { paddingHorizontal: 15, paddingBottom: 30 },
  chatInput: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 25, paddingHorizontal: 15, marginBottom: 10 },
  input: { flex: 1, height: 45, color: "#FFFFFF", fontSize: 14 },
  sendButton: { padding: 5 },
  actionButtons: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  reportButton: { padding: 10 },
  giftButton: { padding: 10 },
  heartButton: { padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { color: '#fff', fontWeight: '700' },
  giftPanelOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, top: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  giftPanel: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  giftPanelHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  giftPanelTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  coinBalance: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
  giftItem: { alignItems: "center", marginRight: 20, padding: 10, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 10 },
  giftIcon: { fontSize: 40, marginBottom: 5 },
  giftName: { color: "#FFFFFF", fontSize: 12, marginBottom: 2 },
  giftCost: { color: "#FFD700", fontSize: 12, fontWeight: "bold" },
  topUpButton: { marginTop: 20, borderRadius: 25, overflow: "hidden" },
  topUpGradient: { paddingVertical: 12, alignItems: "center" },
  topUpText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  heartBubble: { position: 'absolute', bottom: 110 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalClose: { alignSelf: 'flex-end', marginTop: 8 },
  modalCloseText: { color: '#E30CBD', fontWeight: '700' },
  reasonChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  reasonText: { color: '#fff' },
  viewerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  viewerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, borderWidth: 1, borderColor: 'rgba(227,12,189,0.6)' },
  viewerName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewerCoins: { color: '#FFD700', fontSize: 12, marginTop: 2, fontWeight: '700' },
});
