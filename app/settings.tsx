import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/services/api";
import { logger } from "@/lib/logger";
import {
  ArrowLeft,
  Bell,
  Lock,
  UserX,
  HelpCircle,
  FileText,
  Trash2,
  LogOut,
  Shield,
  Mail,
  Phone,
  MessageCircle,
  RefreshCw,
} from "lucide-react-native";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [giftNotifications, setGiftNotifications] = useState<boolean>(true);
  const [liveNotifications, setLiveNotifications] = useState<boolean>(true);
  const [showBlocked, setShowBlocked] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [showPolicy, setShowPolicy] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; username: string; profile_pic?: string; reason?: string; blocked_at: string }>>([]);
  const [supportForm, setSupportForm] = useState<{ topic: string; email: string; details: string }>({ topic: '', email: '', details: '' });
  const [showTopicMenu, setShowTopicMenu] = useState<boolean>(false);
  const topicOptions: string[] = [
    'Coin purchases',
    'Gifting',
    'Withdraw Problem',
    'Inappropriate streamer behavior',
    'Account Related',
    'Technical Issues',
    'Other',
  ];

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
    loadBlockedUsers();
  }, []);

  const loadUserSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await apiClient.getUserSettings();
      const settings = response.settings;
      
      setNotificationsEnabled(settings.notifications_enabled);
      setGiftNotifications(settings.gift_notifications);
      setLiveNotifications(settings.live_notifications);
    } catch (error) {
      logger.error('UI', 'Error loading user settings', null, error);
      // Keep default values
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const response = await apiClient.getBlockedUsers();
      setBlockedUsers(response.blocked_users);
    } catch (error) {
      logger.error('UI', 'Error loading blocked users', null, error);
      setBlockedUsers([]);
    }
  };

  const updateNotificationSettings = async (type: 'all' | 'gift' | 'live', value: boolean) => {
    try {
      setLoading(true);
      
      let settings: any = {};
      switch (type) {
        case 'all':
          settings = { notifications_enabled: value };
          setNotificationsEnabled(value);
          if (!value) {
            setGiftNotifications(false);
            setLiveNotifications(false);
            settings.gift_notifications = false;
            settings.live_notifications = false;
          }
          break;
        case 'gift':
          settings = { gift_notifications: value };
          setGiftNotifications(value);
          break;
        case 'live':
          settings = { live_notifications: value };
          setLiveNotifications(value);
          break;
      }

      await apiClient.updateUserSettings(settings);
      logger.info('UI', 'Notification settings updated', { type, value });
    } catch (error) {
      logger.error('UI', 'Error updating notification settings', { type, value }, error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

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
            try {
              setLoading(true);
              // TODO: Implement account deletion API call
              await logout();
              router.replace({ pathname: '/auth' });
            } catch (error) {
              logger.error('UI', 'Error deleting account', null, error);
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setLoading(false);
            }
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
          try {
            setLoading(true);
            await logout();
            router.replace({ pathname: '/auth' });
          } catch (error) {
            logger.error('UI', 'Error logging out', null, error);
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleUnblockUser = async (userId: string) => {
    Alert.alert(
      "Unblock User",
      "Are you sure you want to unblock this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.unblockUser(userId);
              setBlockedUsers(prev => prev.filter(user => user.id !== userId));
              Alert.alert("Success", "User has been unblocked.");
              logger.info('UI', 'User unblocked', { userId });
            } catch (error) {
              logger.error('UI', 'Error unblocking user', { userId }, error);
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitSupport = async () => {
    if (!supportForm.topic || !supportForm.email || !supportForm.details) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.submitSupportComplaint({
        topic: supportForm.topic,
        subject: `Support Request: ${supportForm.topic}`,
        description: supportForm.details,
        email: supportForm.email,
        phone: user?.phone
      });

      Alert.alert(
        "Support Request Submitted",
        "Thank you for contacting us. We'll get back to you within 24 hours.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowSupport(false);
              setSupportForm({ topic: '', email: '', details: '' });
            },
          },
        ]
      );
      logger.info('UI', 'Support complaint submitted', { topic: supportForm.topic });
    } catch (error) {
      logger.error('UI', 'Error submitting support request', null, error);
      Alert.alert(
        "Error",
        "Failed to submit support request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const settingsItems = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
      action: "section" as const,
      children: [
        {
          title: "All Notifications",
          value: notificationsEnabled,
          onValueChange: (value: boolean) => updateNotificationSettings('all', value),
        },
        {
          title: "Gift Notifications",
          value: giftNotifications,
          onValueChange: (value: boolean) => updateNotificationSettings('gift', value),
        },
        {
          title: "Live Stream Notifications",
          value: liveNotifications,
          onValueChange: (value: boolean) => updateNotificationSettings('live', value),
        },
      ],
    },
    {
      icon: UserX,
      title: "Blocked Users",
      description: `${blockedUsers.length} users blocked`,
      action: "navigate" as const,
      onPress: () => setShowBlocked(true),
    },
    {
      icon: HelpCircle,
      title: "Customer Support",
      description: "Get help and report issues",
      action: "navigate" as const,
      onPress: () => setShowSupport(true),
    },
    {
      icon: FileText,
      title: "Privacy Policy",
      description: "Read our privacy guidelines",
      action: "navigate" as const,
      onPress: () => setShowPolicy(true),
    },
    {
      icon: Trash2,
      title: "Delete Account",
      description: "Permanently delete your account",
      action: "function" as const,
      onPress: handleDeleteAccount,
    },
  ];

  if (settingsLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E30CBD" />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={loadUserSettings} disabled={loading}>
            <RefreshCw size={20} color="#E30CBD" style={loading ? { opacity: 0.5 } : {}} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {settingsItems.map((item, index) => (
            <View key={index} style={styles.section}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={item.action === "navigate" ? item.onPress : item.action === "function" ? item.onPress : undefined}
              >
                <View style={styles.settingIcon}>
                  <item.icon size={24} color="#E30CBD" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                {item.action === "function" && (
                  <View style={styles.actionIcon}>
                    <Trash2 size={20} color="#FF5252" style={loading ? { opacity: 0.5 } : {}} />
                  </View>
                )}
              </TouchableOpacity>

              {item.action === "section" && item.children && (
                <View style={styles.subSettings}>
                  {item.children.map((child, childIndex) => (
                    <View key={childIndex} style={styles.subSettingItem}>
                      <Text style={styles.subSettingTitle}>{child.title}</Text>
                      <Switch
                        value={child.value}
                        onValueChange={child.onValueChange}
                        trackColor={{ false: "#767577", true: "#E30CBD" }}
                        thumbColor={child.value ? "#fff" : "#f4f3f4"}
                        disabled={loading}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
            <LogOut size={20} color="#FF5252" style={loading ? { opacity: 0.5 } : {}} />
            <Text style={[styles.logoutText, loading && { opacity: 0.5 }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Blocked Users Modal */}
      <Modal visible={showBlocked} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Blocked Users</Text>
              <TouchableOpacity onPress={() => setShowBlocked(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {blockedUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <UserX size={48} color="#666" />
                <Text style={styles.emptyText}>No blocked users</Text>
              </View>
            ) : (
              <ScrollView style={styles.blockedList}>
                {blockedUsers.map((user) => (
                  <View key={user.id} style={styles.blockedUserItem}>
                    <Image 
                      source={{ uri: user.profile_pic || 'https://ui-avatars.com/api/?name=' + user.username + '&background=E30CBD&color=fff' }} 
                      style={styles.blockedUserAvatar} 
                    />
                    <View style={styles.blockedUserInfo}>
                      <Text style={styles.blockedUsername}>@{user.username}</Text>
                      {user.reason && (
                        <Text style={styles.blockedReason}>Reason: {user.reason}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() => handleUnblockUser(user.id)}
                      disabled={loading}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal visible={showSupport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Support</Text>
              <TouchableOpacity onPress={() => setShowSupport(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Issue Type</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTopicMenu(!showTopicMenu)}
              >
                <Text style={styles.dropdownText}>
                  {supportForm.topic || "Select an issue type"}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              
              {showTopicMenu && (
                <View style={styles.dropdownMenu}>
                  {topicOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSupportForm(prev => ({ ...prev, topic: option }));
                        setShowTopicMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={supportForm.email}
                onChangeText={(text) => setSupportForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Details</Text>
              <TextInput
                style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#666"
                value={supportForm.details}
                onChangeText={(text) => setSupportForm(prev => ({ ...prev, details: text }))}
                multiline
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && { opacity: 0.5 }]} 
              onPress={handleSubmitSupport}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPolicy} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPolicy(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.policyContent}>
              <Text style={styles.policyText}>
                <Text style={styles.policyHeading}>Privacy Policy</Text>
                {"\n\n"}
                Last updated: {new Date().toLocaleDateString()}
                {"\n\n"}
                <Text style={styles.policySection}>1. Information We Collect</Text>
                {"\n"}
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
                {"\n\n"}
                <Text style={styles.policySection}>2. How We Use Your Information</Text>
                {"\n"}
                We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
                {"\n\n"}
                <Text style={styles.policySection}>3. Information Sharing</Text>
                {"\n"}
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.
                {"\n\n"}
                <Text style={styles.policySection}>4. Data Security</Text>
                {"\n"}
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or destruction.
                {"\n\n"}
                <Text style={styles.policySection}>5. Your Rights</Text>
                {"\n"}
                You have the right to access, update, or delete your personal information. Contact us to exercise these rights.
                {"\n\n"}
                <Text style={styles.policySection}>6. Contact Us</Text>
                {"\n"}
                If you have questions about this Privacy Policy, please contact us at privacy@rork.app
              </Text>
            </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    color: "#999",
    fontSize: 14,
    marginTop: 2,
  },
  actionIcon: {
    marginLeft: 8,
  },
  subSettings: {
    marginTop: 8,
    marginHorizontal: 20,
  },
  subSettingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  subSettingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 82, 82, 0.3)",
  },
  logoutText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    color: "#999",
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
  blockedList: {
    padding: 20,
  },
  blockedUserItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  blockedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUsername: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  blockedReason: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: "#E30CBD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unblockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  formGroup: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  formLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  dropdownArrow: {
    color: "#999",
    fontSize: 12,
  },
  dropdownMenu: {
    backgroundColor: "#222",
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownItemText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#E30CBD",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  policyContent: {
    padding: 20,
  },
  policyText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  policyHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E30CBD",
  },
  policySection: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E30CBD",
  },
});