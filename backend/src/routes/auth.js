const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const fetch = require('node-fetch');
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
      followers: 0,
      following: 0,
      total_likes: 0,
      coins_earned: 0,
      is_verified: false
    };

    // Only include password if it's provided (for email auth users)
    if (userData.password) {
      insertData.password = userData.password;
    }

    // Only include id if it's provided (for Supabase Auth users)
    if (userData.id) {
      insertData.id = userData.id;
    }

    console.log('📝 Creating user with data:', { ...insertData, password: insertData.password ? '[HIDDEN]' : null });

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user:', error);
      return null;
    }

    console.log('✅ User created successfully:', data.id);
    return data;
  } catch (err) {
    console.error('❌ Error creating user:', err);
    return null;
  }
}

// Helper function to get or create user from Supabase Auth
async function getOrCreateUserFromSupabase(supabaseUser) {
  try {
    console.log('🔍 Checking if user exists in our database:', supabaseUser.id);
    
    // Check if user already exists in our users table
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return null;
    }

    if (existingUser) {
      console.log('✅ User found in database:', existingUser.id);
      return existingUser;
    }

    // User doesn't exist, create new user
    console.log('📝 Creating new user from Supabase Auth data');
    
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      bio: `Hi, I'm ${supabaseUser.user_metadata?.full_name || 'new here'}!`,
      profile_pic: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${supabaseUser.user_metadata?.full_name || 'User'}&background=E30CBD&color=fff`,
      followers: 0,
      following: 0,
      total_likes: 0,
      coins_earned: 0,
      is_verified: supabaseUser.email_confirmed_at ? true : false,
      phone: null
    };

    const newUser = await createUser(userData);
    if (newUser) {
      console.log('✅ New user created from Supabase Auth:', newUser.id);
      return newUser;
    }

    return null;
  } catch (error) {
    console.error('❌ Error in getOrCreateUserFromSupabase:', error);
    return null;
  }
}

// Google OAuth Initiation endpoint
router.get('/google/init', asyncHandler(async (req, res) => {
  console.log('🔐 Google OAuth initiation requested');
  
  try {
    const { redirectTo } = req.query;
    const baseUrl = process.env.SUPABASE_URL;
    // Always use Expo Auth Proxy for mobile OAuth
    const redirectUrl = 'https://auth.expo.io/@rahul_1996_s/rork-app';
    
    // Construct Supabase OAuth URL with direct redirect to Expo Auth Proxy
    const oauthUrl = `${baseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&access_type=offline&prompt=consent`;
    
    console.log('🔗 Redirecting to Supabase OAuth:', oauthUrl);
    console.log('🎯 Final redirect will be to:', redirectUrl);
    
    res.json({
      success: true,
      oauthUrl,
      message: 'Google OAuth URL generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating OAuth URL:', error);
    res.status(500).json({
      error: 'Failed to generate OAuth URL',
      message: error.message
    });
  }
}));

// Google OAuth Token Exchange endpoint (for mobile apps)
router.post('/google/exchange', asyncHandler(async (req, res) => {
  console.log('🔄 Google OAuth token exchange requested');
  
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required',
        message: 'No authorization code provided'
      });
    }

    console.log('🔍 Exchanging authorization code for session...');
    
    // Exchange the authorization code for a session using Supabase
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Error exchanging code for session:', error);
      return res.status(400).json({
        error: 'Token exchange failed',
        message: error.message
      });
    }

    if (!data.session || !data.user) {
      return res.status(400).json({
        error: 'Invalid session data',
        message: 'No session or user data returned from token exchange'
      });
    }

    console.log('✅ Token exchange successful for user:', data.user.email);
    
    // Get or create user in our database
    const appUser = await getOrCreateUserFromSupabase(data.user);
    
    if (!appUser) {
      return res.status(500).json({
        error: 'Failed to process user',
        message: 'Could not create or retrieve user from database'
      });
    }

    // Generate JWT tokens for our backend
    const tokens = generateTokenPair(appUser);
    
    console.log('✅ Google OAuth token exchange successful for user:', appUser.email);
    
    res.json({
      success: true,
      message: 'Google OAuth token exchange successful',
      user: {
        id: appUser.id,
        email: appUser.email,
        username: appUser.username,
        profile_pic: appUser.profile_pic,
        bio: appUser.bio,
        is_verified: appUser.is_verified,
        followers: appUser.followers,
        following: appUser.following,
        total_likes: appUser.total_likes,
        coins_earned: appUser.coins_earned,
        created_at: appUser.created_at,
        updated_at: appUser.updated_at
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600 // 1 hour
      },
      supabaseSession: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Google OAuth token exchange error:', error);
    res.status(500).json({
      error: 'Token exchange failed',
      message: error.message
    });
  }
}));

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

// Note: Google OAuth is now handled by Supabase Auth
// Removed custom OAuth endpoints as they're no longer needed

// Note: Social Auth is now handled by Supabase Auth
// Removed custom social auth endpoint as it's no longer needed

// Note: OAuth callback is now handled at root level (/auth/callback)

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
