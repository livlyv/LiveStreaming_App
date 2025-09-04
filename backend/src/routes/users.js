const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/database');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// Get user settings - MUST be before /:userId route
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { data: settings, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
  
  // Return default settings if none exist
  const defaultSettings = {
    notifications_enabled: true,
    gift_notifications: true,
    live_notifications: true
  };
  
  res.json({ settings: settings || defaultSettings });
}));

// Update user settings - MUST be before /:userId route
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { notifications_enabled, gift_notifications, live_notifications } = req.body;
  
  // Upsert settings
  const { data: settings, error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      user_id: req.user.id,
      notifications_enabled,
      gift_notifications,
      live_notifications
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
  
  res.json({ message: 'Settings updated successfully', settings });
}));

// Get user profile - MUST be before /:userId route
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();
    
  if (error) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
}));

// Update user profile - MUST be before /:userId route
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { username, bio, profile_pic } = req.body;
  
  // Check if username is already taken by another user
  if (username) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', req.user.id)
      .single();
      
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ username, bio, profile_pic })
    .eq('id', req.user.id)
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
  
  res.json({ message: 'Profile updated successfully', user });
}));

// Get blocked users list - MUST be before /:userId route
router.get('/blocked/list', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { data: blockedUsers, error } = await supabaseAdmin
    .from('blocked_users')
    .select(`
      blocked_id,
      reason,
      created_at,
      blocked_user:users!blocked_users_blocked_id_fkey (
        id,
        username,
        profile_pic,
        bio
      )
    `)
    .eq('blocker_id', req.user.id);
    
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
  
  const processedBlockedUsers = blockedUsers.map(b => ({
    id: b.blocked_id,
    username: b.blocked_user?.username,
    profile_pic: b.blocked_user?.profile_pic,
    bio: b.blocked_user?.bio,
    reason: b.reason,
    blocked_at: b.created_at
  })).filter(b => b.username);
  
  res.json({ blocked_users: processedBlockedUsers });
}));

// Get user by ID - This must come AFTER specific routes like /settings, /profile, etc.
router.get('/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
}));

// Follow user
router.post('/:userId/follow', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { userId } = req.params;
  
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  // Check if user exists
  const { data: targetUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if already following
  const { data: existingFollow, error: followError } = await supabaseAdmin
    .from('followers')
    .select('id')
    .eq('follower_id', req.user.id)
    .eq('following_id', userId)
    .single();
    
  if (existingFollow) {
    return res.status(400).json({ error: 'Already following this user' });
  }
  
  // Create follow relationship
  const { data: follow, error: createError } = await supabaseAdmin
    .from('followers')
    .insert({
      follower_id: req.user.id,
      following_id: userId
    })
    .select()
    .single();
    
  if (createError) {
    return res.status(500).json({ error: 'Failed to follow user' });
  }
  
  res.json({ message: 'User followed successfully', follow });
}));

// Unfollow user
router.delete('/:userId/follow', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { userId } = req.params;
  
  // Delete follow relationship
  const { error } = await supabaseAdmin
    .from('followers')
    .delete()
    .eq('follower_id', req.user.id)
    .eq('following_id', userId);
    
  if (error) {
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
  
  res.json({ message: 'User unfollowed successfully' });
}));

// Get user followers
router.get('/:userId/followers', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  const { data: followers, error } = await supabaseAdmin
    .from('followers')
    .select(`
      follower_id,
      created_at,
      follower:users!followers_follower_id_fkey (
        id,
        username,
        profile_pic,
        bio
      )
    `)
    .eq('following_id', userId)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
  
  const processedFollowers = followers.map(f => ({
    id: f.follower_id,
    username: f.follower?.username,
    profile_pic: f.follower?.profile_pic,
    bio: f.follower?.bio,
    followed_at: f.created_at
  })).filter(f => f.username);
  
  res.json({ followers: processedFollowers, page: Number(page), limit: Number(limit) });
}));

// Get user following
router.get('/:userId/following', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  const { data: following, error } = await supabaseAdmin
    .from('followers')
    .select(`
      following_id,
      created_at,
      following:users!followers_following_id_fkey (
        id,
        username,
        profile_pic,
        bio
      )
    `)
    .eq('follower_id', userId)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
  
  const processedFollowing = following.map(f => ({
    id: f.following_id,
    username: f.following?.username,
    profile_pic: f.following?.profile_pic,
    bio: f.following?.bio,
    followed_at: f.created_at
  })).filter(f => f.username);
  
  res.json({ following: processedFollowing, page: Number(page), limit: Number(limit) });
}));

// Block user
router.post('/:userId/block', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { userId } = req.params;
  const { reason } = req.body;
  
  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }
  
  // Check if user exists
  const { data: targetUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if already blocked
  const { data: existingBlock, error: blockError } = await supabaseAdmin
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', req.user.id)
    .eq('blocked_id', userId)
    .single();
    
  if (existingBlock) {
    return res.status(400).json({ error: 'User is already blocked' });
  }
  
  // Create block relationship
  const { data: block, error: createError } = await supabaseAdmin
    .from('blocked_users')
    .insert({
      blocker_id: req.user.id,
      blocked_id: userId,
      reason
    })
    .select()
    .single();
    
  if (createError) {
    return res.status(500).json({ error: 'Failed to block user' });
  }
  
  res.json({ message: 'User blocked successfully', block });
}));

