import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWallet } from "@/providers/WalletProvider";
import {
  Plus,
  CreditCard,
  Gift,
  TrendingUp,
  History,
  Wallet as WalletIcon,
} from "lucide-react-native";

export default function WalletScreen() {
  const { coins, transactions } = useWallet();

  const quickActions = [
    { icon: Plus, title: "Top Up", color: "#4CAF50", onPress: () => router.push({ pathname: '/purchase-coins' }) },
    { icon: Gift, title: "Send Gift", color: "#E30CBD", onPress: () => router.push({ pathname: '/stream/[streamId]', params: { streamId: '1' } }) },
    { icon: CreditCard, title: "Withdraw", color: "#FF9800", onPress: () => router.push({ pathname: '/purchase-coins' }) },
    { icon: TrendingUp, title: "Earnings", color: "#2196F3", onPress: () => router.push({ pathname: '/earnings' }) },
  ];

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/purchase-coins' })}>
            <History size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#E30CBD", "#6900D1"]}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <WalletIcon size={32} color="#FFFFFF" />
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{coins} coins</Text>
            <Text style={styles.balanceUsd}>≈ ${(coins * 0.01).toFixed(2)} USD</Text>
          </LinearGradient>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                      <Icon size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.transactions}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recent.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === "gift_received" ? "#4CAF50" : "#E30CBD" }
                  ]}>
                    <Gift size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === "gift_received" ? "#4CAF50" : "#E30CBD" }
                ]}>
                  {transaction.type === "gift_received" ? "+" : ""}{Math.abs(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  balanceCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  balanceHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    marginTop: 10,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceUsd: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  transactions: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  transactionDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});