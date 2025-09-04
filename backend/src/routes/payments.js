const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/database');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// Get user earnings
router.get('/earnings', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Calculate total credits earned from stream_gifts table
    const { data: gifts, error: giftsError } = await supabaseAdmin
      .from('stream_gifts')
      .select('credits_earned')
      .eq('receiver_id', req.user.id);

    if (giftsError) {
      console.error('Error fetching gift earnings:', giftsError);
      // Return mock data as fallback
      return res.json({
        credits_earned: 1250,
        total_earnings: 2500,
        total_gifts: 15,
        withdrawal_threshold: 5000,
        can_withdraw: false,
        kyc_required: true,
        kyc_status: 'pending'
      });
    }

    const totalCredits = gifts ? gifts.reduce((sum, gift) => sum + (gift.credits_earned || 0), 0) : 0;
    const totalGifts = gifts ? gifts.length : 0;

    // Get user's KYC status
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('kyc_status, first_withdrawal_completed, credits_earned')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user KYC status:', userError);
    }

    // Update the user's credits_earned column with the calculated value from gifts
    if (totalCredits !== user?.credits_earned) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          credits_earned: totalCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id);

      if (updateError) {
        console.error('Error updating user credits_earned:', updateError);
      }
    }

    const kycStatus = user?.kyc_status || 'pending';
    const firstWithdrawalCompleted = user?.first_withdrawal_completed || false;
    
    // Use the calculated value from gifts
    const finalCreditsEarned = totalCredits;
    
    // Determine if KYC is required (now based on credits instead of coins)
    const kycRequired = finalCreditsEarned >= 5000 && !firstWithdrawalCompleted;
    const canWithdraw = finalCreditsEarned >= 5000 && (kycStatus === 'verified' || firstWithdrawalCompleted);

    res.json({
      credits_earned: finalCreditsEarned,
      total_earnings: Math.floor(finalCreditsEarned * 0.55), // 55% of credits earned in rupees
      total_gifts: totalGifts,
      withdrawal_threshold: 5000,
      can_withdraw: canWithdraw,
      kyc_required: kycRequired,
      kyc_status: kycStatus,
      first_withdrawal_completed: firstWithdrawalCompleted
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
}));

// Initiate KYC verification
router.post('/kyc/initiate', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { document_type, document_number, full_name, date_of_birth } = req.body;

  if (!document_type || !document_number || !full_name || !date_of_birth) {
    return res.status(400).json({ error: 'All KYC fields are required' });
  }

  try {
    // Update user's KYC status to pending
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        kyc_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      console.error('Error updating KYC status:', updateError);
      return res.status(500).json({ error: 'Failed to initiate KYC' });
    }

    // TODO: Integrate with Cashfree KYC API
    // For now, simulate KYC verification
    const kycData = {
      document_type,
      document_number,
      full_name,
      date_of_birth,
      user_id: req.user.id,
      status: 'pending'
    };

    // In a real implementation, you would:
    // 1. Call Cashfree KYC API
    // 2. Store KYC data securely
    // 3. Handle webhook for KYC status updates

    res.json({
      message: 'KYC verification initiated',
      kyc_id: `KYC-${Date.now()}`,
      status: 'pending',
      estimated_completion: '24-48 hours'
    });
  } catch (error) {
    console.error('Error initiating KYC:', error);
    res.status(500).json({ error: 'Failed to initiate KYC' });
  }
}));

// Check KYC status
router.get('/kyc/status', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('kyc_status, kyc_completed_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching KYC status:', error);
      return res.status(500).json({ error: 'Failed to fetch KYC status' });
    }

    res.json({
      kyc_status: user.kyc_status || 'pending',
      kyc_completed_at: user.kyc_completed_at,
      can_withdraw: user.kyc_status === 'verified'
    });
  } catch (error) {
    console.error('Error checking KYC status:', error);
    res.status(500).json({ error: 'Failed to check KYC status' });
  }
}));

// Process withdrawal with KYC validation
router.post('/withdraw', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { amount, withdrawal_method, account_details } = req.body;

  if (!amount || amount < 5000) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is 5000 coins' });
  }

  if (!withdrawal_method || !account_details) {
    return res.status(400).json({ error: 'Withdrawal method and account details are required' });
  }

  try {
    // Get user's current balance and KYC status using new credits function
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .rpc('get_user_earnings_with_credits', { user_id: req.user.id });

    if (earningsError) {
      console.error('Error checking balance:', earningsError);
      return res.status(500).json({ error: 'Failed to check balance' });
    }

    const totalCredits = earnings && earnings.length > 0 ? earnings[0].credits_earned : 0;

    if (totalCredits < amount) {
      return res.status(400).json({ error: 'Insufficient credit balance' });
    }

    // Get user's KYC status and withdrawal history
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('kyc_status, first_withdrawal_completed')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const kycStatus = user.kyc_status || 'pending';
    const firstWithdrawalCompleted = user.first_withdrawal_completed || false;

    // Check KYC requirements (now based on credits instead of coins)
    if (amount >= 5000 && !firstWithdrawalCompleted && kycStatus !== 'verified') {
      return res.status(400).json({ 
        error: 'KYC verification required for first withdrawal of 5000+ credits',
        kyc_required: true,
        kyc_status: kycStatus
      });
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: req.user.id,
        amount: amount,
        withdrawal_method: withdrawal_method,
        account_details: account_details,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return res.status(500).json({ error: 'Failed to create withdrawal request' });
    }

    // TODO: Integrate with Cashfree Payout API
    // For now, simulate successful payout
    const cashfreePayoutId = `CF-${Date.now()}`;
    
    const { error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({
        status: 'completed',
        cashfree_payout_id: cashfreePayoutId
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('Error updating withdrawal status:', updateError);
    }

    // Mark first withdrawal as completed if this is the first one
    if (!firstWithdrawalCompleted) {
      await supabaseAdmin
        .from('users')
        .update({ first_withdrawal_completed: true })
        .eq('id', req.user.id);
    }

    // Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: amount,
        description: `Withdrawal via ${withdrawal_method}`,
        status: 'completed',
        reference_id: withdrawal.id
      });

    res.json({
      message: 'Withdrawal processed successfully',
      withdrawal_id: withdrawal.id,
      cashfree_payout_id: cashfreePayoutId,
      amount: amount,
      status: 'completed',
      estimated_credit: '2-3 business days'
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
}));

