const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use the admin client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDemoUser() {
  try {
    console.log('🔧 Setting up demo user...');
    
    // Hash the demo password
    const hashedPassword = await bcrypt.hash('Demo@123', 12);
    
    // First, try to delete any existing demo user
    console.log('🗑️  Cleaning up existing demo user...');
    await supabase
      .from('users')
      .delete()
      .eq('email', 'demo@gmail.com');
    
    // Create the demo user
    console.log('🆕 Creating demo user...');
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: 'demo@gmail.com',
        username: 'demo_user',
        password: hashedPassword,
        bio: 'Demo user for testing',
        profile_pic: 'https://ui-avatars.com/api/?name=demo&background=E30CBD&color=fff',
        followers: 0,
        following: 0,
        total_likes: 0,
        coins_earned: 0,
        is_verified: false
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating demo user:', error);
      return;
    }
    
    console.log('✅ Demo user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔑 Password: Demo@123');
    
    console.log('\n🎯 Test credentials:');
    console.log('📧 Email: demo@gmail.com');
    console.log('🔑 Password: Demo@123');
    console.log('\n🚀 You can now test the login functionality!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupDemoUser();
