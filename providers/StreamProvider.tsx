import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";

interface Stream {
  id: string;
  username: string;
  profilePic: string;
  thumbnail: string;
  viewers: number;
  category: string;
  isNew: boolean;
  isNearby: boolean;
  title: string;
  isLive: boolean;
}

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isGift?: boolean;
  giftType?: string;
  isPinned?: boolean;
}

export const [StreamProvider, useStreams] = createContextHook(() => {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    generateMockStreams();
  }, []);

  const generateMockStreams = () => {
    const mockStreams: Stream[] = [
      {
        id: "1",
        username: "Jennifer_Branson",
        profilePic: "https://i.pravatar.cc/150?img=1",
        thumbnail: "https://picsum.photos/400/600?random=1",
        viewers: 24000,
        category: "Music",
        isNew: false,
        isNearby: true,
        title: "Live Music Session 🎤",
        isLive: true,
      },
      {
        id: "2",
        username: "GamerPro2024",
        profilePic: "https://i.pravatar.cc/150?img=2",
        thumbnail: "https://picsum.photos/400/600?random=2",
        viewers: 15000,
        category: "Gaming",
        isNew: false,
        isNearby: false,
        title: "Epic Gaming Marathon",
        isLive: true,
      },
      {
        id: "3",
        username: "DanceQueen",
        profilePic: "https://i.pravatar.cc/150?img=3",
        thumbnail: "https://picsum.photos/400/600?random=3",
        viewers: 8500,
        category: "Dance",
        isNew: true,
        isNearby: true,
        title: "Dance Party Time! 💃",
        isLive: true,
      },
      {
        id: "4",
        username: "TechTalks",
        profilePic: "https://i.pravatar.cc/150?img=4",
        thumbnail: "https://picsum.photos/400/600?random=4",
        viewers: 3200,
        category: "Tech",
        isNew: true,
        isNearby: false,
        title: "Coding Live",
        isLive: true,
      },
      {
        id: "5",
        username: "FoodieLife",
        profilePic: "https://i.pravatar.cc/150?img=5",
        thumbnail: "https://picsum.photos/400/600?random=5",
        viewers: 5600,
        category: "Food",
        isNew: false,
        isNearby: true,
        title: "Cooking Show",
        isLive: true,
      },
      {
        id: "6",
        username: "FitnessGuru",
        profilePic: "https://i.pravatar.cc/150?img=6",
        thumbnail: "https://picsum.photos/400/600?random=6",
        viewers: 7800,
        category: "Fitness",
        isNew: false,
        isNearby: false,
        title: "Morning Workout",
        isLive: true,
      },
    ];
    setLiveStreams(mockStreams);
  };

  const refreshStreams = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        generateMockStreams();
        resolve(true);
      }, 1000);
    });
  };

  const sendMessage = (text: string, username: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      username,
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendGift = (giftType: string, username: string) => {
    const giftMessage: Message = {
      id: Date.now().toString(),
      username,
      text: `sent a ${giftType}!`,
      timestamp: Date.now(),
      isGift: true,
      giftType,
    };
    setMessages((prev) => [...prev, giftMessage]);
  };

  const pinMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        isPinned: msg.id === messageId,
      }))
    );
  };

  return {
    liveStreams,
    currentStream,
    setCurrentStream,
    messages,
    setMessages,
    viewerCount,
    setViewerCount,
    refreshStreams,
    sendMessage,
    sendGift,
    pinMessage,
  };
});