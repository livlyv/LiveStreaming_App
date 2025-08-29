import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, Trophy, Gift, Users, TrendingUp } from "lucide-react-native";

export default function EarningsScreen() {
  const earnings = {
    sinceLastWithdraw: 5430,
    topGifter: { name: "@RichFan", coins: 3200 },
    achievements: [
      { id: "1", label: "Rose Lover", value: 120 },
      { id: "2", label: "Fireworks", value: 35 },
      { id: "3", label: "Crown King", value: 3 },
    ],
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={{ width: 24 }} />
        </View>

        <LinearGradient colors={["#E30CBD", "#6900D1"]} style={styles.hero}>
          <Trophy size={36} color="#fff" />
          <Text style={styles.heroValue}>{earnings.sinceLastWithdraw} coins</Text>
          <Text style={styles.heroLabel}>Since last withdrawal</Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Gifter</Text>
            <View style={styles.topGifterCard}>
              <Users size={24} color="#fff" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.topGifterName}>{earnings.topGifter.name}</Text>
                <Text style={styles.topGifterCoins}>{earnings.topGifter.coins} coins</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gift Achievements</Text>
            {earnings.achievements.map(a => (
              <View key={a.id} style={styles.achievementRow}>
                <Gift size={18} color="#FFD700" />
                <Text style={styles.achievementLabel}>{a.label}</Text>
                <Text style={styles.achievementValue}>{a.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trends</Text>
            <View style={styles.trendCard}>
              <TrendingUp size={20} color="#4CAF50" />
              <Text style={styles.trendText}>Earnings trending up 12% this week</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070506' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  hero: { margin: 20, padding: 24, borderRadius: 20, alignItems: 'center' },
  heroValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  topGifterCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(227,12,189,0.2)' },
  topGifterName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topGifterCoins: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  achievementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 8 },
  achievementLabel: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 10 },
  achievementValue: { color: '#FFD700', fontSize: 14, fontWeight: '800' },
  trendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.15)', padding: 14, borderRadius: 12 },
  trendText: { color: '#b2e5b5', marginLeft: 10, fontWeight: '700' },
});