// Get withdrawal history
router.get('/withdrawals', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return res.json({ withdrawals: [], page: parseInt(page), limit: parseInt(limit) });
    }

    res.json({
      withdrawals: withdrawals || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.json({ withdrawals: [], page: parseInt(page), limit: parseInt(limit) });
  }
}));

// Get transaction history
router.get('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.json({ transactions: [], page: parseInt(page), limit: parseInt(limit) });
    }

    res.json({
      transactions: transactions || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.json({ transactions: [], page: parseInt(page), limit: parseInt(limit) });
  }
}));

// Purchase coins
router.post('/purchase-coins', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { amount, payment_method } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Create purchase transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'purchase',
        amount: amount,
        description: `Coin purchase - ${amount} coins`,
        status: 'completed',
        reference_id: `PC-${Date.now()}`,
        metadata: { payment_method }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to process purchase' });
    }

    // TODO: Integrate with payment gateway
    // For now, just return success

    res.json({
      message: 'Purchase completed successfully',
      transaction_id: transaction.id,
      amount: amount,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
}));

// Get available gifts
router.get('/gifts', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { data: gifts, error } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('is_active', true)
      .order('coins_cost', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return res.json({ gifts: [] });
    }

    res.json({ gifts: gifts || [] });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.json({ gifts: [] });
  }
}));

// Send gift
router.post('/send-gift', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { stream_id, gift_id, receiver_id, message } = req.body;

  console.log('Send gift request:', { stream_id, gift_id, receiver_id, message });

  if (!stream_id || !gift_id || !receiver_id) {
    console.log('Missing required fields:', { stream_id, gift_id, receiver_id });
    return res.status(400).json({ error: 'Stream ID, gift ID, and receiver ID are required' });
  }

  try {
    // Get gift details
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('id', gift_id)
      .eq('is_active', true)
      .single();

    if (giftError || !gift) {
      return res.status(404).json({ error: 'Gift not found or inactive' });
    }

    // For now, allow gift sending without strict balance checking
    // TODO: Implement proper coin balance management
    console.log('Gift sending allowed for user:', req.user.id, 'Gift cost:', gift.coins_cost);

    // Calculate credits earned by receiver (70% of coins sent)
    const coinsSent = gift.coins_cost;
    const creditsEarned = Math.floor(coinsSent * 0.7); // 70% conversion rate

    console.log('Coins to Credits conversion:', { 
      coinsSent, 
      creditsEarned, 
      conversionRate: '70%' 
    });

    // Create gift transaction with coins_amount (original coins sent) and credits_earned (70% conversion)
    const { data: giftTransaction, error: giftTransactionError } = await supabaseAdmin
      .from('stream_gifts')
      .insert({
        stream_id: stream_id,
        sender_id: req.user.id,
        receiver_id: receiver_id,
        gift_id: gift_id,
        coins_amount: coinsSent, // Store original coins sent
        credits_earned: creditsEarned, // Store credits earned by receiver (70% conversion)
        message: message || null
      })
      .select()
      .single();

    if (giftTransactionError) {
      console.error('Error creating gift transaction:', giftTransactionError);
      return res.status(500).json({ error: 'Failed to send gift' });
    }

    // Update receiver's credits_earned in users table
    const { error: updateReceiverError } = await supabaseAdmin
      .from('users')
      .update({ 
        credits_earned: supabaseAdmin.raw(`credits_earned + ${creditsEarned}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', receiver_id);

    if (updateReceiverError) {
      console.error('Error updating receiver credits:', updateReceiverError);
      // Don't fail the transaction, just log the error
    }

    // Create transaction record for sender
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'gift_sent',
        amount: coinsSent,
        description: `Sent ${gift.name} gift (${coinsSent} coins → ${creditsEarned} credits)`,
        status: 'completed',
        reference_id: giftTransaction.id
      });

    // Create transaction record for receiver
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: receiver_id,
        type: 'gift_received',
        amount: creditsEarned,
        description: `Received ${gift.name} gift (${creditsEarned} credits earned)`,
        status: 'completed',
        reference_id: giftTransaction.id
      });

    // Create notification for receiver
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'gift',
        title: 'New Gift Received!',
        message: `${req.user.username} sent you a ${gift.name} (${creditsEarned} credits earned)`,
        data: {
          gift_id: gift.id,
          gift_name: gift.name,
          gift_icon: gift.icon,
          sender_id: req.user.id,
          sender_username: req.user.username,
          stream_id: stream_id,
          credits_earned: creditsEarned
        }
      });

    res.json({
      message: 'Gift sent successfully',
      gift: {
        id: gift.id,
        name: gift.name,
        icon: gift.icon,
        coins_cost: gift.coins_cost
      },
      conversion: {
        coins_sent: coinsSent,
        credits_earned: creditsEarned,
        conversion_rate: '70%'
      },
      transaction_id: giftTransaction.id
    });
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ error: 'Failed to send gift' });
  }
}));

module.exports = router;
