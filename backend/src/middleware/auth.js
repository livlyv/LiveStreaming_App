const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, phone, username')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(); // Continue without user
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, phone, username')
      .eq('id', decoded.userId)
      .single();

    if (!error && user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without user on error
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
