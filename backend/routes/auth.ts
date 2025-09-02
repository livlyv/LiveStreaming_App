import { Hono } from "hono";
import { supabase, supabaseAdmin, User } from "../utils/supabase";
import { getAuthSecret, signJWT, verifyJWT } from "../utils/jwt";

const auth = new Hono();

type OTPRequestBody = { phone: string };
type OTPVerifyBody = { phone: string; code: string; username?: string; bio?: string };
type EmailSignupBody = { email: string; password: string; username: string; bio?: string };
type EmailLoginBody = { email: string; password: string };
type SocialAuthBody = { provider: 'google' | 'facebook' | 'apple'; token: string };

type TokenPair = { 
  accessToken: string; 
  refreshToken: string; 
  tokenType: "Bearer"; 
  expiresIn: number;
  user: User;
};

// In-memory OTP storage (replace with Redis in production)
const otpStore: Record<string, { code: string; expires: number }> = {};

// Helper function to send OTP (integrate with SMS provider)
async function sendOTP(phone: string, code: string): Promise<boolean> {
  // TODO: Integrate with SMS provider (MSG91, Twilio, etc.)
  console.log(`Sending OTP ${code} to ${phone}`);
  
  // For development, always return true
  // In production, implement actual SMS sending logic
  return true;
}

// Helper function to create user in Supabase
async function createUser(userData: Partial<User>): Promise<User | null> {
  try {
    const insertData: any = {
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

    return data as User;
  } catch (err) {
    console.error('Error creating user:', err);
    return null;
  }
}

// Helper function to get user by phone or email
async function getUserByIdentifier(identifier: string, type: 'phone' | 'email'): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq(type, identifier)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  } catch {
    return null;
  }
}

