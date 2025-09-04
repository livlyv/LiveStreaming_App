import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/services/api";
import { logger } from "@/lib/logger";
import {
  ArrowLeft,
  Wallet,
  Trophy,
  RefreshCw,
  Crown,
  Star,
  Gift,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Smartphone,
  Calendar,
  TrendingUp,
  Shield,
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function EarningsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [kycForm, setKycForm] = useState({
    document_type: '',
    document_number: '',
    full_name: '',
    date_of_birth: '',
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    withdrawal_method: 'bank',
    account_details: {
      account_number: '',
      ifsc_code: '',
      account_holder_name: '',
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      const [earningsResponse, kycResponse] = await Promise.all([
        apiClient.getEarnings(),
        apiClient.getKYCStatus()
      ]);

      setEarnings(earningsResponse);
      setKycStatus(kycResponse);
      
      logger.info('UI', 'Earnings data loaded successfully', {
        coinsEarned: earningsResponse.coins_earned,
        canWithdraw: earningsResponse.can_withdraw,
        kycStatus: kycResponse.kyc_status
      });
    } catch (error) {
      logger.error('UI', 'Error loading earnings data', null, error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const handleKYCSubmit = async () => {
    if (!kycForm.document_type || !kycForm.document_number || !kycForm.full_name || !kycForm.date_of_birth) {
      Alert.alert('Error', 'Please fill in all KYC fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.initiateKYC(kycForm);
      
      Alert.alert(
        'KYC Initiated',
        'Your KYC verification has been initiated. You will receive an update within 24-48 hours.',
        [{ text: 'OK', onPress: () => setShowKYCModal(false) }]
      );
      
      // Refresh data
      await loadEarningsData();
      
      logger.info('UI', 'KYC initiated successfully', { kycId: response.kyc_id });
    } catch (error) {
      logger.error('UI', 'Error initiating KYC', null, error);
      Alert.alert('Error', 'Failed to initiate KYC verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawalSubmit = async () => {
    const amount = parseInt(withdrawalForm.amount);
    
    if (!amount || amount < 5000) {
      Alert.alert('Error', 'Minimum withdrawal amount is 5000 coins');
      return;
    }

    if (amount > earnings.coins_earned) {
      Alert.alert('Error', 'Insufficient coin balance');
      return;
    }

    if (!withdrawalForm.account_details.account_number || !withdrawalForm.account_details.ifsc_code || !withdrawalForm.account_details.account_holder_name) {
      Alert.alert('Error', 'Please fill in all account details');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.requestWithdrawal(
        amount,
        withdrawalForm.withdrawal_method as 'bank' | 'paypal' | 'upi',
        withdrawalForm.account_details
      );
      
      Alert.alert(
        'Withdrawal Requested',
        `Your withdrawal request has been submitted successfully. You will receive the amount in 2-3 business days.\n\nWithdrawal ID: ${response.withdrawal_id}`,
        [{ text: 'OK', onPress: () => setShowWithdrawalModal(false) }]
      );
      
      // Refresh data
      await loadEarningsData();
      
      logger.info('UI', 'Withdrawal requested successfully', { 
        withdrawalId: response.withdrawal_id,
        amount: amount 
      });
    } catch (error) {
      logger.error('UI', 'Error requesting withdrawal', null, error);
      Alert.alert('Error', 'Failed to process withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getKYCBadge = () => {
    if (!kycStatus?.kyc_status) return null;
    
    switch (kycStatus.kyc_status) {
      case 'verified':
        return (
          <View style={styles.kycBadge}>
            <CheckCircle size={16} color="#00FF00" />
            <Text style={styles.kycBadgeText}>KYC Verified</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.kycBadge, styles.kycPendingBadge]}>
            <Clock size={16} color="#FFA500" />
            <Text style={styles.kycBadgeText}>KYC Pending</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.kycBadge, styles.kycRejectedBadge]}>
            <AlertCircle size={16} color="#FF0000" />
            <Text style={styles.kycBadgeText}>KYC Rejected</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const progressPercentage = Math.min((earnings?.coins_earned || 0) / 5000 * 100, 100);
  const remainingCoins = Math.max(5000 - (earnings?.coins_earned || 0), 0);

  if (loading) {
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E30CBD" />
            <Text style={styles.loadingText}>Loading earnings...</Text>
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
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity onPress={loadEarningsData} disabled={refreshing}>
            <RefreshCw 
              size={24} 
              color="#E30CBD" 
              style={[
                refreshing && { transform: [{ rotate: '360deg' }] }
              ]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#E30CBD"
              colors={["#E30CBD"]}
            />
          }
        >
          {/* Earnings Overview */}
          <View style={styles.earningsOverview}>
            <LinearGradient
              colors={["#667eea", "#764ba2", "#f093fb"]}
              style={styles.earningsCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
                             <View style={styles.earningsHeader}>
                 <Trophy size={32} color="#FFD700" />
                 <Text style={styles.earningsTitle}>Total Earnings</Text>
               </View>
              
              <Text style={styles.earningsAmount}>{earnings?.coins_earned?.toLocaleString() || 0}</Text>
              <Text style={styles.earningsSubtitle}>coins earned</Text>
              
              {getKYCBadge()}
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient 
                    colors={["#FFFFFF", "#E8E8E8"]} 
                    style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressPercentage >= 100 ? "Ready to withdraw!" : `${remainingCoins} coins needed`}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Gift size={24} color="#E30CBD" />
              <Text style={styles.statValue}>{earnings?.total_gifts || 0}</Text>
              <Text style={styles.statLabel}>Total Gifts</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={24} color="#00E5FF" />
              <Text style={styles.statValue}>₹{(earnings?.total_earnings || 0) / 100}</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#00FF00" />
              <Text style={styles.statValue}>{earnings?.withdrawal_threshold || 5000}</Text>
              <Text style={styles.statLabel}>Min Withdrawal</Text>
            </View>
            <View style={styles.statCard}>
              <Shield size={24} color="#FFA500" />
              <Text style={styles.statValue}>{kycStatus?.kyc_status || 'pending'}</Text>
              <Text style={styles.statLabel}>KYC Status</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {earnings?.kyc_required && kycStatus?.kyc_status !== 'verified' ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.kycButton]} 
                onPress={() => setShowKYCModal(true)}
              >
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Complete KYC</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.withdrawButton,
                  (!earnings?.can_withdraw || earnings?.coins_earned < 5000) && styles.disabledButton
                ]} 
                onPress={() => setShowWithdrawalModal(true)}
                disabled={!earnings?.can_withdraw || earnings?.coins_earned < 5000}
              >
                <Wallet size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {earnings?.can_withdraw ? "Withdraw Now" : "Minimum 5000 coins"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Requirements Section */}
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionTitle}>Withdrawal Requirements</Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <CheckCircle size={20} color={earnings?.coins_earned >= 5000 ? "#00FF00" : "#666"} />
                <Text style={[styles.requirementText, earnings?.coins_earned >= 5000 && styles.requirementMet]}>
                  Earn at least 5000 coins
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <CheckCircle size={20} color={kycStatus?.kyc_status === 'verified' ? "#00FF00" : "#666"} />
                <Text style={[styles.requirementText, kycStatus?.kyc_status === 'verified' && styles.requirementMet]}>
                  Complete KYC verification
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <CheckCircle size={20} color={earnings?.first_withdrawal_completed ? "#00FF00" : "#666"} />
                <Text style={[styles.requirementText, earnings?.first_withdrawal_completed && styles.requirementMet]}>
                  First withdrawal completed
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* KYC Modal */}
      <Modal visible={showKYCModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>KYC Verification</Text>
              <TouchableOpacity onPress={() => setShowKYCModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Complete your KYC verification to enable withdrawals. This is required for your first withdrawal.
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document Type</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Aadhaar Card / PAN Card / Passport"
                  placeholderTextColor="#666"
                  value={kycForm.document_type}
                  onChangeText={(text) => setKycForm(prev => ({ ...prev, document_type: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter document number"
                  placeholderTextColor="#666"
                  value={kycForm.document_number}
                  onChangeText={(text) => setKycForm(prev => ({ ...prev, document_number: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#666"
                  value={kycForm.full_name}
                  onChangeText={(text) => setKycForm(prev => ({ ...prev, full_name: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#666"
                  value={kycForm.date_of_birth}
                  onChangeText={(text) => setKycForm(prev => ({ ...prev, date_of_birth: text }))}
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.submitButton, submitting && { opacity: 0.5 }]} 
              onPress={handleKYCSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit KYC'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={showWithdrawalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Earnings</Text>
              <TouchableOpacity onPress={() => setShowWithdrawalModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Withdraw your earnings to your bank account. Minimum withdrawal amount is 5000 coins.
              </Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (coins)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="5000"
                  placeholderTextColor="#666"
                  value={withdrawalForm.amount}
                  onChangeText={(text) => setWithdrawalForm(prev => ({ ...prev, amount: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter account number"
                  placeholderTextColor="#666"
                  value={withdrawalForm.account_details.account_number}
                  onChangeText={(text) => setWithdrawalForm(prev => ({ 
                    ...prev, 
                    account_details: { ...prev.account_details, account_number: text }
                  }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter IFSC code"
                  placeholderTextColor="#666"
                  value={withdrawalForm.account_details.ifsc_code}
                  onChangeText={(text) => setWithdrawalForm(prev => ({ 
                    ...prev, 
                    account_details: { ...prev.account_details, ifsc_code: text }
                  }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter account holder name"
                  placeholderTextColor="#666"
                  value={withdrawalForm.account_details.account_holder_name}
                  onChangeText={(text) => setWithdrawalForm(prev => ({ 
                    ...prev, 
                    account_details: { ...prev.account_details, account_holder_name: text }
                  }))}
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.submitButton, submitting && { opacity: 0.5 }]} 
              onPress={handleWithdrawalSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </Text>
            </TouchableOpacity>
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
  earningsOverview: {
    padding: 20,
  },
  earningsCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#E30CBD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  earningsAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  earningsSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    marginBottom: 16,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  kycPendingBadge: {
    backgroundColor: 'rgba(255,165,0,0.2)',
  },
  kycRejectedBadge: {
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  kycBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  kycButton: {
    backgroundColor: '#FFA500',
  },
  withdrawButton: {
    backgroundColor: '#C71585',
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  requirementsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  requirementText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  requirementMet: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    color: '#999',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    color: '#bbb',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#E30CBD',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});