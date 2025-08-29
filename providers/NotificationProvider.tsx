import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Notification {
  id: string;
  type: "live" | "follow" | "gift" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    generateMockNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const saved = await AsyncStorage.getItem("notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const generateMockNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "live",
        title: "Jennifer_Branson is live!",
        message: "🔴 Join the live stream now",
        timestamp: Date.now() - 300000,
        read: false,
      },
      {
        id: "2",
        type: "follow",
        title: "New follower",
        message: "GamerPro2024 started following you",
        timestamp: Date.now() - 3600000,
        read: false,
      },
      {
        id: "3",
        type: "gift",
        title: "You received a gift!",
        message: "DanceQueen sent you a Crown 👑",
        timestamp: Date.now() - 7200000,
        read: true,
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    await AsyncStorage.setItem("notifications", JSON.stringify(updated));
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    await AsyncStorage.setItem("notifications", JSON.stringify(updated));
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await AsyncStorage.removeItem("notifications");
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
});