const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      profile_pic: user.profile_pic,
      followers: user.followers,
      following: user.following,
      total_likes: user.total_likes,
      coins_earned: user.coins_earned,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
}));

// Get user by ID
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, bio, profile_pic, followers, following, total_likes, coins_earned, is_verified, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// Update user profile
router.put('/profile', 
  [
    body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('bio').optional().isString().withMessage('Bio must be a string'),
    body('profile_pic').optional().isURL().withMessage('Profile picture must be a valid URL')
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

    const { username, bio, profile_pic } = req.body;

    // Check if username is available (if being updated)
    if (username && username !== req.user.username) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_pic) updateData.profile_pic = profile_pic;
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        profile_pic: user.profile_pic,
        followers: user.followers,
        following: user.following,
        total_likes: user.total_likes,
        coins_earned: user.coins_earned,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  })
);

// Follow user
router.post('/:userId/follow', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { userId } = req.params;
  const followerId = req.user.id;

  if (followerId === userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  // Check if already following
  const { data: existingFollow } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', userId)
    .single();

  if (existingFollow) {
    return res.status(400).json({ error: 'Already following this user' });
  }

  // Create follow relationship
  const { error: followError } = await supabaseAdmin
    .from('follows')
    .insert([{
      follower_id: followerId,
      following_id: userId
    }]);

  if (followError) {
    return res.status(500).json({ error: 'Failed to follow user' });
  }

  // Update follower counts
  await supabaseAdmin.rpc('update_follower_counts', {
    follower_id: followerId,
    following_id: userId
  });

  res.json({ message: 'User followed successfully' });
}));

// Unfollow user
router.delete('/:userId/follow', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { userId } = req.params;
  const followerId = req.user.id;

  // Remove follow relationship
  const { error } = await supabaseAdmin
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', userId);

  if (error) {
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }

  // Update follower counts
  await supabaseAdmin.rpc('update_follower_counts_after_unfollow', {
    follower_id: followerId,
    following_id: userId
  });

  res.json({ message: 'User unfollowed successfully' });
}));

// Get user followers
router.get('/:userId/followers', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: followers, error } = await supabaseAdmin
    .from('follows')
    .select(`
      follower_id,
      users!follows_follower_id_fkey (
        id, username, profile_pic, bio, is_verified
      )
    `)
    .eq('following_id', userId)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }

  res.json({
    followers: followers.map(f => f.users),
    page: Number(page),
    limit: Number(limit)
  });
}));

// Get user following
router.get('/:userId/following', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: following, error } = await supabaseAdmin
    .from('follows')
    .select(`
      following_id,
      users!follows_following_id_fkey (
        id, username, profile_pic, bio, is_verified
      )
    `)
    .eq('follower_id', userId)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch following' });
  }

  res.json({
    following: following.map(f => f.users),
    page: Number(page),
    limit: Number(limit)
  });
}));

// Search users
router.get('/search', asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, username, profile_pic, bio, followers, is_verified')
    .ilike('username', `%${q}%`)
    .range(offset, offset + Number(limit) - 1)
    .order('followers', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to search users' });
  }

  res.json({
    users,
    page: Number(page),
    limit: Number(limit)
  });
}));

module.exports = router;