// OTP Request endpoint
auth.post("/otp/request", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<OTPRequestBody>;
    
    if (!body.phone) {
      return c.json({ error: "Phone number is required" }, 400);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore[body.phone] = { code, expires };

    // Send OTP via SMS
    const sent = await sendOTP(body.phone, code);
    
    if (!sent) {
      return c.json({ error: "Failed to send OTP" }, 500);
    }

    return c.json({ 
      success: true, 
      phone: body.phone,
      message: "OTP sent successfully",
      // Remove in production
      mockCode: process.env.APP_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// OTP Verify endpoint
auth.post("/otp/verify", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<OTPVerifyBody>;
    
    if (!body.phone || !body.code) {
      return c.json({ error: "Phone number and OTP code are required" }, 400);
    }

    // Check OTP
    const storedOTP = otpStore[body.phone];
    if (!storedOTP || storedOTP.code !== body.code || Date.now() > storedOTP.expires) {
      return c.json({ error: "Invalid or expired OTP" }, 401);
    }

    // Clear used OTP
    delete otpStore[body.phone];

    // Check if user exists
    let user = await getUserByIdentifier(body.phone, 'phone');
    
    // If user doesn't exist, create new user (signup)
    if (!user) {
      if (!body.username) {
        return c.json({ error: "Username is required for new users" }, 400);
      }

      user = await createUser({
        phone: body.phone,
        username: body.username,
        bio: body.bio
      });

      if (!user) {
        return c.json({ error: "Failed to create user" }, 500);
      }
    }

    // Generate JWT tokens
    const secret = getAuthSecret(c);
    const sub = `user:${user.id}`;
    const accessToken = await signJWT({ sub, role: "user", userId: user.id }, secret, 900); // 15 minutes
    const refreshToken = await signJWT({ sub, type: "refresh", userId: user.id }, secret, 60 * 60 * 24 * 7); // 7 days

    const response: TokenPair = { 
      accessToken, 
      refreshToken, 
      tokenType: "Bearer", 
      expiresIn: 900,
      user
    };

    return c.json(response);
  } catch (error) {
    console.error('OTP verify error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Email Signup endpoint
auth.post("/signup", async (c) => {
  console.log('🔐 Signup endpoint called');
  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<EmailSignupBody>;
    console.log('📝 Signup request body:', JSON.stringify(body, null, 2));
    
    if (!body.email || !body.password || !body.username) {
      console.log('❌ Missing required fields:', { email: !!body.email, password: !!body.password, username: !!body.username });
      return c.json({ error: "Email, password, and username are required" }, 400);
    }

    // Check if user already exists
    const existingUser = await getUserByIdentifier(body.email, 'email');
    if (existingUser) {
      return c.json({ error: "User already exists with this email" }, 409);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false // We'll handle email verification
    });

    if (authError) {
      console.error('❌ Supabase auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      console.error('❌ No user data returned from Supabase');
      return c.json({ error: "Failed to create user" }, 500);
    }

    console.log('✅ Supabase user created:', authData.user.id);

    // Create user profile in our database
    const user = await createUser({
      id: authData.user.id,
      email: body.email,
      username: body.username,
      bio: body.bio
    });

    console.log('✅ User profile created:', user ? 'success' : 'failed');

    if (!user) {
      return c.json({ error: "Failed to create user profile" }, 500);
    }

    return c.json({ 
      success: true, 
      message: "User created successfully. Please check your email for verification.",
      user,
      needsEmailVerification: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Email Login endpoint
auth.post("/login", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<EmailLoginBody>;
    
    if (!body.email || !body.password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Get user profile first to check if they exist
    const user = await getUserByIdentifier(body.email, 'email');
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Try to authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (authError) {
      return c.json({ error: authError.message }, 401);
    }

    if (!authData.user) {
      return c.json({ error: "Authentication failed" }, 401);
    }

    // For development, skip email verification check
    // In production, uncomment this:
    // if (!authData.user.email_confirmed_at) {
    //   return c.json({ error: "Please verify your email before logging in" }, 403);
    // }

    // Generate JWT tokens
    const secret = getAuthSecret(c);
    const sub = `user:${user.id}`;
    const accessToken = await signJWT({ sub, role: "user", userId: user.id }, secret, 900);
    const refreshToken = await signJWT({ sub, type: "refresh", userId: user.id }, secret, 60 * 60 * 24 * 7);

    const response: TokenPair = { 
      accessToken, 
      refreshToken, 
      tokenType: "Bearer", 
      expiresIn: 900,
      user
    };

    return c.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Social Auth endpoint (Google, Facebook, Apple)
auth.post("/social", async (c) => {
  console.log('🔐 Social auth endpoint called');
  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<SocialAuthBody>;
    console.log('📝 Social auth request body:', JSON.stringify(body, null, 2));
    
    if (!body.provider || !body.token) {
      return c.json({ error: "Provider and token are required" }, 400);
    }

    // TODO: Verify the social token with the respective provider
    // For now, we'll create a mock implementation
    
    let userInfo: { email: string; name: string; picture?: string } | null = null;

    switch (body.provider) {
      case 'google':
        // TODO: Verify Google token and get user info
        userInfo = {
          email: 'user@gmail.com',
          name: 'Google User',
          picture: 'https://ui-avatars.com/api/?name=Google+User&background=6900D1&color=fff'
        };
        break;
      case 'facebook':
        // TODO: Verify Facebook token and get user info
        userInfo = {
          email: 'user@facebook.com',
          name: 'Facebook User',
          picture: 'https://ui-avatars.com/api/?name=Facebook+User&background=6900D1&color=fff'
        };
        break;
      case 'apple':
        // TODO: Verify Apple token and get user info
        userInfo = {
          email: 'user@icloud.com',
          name: 'Apple User',
          picture: 'https://ui-avatars.com/api/?name=Apple+User&background=6900D1&color=fff'
        };
        break;
      default:
        return c.json({ error: "Unsupported provider" }, 400);
    }

    if (!userInfo) {
      return c.json({ error: "Failed to get user info from provider" }, 400);
    }

    // Check if user exists
    let user = await getUserByIdentifier(userInfo.email, 'email');
    
    // If user doesn't exist, create new user
    if (!user) {
      user = await createUser({
        email: userInfo.email,
        username: userInfo.name.toLowerCase().replace(/\s+/g, '_'),
        bio: "Hey there! I'm new here",
        profile_pic: userInfo.picture
      });

      if (!user) {
        return c.json({ error: "Failed to create user" }, 500);
      }
    }

    // Generate JWT tokens
    const secret = getAuthSecret(c);
    const sub = `user:${user.id}`;
    const accessToken = await signJWT({ sub, role: "user", userId: user.id }, secret, 900);
    const refreshToken = await signJWT({ sub, type: "refresh", userId: user.id }, secret, 60 * 60 * 24 * 7);

    const response: TokenPair = { 
      accessToken, 
      refreshToken, 
      tokenType: "Bearer", 
      expiresIn: 900,
      user
    };

    return c.json(response);
  } catch (error) {
    console.error('Social auth error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Refresh Token endpoint
auth.post("/refresh", async (c) => {
  try {
    const secret = getAuthSecret(c);
    const body = (await c.req.json().catch(() => ({}))) as { refreshToken?: string };
    const token = body.refreshToken || c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      return c.json({ error: "Refresh token required" }, 400);
    }

    const payload = await verifyJWT(token, secret);
    if (!payload || (payload as any).type !== "refresh") {
      return c.json({ error: "Invalid refresh token" }, 401);
    }

    // Get user to include in response
    const userId = (payload as any).userId;
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return c.json({ error: "User not found" }, 404);
    }

    const accessToken = await signJWT({ sub: payload.sub, role: "user", userId }, secret, 900);
    
    return c.json({ 
      accessToken, 
      tokenType: "Bearer", 
      expiresIn: 900,
      user: userData as User
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Logout endpoint
auth.post("/logout", async (c) => {
  try {
    // In a production app, you might want to blacklist the token
    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get current user endpoint
auth.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("authorization");
    if (!authHeader) {
      return c.json({ error: "Authorization header required" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const secret = getAuthSecret(c);
    const payload = await verifyJWT(token, secret);

    if (!payload) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const userId = (payload as any).userId;
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: userData as User });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;