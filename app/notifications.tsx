import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useNotifications } from "@/providers/NotificationProvider";
import {
  ArrowLeft,
  Video,
  UserPlus,
  Gift,
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react-native";

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "live":
        return <Video size={20} color="#FF0000" />;
      case "follow":
        return <UserPlus size={20} color="#E30CBD" />;
      case "gift":
        return <Gift size={20} color="#FFD700" />;
      default:
        return <Bell size={20} color="#6900D1" />;
    }
  };

  const handleNotificationPress = (notification: any) => {
    markAsRead(notification.id);
    if (notification.type === "live") {
      router.push({ pathname: '/stream/[streamId]', params: { streamId: String(notification.data?.streamId ?? '1') } });
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
              <CheckCheck size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={styles.headerButton}>
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={60} color="#666" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                When your friends go live or interact with you, you'll see it here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.iconContainer}>{getIcon(notification.type)}</View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 15,
  },
  notificationCard: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  unreadCard: {
    backgroundColor: "rgba(227, 12, 189, 0.05)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationMessage: {
    color: "#999",
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    color: "#666",
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E30CBD",
    alignSelf: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});