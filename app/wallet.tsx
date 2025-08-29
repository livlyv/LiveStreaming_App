import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWallet } from "@/providers/WalletProvider";
import { ArrowLeft, Coins, ShoppingCart, Clock } from "lucide-react-native";

const coinPackages = [
  { id: "1", coins: 100, price: 50, bonus: 0 },
  { id: "2", coins: 500, price: 250, bonus: 50 },
  { id: "3", coins: 1000, price: 500, bonus: 150 },
  { id: "4", coins: 5000, price: 2000, bonus: 1000 },
];

export default function WalletScreen() {
  const { coins, transactions, purchaseCoins } = useWallet();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const calculateGST = (price: number) => {
    return price * 0.18;
  };

  const calculateTotal = (price: number) => {
    return price + calculateGST(price);
  };

  const handlePurchase = (pkg: any) => {
    const total = calculateTotal(pkg.price);
    Alert.alert(
      "Confirm Purchase",
      `Buy ${pkg.coins + pkg.bonus} coins for ₹${total.toFixed(2)} (incl. 18% GST)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            await purchaseCoins(pkg.coins + pkg.bonus, total);
            Alert.alert("Success", "Coins added to your wallet!");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 24 }} />
        </View>

        <LinearGradient
          colors={["#E30CBD", "#6900D1"]}
          style={styles.balanceCard}
        >
          <Coins size={40} color="#FFFFFF" />
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{coins} Coins</Text>
          <Text style={styles.conversionRate}>1 coin ≈ ₹0.60</Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buy Coins</Text>
            {coinPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={styles.packageCard}
                onPress={() => handlePurchase(pkg)}
              >
                <View style={styles.packageLeft}>
                  <Text style={styles.coinAmount}>{pkg.coins} Coins</Text>
                  {pkg.bonus > 0 && (
                    <Text style={styles.bonusText}>+{pkg.bonus} Bonus</Text>
                  )}
                </View>
                <View style={styles.packageRight}>
                  <Text style={styles.price}>₹{pkg.price}</Text>
                  <Text style={styles.gst}>+18% GST</Text>
                  <Text style={styles.total}>
                    Total: ₹{calculateTotal(pkg.price).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={40} color="#666" />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.slice(0, 10).map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDesc}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount > 0
                        ? styles.amountPositive
                        : styles.amountNegative,
                    ]}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount} coins
                  </Text>
                </View>
              ))
            )}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  balanceCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
    opacity: 0.9,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 5,
  },
  conversionRate: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 10,
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  packageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(227, 12, 189, 0.2)",
  },
  packageLeft: {
    flex: 1,
  },
  coinAmount: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  bonusText: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 5,
  },
  packageRight: {
    alignItems: "flex-end",
  },
  price: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  gst: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  total: {
    color: "#E30CBD",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDesc: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  transactionDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  amountPositive: {
    color: "#4CAF50",
  },
  amountNegative: {
    color: "#FF5252",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
});