// Unblock user
router.delete('/:userId/block', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { userId } = req.params;
  
  // Delete block relationship
  const { error } = await supabaseAdmin
    .from('blocked_users')
    .delete()
    .eq('blocker_id', req.user.id)
    .eq('blocked_id', userId);
    
  if (error) {
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
  
  res.json({ message: 'User unblocked successfully' });
}));

// Get stream duration
router.get('/:userId/stream-duration', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { period = 'weekly' } = req.query;
  
  try {
    // Use the database function for real data
    const { data: streamDuration, error } = await supabaseAdmin
      .rpc('get_stream_duration_by_period', {
        user_uuid: userId,
        period_type: period
      });
    
    if (error) {
      console.error('Error fetching stream duration:', error);
      // Return mock data as fallback
      const mockData = period === 'weekly' 
        ? [
            { day_name: 'Monday', total_hours: 2.5 },
            { day_name: 'Tuesday', total_hours: 1.8 },
            { day_name: 'Wednesday', total_hours: 3.2 },
            { day_name: 'Thursday', total_hours: 0.5 },
            { day_name: 'Friday', total_hours: 4.1 },
            { day_name: 'Saturday', total_hours: 6.0 },
            { day_name: 'Sunday', total_hours: 2.3 }
          ]
        : [
            { day_name: 'Week 1', total_hours: 15.2 },
            { day_name: 'Week 2', total_hours: 18.7 },
            { day_name: 'Week 3', total_hours: 12.4 },
            { day_name: 'Week 4', total_hours: 22.1 }
          ];
      
      return res.json({ period, data: mockData });
    }
    
    res.json({ period, data: streamDuration || [] });
  } catch (error) {
    console.error('Error in stream duration:', error);
    res.status(500).json({ error: 'Failed to fetch stream duration' });
  }
}));

// Get top gifter
router.get('/:userId/top-gifter', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { data: topGifter, error } = await supabaseAdmin
      .rpc('get_top_gifter', {
        user_uuid: userId
      });
    
    if (error) {
      console.error('Error fetching top gifter:', error);
      return res.json({ top_gifter: null });
    }
    
    res.json({ top_gifter: topGifter });
  } catch (error) {
    console.error('Error in top gifter:', error);
    res.status(500).json({ error: 'Failed to fetch top gifter' });
  }
}));

// Get top gifts
router.get('/:userId/top-gifts', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 4 } = req.query;
  
  try {
    const { data: topGifts, error } = await supabaseAdmin
      .rpc('get_top_gifts', {
        user_uuid: userId,
        gift_limit: Number(limit)
      });
    
    if (error) {
      console.error('Error fetching top gifts:', error);
      return res.json({ top_gifts: [] });
    }
    
    res.json({ top_gifts: topGifts || [] });
  } catch (error) {
    console.error('Error in top gifts:', error);
    res.status(500).json({ error: 'Failed to fetch top gifts' });
  }
}));

// Check if user can message
router.get('/:userId/can-message', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { userId } = req.params;
  
  if (req.user.id === userId) {
    return res.json({ can_message: false });
  }
  
  try {
    // Check if user has sent 99+ coins to this user
    const { data: totalCoins, error } = await supabaseAdmin
      .from('stream_gifts')
      .select('gift_value, quantity')
      .eq('receiver_id', userId)
      .eq('sender_id', req.user.id);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to check message permission' });
    }
    
    const totalCoinsSent = totalCoins.reduce((sum, gift) => sum + (gift.gift_value * gift.quantity), 0);
    const canMessage = totalCoinsSent >= 99;
    
    res.json({ can_message: canMessage });
  } catch (error) {
    console.error('Error checking message permission:', error);
    res.status(500).json({ error: 'Failed to check message permission' });
  }
}));

// Search users
router.get('/search', authenticateToken, asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }
  
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, username, profile_pic, bio, followers_count, following_count, total_likes, coins_earned')
    .ilike('username', `%${q}%`)
    .range(offset, offset + Number(limit) - 1)
    .order('followers_count', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: 'Failed to search users' });
  }
  
  res.json({ users, page: Number(page), limit: Number(limit) });
}));

// Submit support complaint
router.post('/support', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  const { subject, message, category } = req.body;
  
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }
  
  const { data: complaint, error } = await supabaseAdmin
      .from('support_complaints')
    .insert({
      user_id: req.user.id,
      subject,
      message,
      category: category || 'general'
    })
    .select()
    .single();
    
    if (error) {
    return res.status(500).json({ error: 'Failed to submit complaint' });
  }
  
  res.json({ message: 'Complaint submitted successfully', complaint });
}));

// Upload profile picture
router.post('/upload-profile-picture', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  // This endpoint is handled by the media routes
  // Redirect to media route
  res.status(400).json({ error: 'Use /api/media/profile-picture endpoint for profile picture upload' });
}));

module.exports = router;
