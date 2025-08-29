import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Transaction {
  id: string;
  type: "purchase" | "gift_sent" | "gift_received";
  amount: number;
  description: string;
  timestamp: number;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  animation: string;
}

export const [WalletProvider, useWallet] = createContextHook(() => {
  const [coins, setCoins] = useState(100);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const gifts: Gift[] = [
    { id: "1", name: "Rose", icon: "🌹", cost: 1, animation: "rose" },
    { id: "2", name: "Microphone", icon: "🎤", cost: 10, animation: "mic" },
    { id: "3", name: "Fireworks", icon: "🎆", cost: 100, animation: "fireworks" },
    { id: "4", name: "Heart", icon: "❤️", cost: 250, animation: "heart" },
    { id: "5", name: "Gold Coins", icon: "🥇", cost: 500, animation: "coins" },
    { id: "6", name: "Castle", icon: "🏰", cost: 1000, animation: "castle" },
    { id: "7", name: "Crown", icon: "👑", cost: 2500, animation: "crown" },
  ];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const walletData = await AsyncStorage.getItem("wallet");
      if (walletData) {
        const { coins: savedCoins, transactions: savedTransactions } = JSON.parse(walletData);
        setCoins(savedCoins);
        setTransactions(savedTransactions);
      }
    } catch (error) {
      console.error("Failed to load wallet:", error);
    }
  };

  const saveWalletData = async (newCoins: number, newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(
        "wallet",
        JSON.stringify({ coins: newCoins, transactions: newTransactions })
      );
    } catch (error) {
      console.error("Failed to save wallet:", error);
    }
  };

  const purchaseCoins = async (amount: number, price: number) => {
    const newCoins = coins + amount;
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "purchase",
      amount,
      description: `Purchased ${amount} coins for ₹${price}`,
      timestamp: Date.now(),
    };
    
    const newTransactions = [transaction, ...transactions];
    setCoins(newCoins);
    setTransactions(newTransactions);
    await saveWalletData(newCoins, newTransactions);
  };

  const sendGift = async (gift: Gift, streamerName: string) => {
    if (coins < gift.cost) {
      return false;
    }

    const newCoins = coins - gift.cost;
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "gift_sent",
      amount: -gift.cost,
      description: `Sent ${gift.name} to ${streamerName}`,
      timestamp: Date.now(),
    };

    const newTransactions = [transaction, ...transactions];
    setCoins(newCoins);
    setTransactions(newTransactions);
    await saveWalletData(newCoins, newTransactions);
    return true;
  };

  return {
    coins,
    transactions,
    gifts,
    purchaseCoins,
    sendGift,
  };
});