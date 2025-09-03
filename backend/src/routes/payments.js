const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get available gifts
router.get('/gifts', asyncHandler(async (req, res) => {
  const { data: gifts, error } = await supabaseAdmin
    .from('gifts')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch gifts' });
  }

  res.json({ gifts });
}));

// Purchase coins
router.post('/purchase-coins',
  [
    body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
    body('payment_method').isIn(['stripe', 'paypal', 'razorpay']).withMessage('Valid payment method is required')
  ],
  authenticateToken,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount, payment_method } = req.body;

    // Create transaction record
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        type: 'purchase',
        amount: amount,
        currency: 'USD',
        status: 'pending',
        reference_id: uuidv4()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    // TODO: Integrate with payment gateway (Stripe, PayPal, Razorpay)
    // For now, simulate successful payment
    const paymentSuccess = true;

    if (paymentSuccess) {
      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      // Update user's coin balance
      await supabaseAdmin
        .from('users')
        .update({ 
          coins_earned: supabaseAdmin.rpc('add_coins', { user_id: req.user.id, amount: amount })
        })
        .eq('id', req.user.id);

      res.json({
        message: 'Coins purchased successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: 'completed',
          reference_id: transaction.reference_id
        }
      });
    } else {
      // Update transaction status to failed
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      res.status(400).json({ error: 'Payment failed' });
    }
  })
);

// Send gift
router.post('/send-gift',
  [
    body('stream_id').isUUID().withMessage('Valid stream ID is required'),
    body('gift_id').isUUID().withMessage('Valid gift ID is required')
  ],
  authenticateToken,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { stream_id, gift_id } = req.body;

    // Get gift details
    const { data: gift, error: giftError } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('id', gift_id)
      .single();

    if (giftError || !gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    // Check if user has enough coins
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('coins_earned')
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins_earned < gift.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Get stream details
    const { data: stream, error: streamError } = await supabaseAdmin
      .from('streams')
      .select('user_id')
      .eq('id', stream_id)
      .single();

    if (streamError || !stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Deduct coins from sender
    await supabaseAdmin
      .from('users')
      .update({ 
        coins_earned: supabaseAdmin.rpc('subtract_coins', { user_id: req.user.id, amount: gift.price })
      })
      .eq('id', req.user.id);

    // Add coins to streamer
    await supabaseAdmin
      .from('users')
      .update({ 
        coins_earned: supabaseAdmin.rpc('add_coins', { user_id: stream.user_id, amount: gift.price })
      })
      .eq('id', stream.user_id);

    // Create gift transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        type: 'gift',
        amount: gift.price,
        currency: 'USD',
        status: 'completed',
        reference_id: uuidv4()
      }])
      .select()
      .single();

    if (transactionError) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    // Create message for the gift
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert([{
        stream_id,
        user_id: req.user.id,
        content: `sent ${gift.name}`,
        message_type: 'gift',
        gift_value: gift.price
      }])
      .select()
      .single();

    if (messageError) {
      return res.status(500).json({ error: 'Failed to create message' });
    }

    res.json({
      message: 'Gift sent successfully',
      gift: {
        id: gift.id,
        name: gift.name,
        icon_url: gift.icon_url,
        price: gift.price
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  })
);

// Get user transactions
router.get('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }

  res.json({
    transactions,
    page: Number(page),
    limit: Number(limit)
  });
}));

// Get user earnings
router.get('/earnings', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('coins_earned')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get total earnings from gifts
  const { data: giftEarnings, error: giftError } = await supabaseAdmin
    .from('transactions')
    .select('amount')
    .eq('user_id', req.user.id)
    .eq('type', 'gift')
    .eq('status', 'completed');

  const totalEarnings = giftEarnings?.reduce((sum, t) => sum + t.amount, 0) || 0;

  res.json({
    coins_earned: user.coins_earned,
    total_earnings: totalEarnings
  });
}));

// Request withdrawal
router.post('/withdraw',
  [
    body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
    body('withdrawal_method').isIn(['bank', 'paypal', 'upi']).withMessage('Valid withdrawal method is required'),
    body('account_details').isObject().withMessage('Account details are required')
  ],
  authenticateToken,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount, withdrawal_method, account_details } = req.body;

    // Check if user has enough coins
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('coins_earned')
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins_earned < amount) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Create withdrawal transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        type: 'withdrawal',
        amount: amount,
        currency: 'USD',
        status: 'pending',
        reference_id: uuidv4()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create withdrawal request' });
    }

    // TODO: Process withdrawal through payment gateway
    // For now, mark as pending

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        reference_id: transaction.reference_id
      }
    });
  })
);

module.exports = router;
