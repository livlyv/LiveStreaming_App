const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/database');
const { generateTokenPair } = require('../utils/jwt');

const router = Router();

// In-memory OTP storage (replace with Redis in production)
const otpStore = {};

// Helper function to send OTP (integrate with SMS provider)
async function sendOTP(phone, code) {
  // TODO: Integrate with SMS provider (MSG91, Twilio, etc.)
  console.log(`Sending OTP ${code} to ${phone}`);
  
  // For development, always return true
  // In production, implement actual SMS sending logic
  return true;
}

// Helper function to create user in Supabase
async function createUser(userData) {
  try {
    const insertData = {
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      bio: userData.bio || "Hey there! I'm new here",
      profile_pic: userData.profile_pic || `https://ui-avatars.com/api/?name=${userData.username}&background=E30CBD&color=fff`,
      password: userData.password,
      followers: 0,
      following: 0,
      total_likes: 0,
      coins_earned: 0,
      is_verified: false
    };

    // Only include id if it's provided (for Supabase Auth users)
    if (userData.id) {
      insertData.id = userData.id;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error creating user:', err);
    return null;
  }
}

// OTP Request endpoint
router.post('/otp/request', 
  [
    body('phone').isMobilePhone().withMessage('Valid phone number is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore[phone] = { code: otp, expires };

    // Send OTP
    const sent = await sendOTP(phone, otp);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      message: 'OTP sent successfully',
      expires: new Date(expires).toISOString()
    });
  })
);

// OTP Verify endpoint
router.post('/otp/verify',
  [
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits'),
    body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('bio').optional().isString().withMessage('Bio must be a string')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code, username, bio } = req.body;

    // Verify OTP
    const storedOTP = otpStore[phone];
    if (!storedOTP || storedOTP.code !== code || Date.now() > storedOTP.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    delete otpStore[phone];

    // Check if user exists
    let user = await getUserByIdentifier(phone, 'phone');
    
    if (!user) {
      // Create new user
      if (!username) {
        return res.status(400).json({ error: 'Username is required for new users' });
      }

      // Check if username is available
      const existingUser = await getUserByIdentifier(username, 'username');
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      user = await createUser({ phone, username, bio });
      if (!user) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username
    });

    res.json({
      message: 'Authentication successful',
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
        is_verified: user.is_verified
      },
      ...tokens
    });
  })
);

// Email Signup endpoint
router.post('/email/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('bio').optional().isString().withMessage('Bio must be a string')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username, bio } = req.body;

    // Check if email already exists
    let user = await getUserByIdentifier(email, 'email');
    if (user) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username is available
    user = await getUserByIdentifier(username, 'username');
    if (user) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    user = await createUser({ 
      email, 
      username, 
      bio,
      password: hashedPassword 
    });

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username
    });

    res.status(201).json({
      message: 'User created successfully',
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
        is_verified: user.is_verified
      },
      ...tokens
    });
  })
);

// Email Login endpoint
router.post('/email/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user by email
    const user = await getUserByIdentifier(email, 'email');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username
    });

    res.json({
      message: 'Login successful',
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
        is_verified: user.is_verified
      },
      ...tokens
    });
  })
);

// Refresh Token endpoint
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;

    try {
      const { verifyRefreshToken } = require('../utils/jwt');
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await getUserByIdentifier(decoded.userId, 'id');
      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        userId: user.id,
        username: user.username
      });

      res.json({
        message: 'Token refreshed successfully',
        ...tokens
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  })
);

// Logout endpoint
router.post('/logout', asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the refresh token
  // For now, we'll just return a success response
  res.json({ message: 'Logged out successfully' });
}));

// Helper function to get user by identifier
async function getUserByIdentifier(identifier, type) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq(type, identifier)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

module.exports = router;
