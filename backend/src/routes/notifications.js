const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }

  res.json({
    notifications,
    page: Number(page),
    limit: Number(limit)
  });
}));

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { notificationId } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }

  res.json({ message: 'Notification marked as read' });
}));

// Mark all notifications as read
router.put('/read-all', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', req.user.id)
    .eq('read', false);

  if (error) {
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }

  res.json({ message: 'All notifications marked as read' });
}));

// Delete notification
router.delete('/:notificationId', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { notificationId } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete notification' });
  }

  res.json({ message: 'Notification deleted successfully' });
}));

// Get unread notification count
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('read', false);

  if (error) {
    return res.status(500).json({ error: 'Failed to get unread count' });
  }

  res.json({ unread_count: count });
}));

// Create notification (internal use)
async function createNotification(userId, type, title, message, data) {
  try {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Send push notification (placeholder for future implementation)
async function sendPushNotification(userId, title, body, data) {
  // TODO: Implement push notification service (Firebase, OneSignal, etc.)
  console.log(`Push notification to ${userId}: ${title} - ${body}`);
  return true;
}

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.sendPushNotification = sendPushNotification;
