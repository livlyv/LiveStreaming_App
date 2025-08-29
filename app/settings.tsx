import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import {
  ArrowLeft,
  Bell,
  Lock,
  UserX,
  HelpCircle,
  FileText,
  Trash2,
  LogOut,
} from "lucide-react-native";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(true);
  const [showBlocked, setShowBlocked] = React.useState<boolean>(false);
  const [showSupport, setShowSupport] = React.useState<boolean>(false);
  const [showPolicy, setShowPolicy] = React.useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = React.useState<Array<{ id: string; username: string; avatar: string }>>([
    { id: '1', username: 'toxic_guy', avatar: 'https://i.pravatar.cc/100?u=201' },
    { id: '2', username: 'spam_account', avatar: 'https://i.pravatar.cc/100?u=202' },
    { id: '3', username: 'rude_person', avatar: 'https://i.pravatar.cc/100?u=203' },
  ]);
  const [supportForm, setSupportForm] = React.useState<{ topic: string; email: string; details: string }>({ topic: '', email: '', details: '' });
  const [showTopicMenu, setShowTopicMenu] = React.useState<boolean>(false);
  const topicOptions: string[] = [
    'Coins related',
    'Gifting',
    'Withdraw Problem',
    'User Inappropriate Behaviour',
    'Account Related',
    'Other',
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? Your account and data will be scheduled for permanent deletion and will be fully removed after 30 days unless you log in again within that period.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace({ pathname: '/auth' });
          },
        },
      ]
    );
  };

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

  const settingsItems = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
      action: "switch" as const,
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      icon: UserX,
      title: "Blocked Users",
      description: "Manage blocked users",
      action: "navigate" as const,
      onPress: () => setShowBlocked(true),
    },
    {
      icon: HelpCircle,
      title: "Customer Support",
      description: "Submit a complaint or request",
      action: "navigate" as const,
      onPress: () => setShowSupport(true),
    },
    {
      icon: FileText,
      title: "Privacy Policy",
      description: "View our privacy policy",
      action: "navigate" as const,
      onPress: () => setShowPolicy(true),
    },
    {
      icon: Lock,
      title: "Account Privacy",
      description: "Control who can see your content",
      action: "navigate" as const,
      onPress: () => Alert.alert("Privacy", "Privacy settings coming soon"),
    },
    {
      icon: Trash2,
      title: "Delete Account",
      description: "Permanently delete your account",
      action: "navigate" as const,
      onPress: handleDeleteAccount,
      danger: true,
    },
    {
      icon: LogOut,
      title: "Logout",
      description: "Sign out of your account",
      action: "navigate" as const,
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.settingItem}
                onPress={item.action === "navigate" ? item.onPress : undefined}
                disabled={item.action === "switch"}
              >
                <View style={styles.settingLeft}>
                  <Icon
                    size={24}
                    color={item.danger ? "#FF5252" : "#E30CBD"}
                  />
                  <View style={styles.settingText}>
                    <Text
                      style={[
                        styles.settingTitle,
                        item.danger && styles.dangerText,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.settingDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                {item.action === "switch" && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: "#333", true: "#E30CBD" }}
                    thumbColor="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Blocked Users Modal */}
      <Modal visible={showBlocked} transparent animationType="fade" onRequestClose={() => setShowBlocked(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Blocked Users</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {blockedUsers.map(u => (
                <View key={u.id} style={styles.blockRow}>
                  <Image source={{ uri: u.avatar }} style={styles.blockAvatar} />
                  <Text style={styles.blockName}>{u.username}</Text>
                  <TouchableOpacity
                    style={styles.unblockBtn}
                    onPress={() => setBlockedUsers(prev => prev.filter(b => b.id !== u.id))}
                    testID={`unblock-${u.id}`}
                  >
                    <Text style={styles.unblockText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {blockedUsers.length === 0 && (
                <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 12 }}>No blocked users</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowBlocked(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal visible={showSupport} transparent animationType="slide" onRequestClose={() => setShowSupport(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Customer Support</Text>
            <Text style={{ color: '#bbb', marginBottom: 8 }}>Tell us your issue</Text>
            <TouchableOpacity
              style={[styles.textInput, styles.topicSelector]}
              onPress={() => setShowTopicMenu(true)}
              testID="topicSelector"
            >
              <Text style={{ color: supportForm.topic ? '#fff' : '#777' }}>
                {supportForm.topic || 'Select Topic'}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor="#777"
              value={supportForm.email}
              onChangeText={(t) => setSupportForm({ ...supportForm, email: t })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.textInput, { height: 120 }]}
              placeholder="Describe the problem with details..."
              placeholderTextColor="#777"
              value={supportForm.details}
              onChangeText={(t) => setSupportForm({ ...supportForm, details: t })}
              multiline
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#E30CBD', alignSelf: 'flex-end' }]}
              onPress={() => { setShowSupport(false); Alert.alert('Submitted', 'Your complaint has been submitted. We will reach out via email.'); }}
              testID="submitSupport"
            >
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowSupport(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Topic Dropdown Modal */}
      <Modal visible={showTopicMenu} transparent animationType="fade" onRequestClose={() => setShowTopicMenu(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 0, overflow: 'hidden' }] }>
            <Text style={[styles.modalTitle, { padding: 16 }]}>Select Topic</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {topicOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.topicRow}
                  onPress={() => { setSupportForm({ ...supportForm, topic: opt }); setShowTopicMenu(false); }}
                  testID={`topic-${opt}`}
                >
                  <Text style={styles.topicText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalClose, { padding: 12 }]} onPress={() => setShowTopicMenu(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPolicy} transparent animationType="slide" onRequestClose={() => setShowPolicy(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 500 }] }>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView>
              <Text style={styles.policyText}>
                Demo Streaming App respects your privacy. This policy explains what data we collect, how we use it, and your rights.
              </Text>
              <Text style={styles.policyHeader}>1. Data We Collect</Text>
              <Text style={styles.policyText}>Account info (username, phone/email), device metadata, usage analytics, coins purchases, gifts activity, and chat messages.</Text>
              <Text style={styles.policyHeader}>2. How We Use Data</Text>
              <Text style={styles.policyText}>Provide and improve services, personalize content, prevent fraud/abuse, enable purchases, and comply with law.</Text>
              <Text style={styles.policyHeader}>3. Sharing</Text>
              <Text style={styles.policyText}>We do not sell your data. We may share with processors (payments, analytics) under DPAs and with authorities when required.</Text>
              <Text style={styles.policyHeader}>4. Safety & Moderation</Text>
              <Text style={styles.policyText}>Automated and human moderation may review content that violates community guidelines (spam, nudity, hate speech, harassment).</Text>
              <Text style={styles.policyHeader}>5. Your Controls</Text>
              <Text style={styles.policyText}>You can edit profile, download data (upon request), and delete your account. Notification preferences are configurable.</Text>
              <Text style={styles.policyHeader}>6. Children</Text>
              <Text style={styles.policyText}>Service is not directed to children under 13. We remove underage accounts upon notice.</Text>
              <Text style={styles.policyHeader}>7. Data Retention</Text>
              <Text style={styles.policyText}>We retain data while your account is active and as needed for legal/operational purposes.</Text>
              <Text style={styles.policyHeader}>8. Security</Text>
              <Text style={styles.policyText}>We use industry-standard safeguards; no method is 100% secure.</Text>
              <Text style={styles.policyHeader}>9. Contact</Text>
              <Text style={styles.policyText}>privacy@demostreaming.app</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPolicy(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070506" },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  settingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.05)" },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingText: { marginLeft: 15, flex: 1 },
  settingTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  settingDescription: { color: "#999", fontSize: 14 },
  dangerText: { color: "#FF5252" },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalClose: { alignSelf: 'flex-end', marginTop: 8 },
  modalCloseText: { color: '#E30CBD', fontWeight: '700' },

  blockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  blockAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, borderWidth: 1, borderColor: 'rgba(227,12,189,0.6)' },
  blockName: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  unblockBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(227,12,189,0.25)', borderRadius: 10 },
  unblockText: { color: '#fff', fontWeight: '700' },

  textInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, color: '#fff', marginBottom: 10 },

  policyHeader: { color: '#fff', fontWeight: '800', marginTop: 10 },
  policyText: { color: '#bbb', marginTop: 6, lineHeight: 20 },

  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalButtonText: { color: '#fff', fontWeight: '700' },

  topicSelector: { justifyContent: 'center' },
  topicRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  topicText: { color: '#fff', fontSize: 16 },
});