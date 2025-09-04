const { supabaseAdmin } = require('./backend/src/config/database');

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // 1. Add missing columns to users table
    console.log('📝 Adding missing columns to users table...');
    
    const columnsToAdd = [
      'kyc_completed_at TIMESTAMP WITH TIME ZONE',
      'first_withdrawal_completed BOOLEAN DEFAULT FALSE',
      'kyc_status VARCHAR(20) DEFAULT \'pending\' CHECK (kyc_status IN (\'pending\', \'verified\', \'rejected\'))',
      'kyc_document_url VARCHAR(500)'
    ];
    
    for (const column of columnsToAdd) {
      try {
        const columnName = column.split(' ')[0];
        const { error } = await supabaseAdmin.rpc('add_column_if_not_exists', {
          table_name: 'users',
          column_name: columnName,
          column_definition: column
        });
        
        if (error) {
          console.log(`⚠️  Column ${columnName} might already exist:`, error.message);
        } else {
          console.log(`✅ Added column ${columnName} to users table`);
        }
      } catch (err) {
        console.log(`⚠️  Column ${column.split(' ')[0]} might already exist:`, err.message);
      }
    }
    
    // 2. Create user_settings table
    console.log('📝 Creating user_settings table...');
    try {
      const { error } = await supabaseAdmin.rpc('create_table_if_not_exists', {
        table_name: 'user_settings',
        table_definition: `
          CREATE TABLE IF NOT EXISTS user_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            notifications_enabled BOOLEAN DEFAULT TRUE,
            gift_notifications BOOLEAN DEFAULT TRUE,
            live_notifications BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          )
        `
      });
      
      if (error) {
        console.log('⚠️  user_settings table might already exist:', error.message);
      } else {
        console.log('✅ Created user_settings table');
      }
    } catch (err) {
      console.log('⚠️  user_settings table might already exist:', err.message);
    }
    
    // 3. Create blocked_users table
    console.log('📝 Creating blocked_users table...');
    try {
      const { error } = await supabaseAdmin.rpc('create_table_if_not_exists', {
        table_name: 'blocked_users',
        table_definition: `
          CREATE TABLE IF NOT EXISTS blocked_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
            blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(blocker_id, blocked_id)
          )
        `
      });
      
      if (error) {
        console.log('⚠️  blocked_users table might already exist:', error.message);
      } else {
        console.log('✅ Created blocked_users table');
      }
    } catch (err) {
      console.log('⚠️  blocked_users table might already exist:', err.message);
    }
    
    // 4. Create withdrawals table
    console.log('📝 Creating withdrawals table...');
    try {
      const { error } = await supabaseAdmin.rpc('create_table_if_not_exists', {
        table_name: 'withdrawals',
        table_definition: `
          CREATE TABLE IF NOT EXISTS withdrawals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            amount INTEGER NOT NULL,
            withdrawal_method VARCHAR(50) NOT NULL,
            account_details JSONB,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            cashfree_payout_id VARCHAR(255),
            failure_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      });
      
      if (error) {
        console.log('⚠️  withdrawals table might already exist:', error.message);
      } else {
        console.log('✅ Created withdrawals table');
      }
    } catch (err) {
      console.log('⚠️  withdrawals table might already exist:', err.message);
    }
    
    // 5. Create stream_likes table
    console.log('📝 Creating stream_likes table...');
    try {
      const { error } = await supabaseAdmin.rpc('create_table_if_not_exists', {
        table_name: 'stream_likes',
        table_definition: `
          CREATE TABLE IF NOT EXISTS stream_likes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(stream_id, user_id)
          )
        `
      });
      
      if (error) {
        console.log('⚠️  stream_likes table might already exist:', error.message);
      } else {
        console.log('✅ Created stream_likes table');
      }
    } catch (err) {
      console.log('⚠️  stream_likes table might already exist:', err.message);
    }
    
    // 6. Create notifications table
    console.log('📝 Creating notifications table...');
    try {
      const { error } = await supabaseAdmin.rpc('create_table_if_not_exists', {
        table_name: 'notifications',
        table_definition: `
          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL CHECK (type IN ('follow', 'gift', 'like', 'comment', 'system', 'live_stream')),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            data JSONB,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      });
      
      if (error) {
        console.log('⚠️  notifications table might already exist:', error.message);
      } else {
        console.log('✅ Created notifications table');
      }
    } catch (err) {
      console.log('⚠️  notifications table might already exist:', err.message);
    }
    
    // 7. Enable RLS on new tables
    console.log('📝 Enabling RLS on new tables...');
    const tablesToEnableRLS = ['user_settings', 'blocked_users', 'withdrawals', 'stream_likes', 'notifications'];
    
    for (const tableName of tablesToEnableRLS) {
      try {
        const { error } = await supabaseAdmin.rpc('enable_rls', { table_name: tableName });
        if (error) {
          console.log(`⚠️  RLS might already be enabled on ${tableName}:`, error.message);
        } else {
          console.log(`✅ Enabled RLS on ${tableName}`);
        }
      } catch (err) {
        console.log(`⚠️  RLS might already be enabled on ${tableName}:`, err.message);
      }
    }
    
    // 8. Create indexes
    console.log('📝 Creating indexes...');
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id)',
      'CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id)',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status)',
      'CREATE INDEX IF NOT EXISTS idx_stream_likes_stream_id ON stream_likes(stream_id)',
      'CREATE INDEX IF NOT EXISTS idx_stream_likes_user_id ON stream_likes(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)'
    ];
    
    for (const indexSQL of indexesToCreate) {
      try {
        const { error } = await supabaseAdmin.rpc('create_index_if_not_exists', { index_sql: indexSQL });
        if (error) {
          console.log(`⚠️  Index might already exist:`, error.message);
        } else {
          console.log(`✅ Created index`);
        }
      } catch (err) {
        console.log(`⚠️  Index might already exist:`, err.message);
      }
    }
    
    // 9. Insert sample gifts
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
    
    console.log('🎉 Database fix completed!');
    
    // Verify the fix worked
    console.log('🔍 Verifying database fix...');
    
    // Test if we can query the new columns
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('kyc_status, first_withdrawal_completed, kyc_completed_at')
        .limit(1);
      
      if (error) {
        console.log('❌ Users table columns still have issues:', error.message);
      } else {
        console.log('✅ Users table columns are working');
      }
    } catch (err) {
      console.log('❌ Users table columns still have issues:', err.message);
    }
    
    // Test if we can query the new tables
    const tablesToTest = ['user_settings', 'blocked_users', 'withdrawals', 'stream_likes', 'notifications'];
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName} still has issues:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} is working`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} still has issues:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Database fix failed:', error);
  }
}

// Run the database fix
fixDatabase();
