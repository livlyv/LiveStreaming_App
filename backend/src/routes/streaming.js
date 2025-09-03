const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Create a new stream
router.post('/',
  [
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('thumbnail_url').optional().isURL().withMessage('Thumbnail URL must be valid')
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

    const { title, description, thumbnail_url } = req.body;
    const streamKey = uuidv4();

    const { data: stream, error } = await supabaseAdmin
      .from('streams')
      .insert([{
        user_id: req.user.id,
        title,
        description,
        thumbnail_url,
        stream_key: streamKey,
        is_live: false,
        viewer_count: 0
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create stream' });
    }

    res.status(201).json({
      message: 'Stream created successfully',
      stream: {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        thumbnail_url: stream.thumbnail_url,
        stream_key: stream.stream_key,
        is_live: stream.is_live,
        viewer_count: stream.viewer_count,
        created_at: stream.created_at
      }
    });
  })
);

// Get all live streams
router.get('/live', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: streams, error } = await supabaseAdmin
    .from('streams')
    .select(`
      *,
      users!streams_user_id_fkey (
        id, username, profile_pic, is_verified
      )
    `)
    .eq('is_live', true)
    .range(offset, offset + Number(limit) - 1)
    .order('viewer_count', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch live streams' });
  }

  res.json({
    streams,
    page: Number(page),
    limit: Number(limit)
  });
}));

// Get stream by ID
router.get('/:streamId', asyncHandler(async (req, res) => {
  const { streamId } = req.params;

  const { data: stream, error } = await supabaseAdmin
    .from('streams')
    .select(`
      *,
      users!streams_user_id_fkey (
        id, username, profile_pic, bio, is_verified, followers
      )
    `)
    .eq('id', streamId)
    .single();

  if (error || !stream) {
    return res.status(404).json({ error: 'Stream not found' });
  }

  res.json({ stream });
}));

// Start stream
router.post('/:streamId/start', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { streamId } = req.params;

  // Verify stream ownership
  const { data: stream, error } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !stream) {
    return res.status(404).json({ error: 'Stream not found or access denied' });
  }

  if (stream.is_live) {
    return res.status(400).json({ error: 'Stream is already live' });
  }

  // Update stream to live
  const { error: updateError } = await supabaseAdmin
    .from('streams')
    .update({
      is_live: true,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', streamId);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to start stream' });
  }

  res.json({ message: 'Stream started successfully' });
}));

// End stream
router.post('/:streamId/end', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { streamId } = req.params;

  // Verify stream ownership
  const { data: stream, error } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !stream) {
    return res.status(404).json({ error: 'Stream not found or access denied' });
  }

  if (!stream.is_live) {
    return res.status(400).json({ error: 'Stream is not live' });
  }

  // Update stream to ended
  const { error: updateError } = await supabaseAdmin
    .from('streams')
    .update({
      is_live: false,
      ended_at: new Date().toISOString(),
      viewer_count: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', streamId);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to end stream' });
  }

  res.json({ message: 'Stream ended successfully' });
}));

// Update viewer count
router.put('/:streamId/viewers', asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const { count } = req.body;

  if (typeof count !== 'number' || count < 0) {
    return res.status(400).json({ error: 'Valid viewer count is required' });
  }

  const { error } = await supabaseAdmin
    .from('streams')
    .update({
      viewer_count: count,
      updated_at: new Date().toISOString()
    })
    .eq('id', streamId);

  if (error) {
    return res.status(500).json({ error: 'Failed to update viewer count' });
  }

  res.json({ message: 'Viewer count updated successfully' });
}));

// Get user's streams
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: streams, error } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('user_id', userId)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch user streams' });
  }

  res.json({
    streams,
    page: Number(page),
    limit: Number(limit)
  });
}));

// Delete stream
router.delete('/:streamId', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { streamId } = req.params;

  // Verify stream ownership
  const { data: stream, error } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !stream) {
    return res.status(404).json({ error: 'Stream not found or access denied' });
  }

  if (stream.is_live) {
    return res.status(400).json({ error: 'Cannot delete live stream' });
  }

  // Delete stream
  const { error: deleteError } = await supabaseAdmin
    .from('streams')
    .delete()
    .eq('id', streamId);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete stream' });
  }

  res.json({ message: 'Stream deleted successfully' });
}));

module.exports = router;
