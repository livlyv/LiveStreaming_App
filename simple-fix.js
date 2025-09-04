const { supabaseAdmin } = require('./backend/src/config/database');

async function simpleFix() {
  try {
    console.log('🔧 Applying simple database fix...');
    
    // 1. First, let's check what tables exist
    console.log('📝 Checking existing tables...');
    
    const tablesToCheck = [
      'users',
      'user_settings',
      'blocked_users', 
      'followers',
      'streams',
      'stream_duration',
      'stream_likes',
      'gifts',
      'stream_gifts',
      'transactions',
      'withdrawals',
      'support_complaints',
      'notifications'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName} does not exist:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} does not exist:`, err.message);
      }
    }
    
    // 2. Check what columns exist in users table
    console.log('📝 Checking users table columns...');
    
    const columnsToCheck = [
      'kyc_completed_at',
      'first_withdrawal_completed',
      'kyc_status',
      'kyc_document_url',
      'followers_count',
      'following_count',
      'total_likes',
      'coins_earned'
    ];
    
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(columnsToCheck.join(', '))
        .limit(1);
      
      if (error) {
        console.log('❌ Users table missing columns:', error.message);
      } else {
        console.log('✅ Users table has all required columns');
      }
    } catch (err) {
      console.log('❌ Users table missing columns:', err.message);
    }
    
    // 3. Create user_settings table if it doesn't exist
    console.log('📝 Creating user_settings table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('user_settings')
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ user_settings table does not exist - you need to create it manually in Supabase dashboard');
      } else {
        console.log('✅ user_settings table exists');
      }
    } catch (err) {
      console.log('❌ user_settings table does not exist - you need to create it manually in Supabase dashboard');
    }
    
    // 4. Create blocked_users table if it doesn't exist
    console.log('📝 Creating blocked_users table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('blocked_users')
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ blocked_users table does not exist - you need to create it manually in Supabase dashboard');
      } else {
        console.log('✅ blocked_users table exists');
      }
    } catch (err) {
      console.log('❌ blocked_users table does not exist - you need to create it manually in Supabase dashboard');
    }
    
    // 5. Create withdrawals table if it doesn't exist
    console.log('📝 Creating withdrawals table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ withdrawals table does not exist - you need to create it manually in Supabase dashboard');
      } else {
        console.log('✅ withdrawals table exists');
      }
    } catch (err) {
      console.log('❌ withdrawals table does not exist - you need to create it manually in Supabase dashboard');
    }
    
    // 6. Create stream_likes table if it doesn't exist
    console.log('📝 Creating stream_likes table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('stream_likes')
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ stream_likes table does not exist - you need to create it manually in Supabase dashboard');
      } else {
        console.log('✅ stream_likes table exists');
      }
    } catch (err) {
      console.log('❌ stream_likes table does not exist - you need to create it manually in Supabase dashboard');
    }
    
    // 7. Create notifications table if it doesn't exist
    console.log('📝 Creating notifications table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ notifications table does not exist - you need to create it manually in Supabase dashboard');
      } else {
        console.log('✅ notifications table exists');
      }
    } catch (err) {
      console.log('❌ notifications table does not exist - you need to create it manually in Supabase dashboard');
    }
    
    // 8. Insert sample gifts
    console.log('📝 Inserting sample gifts...');
    try {
      const { error } = await supabaseAdmin
        .from('gifts')
        .upsert([
          { name: 'Rose', icon: '🌹', coins_cost: 10, description: 'A beautiful rose' },
          { name: 'Heart', icon: '❤️', coins_cost: 50, description: 'Show your love' },
          { name: 'Crown', icon: '👑', coins_cost: 100, description: 'Royal gift' },
          { name: 'Diamond', icon: '💎', coins_cost: 500, description: 'Precious diamond' },
          { name: 'Rocket', icon: '🚀', coins_cost: 1000, description: 'To the moon!' }
        ], { onConflict: 'name' });
      
      if (error) {
        console.log('⚠️  Error inserting gifts:', error.message);
      } else {
        console.log('✅ Inserted sample gifts');
      }
    } catch (err) {
      console.log('⚠️  Error inserting gifts:', err.message);
    }
    
    console.log('\n🎉 Database check completed!');
    console.log('\n📋 SUMMARY:');
    console.log('If you see any "does not exist" errors above, you need to:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the SQL from database/schema.sql');
    console.log('4. Or run the SQL from database/migrations.sql');
    console.log('\nThis will create all the missing tables and columns.');
    
  } catch (error) {
    console.error('💥 Database check failed:', error);
  }
}

// Run the simple fix
simpleFix();
