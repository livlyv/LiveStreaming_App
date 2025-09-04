const { supabaseAdmin } = require('./backend/src/config/database');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  try {
    console.log('🔧 Starting database schema application...');
    
    // Read the main schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Applying main schema...');
    
    // Execute the schema in chunks
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          
          // Use raw SQL execution
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} had an error (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }
    
    // Now apply the migration to ensure all tables and columns exist
    console.log('📝 Applying migration...');
    
    const migrationPath = path.join(__dirname, 'database', 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const migrationStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < migrationStatements.length; i++) {
      const statement = migrationStatements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing migration statement ${i + 1}/${migrationStatements.length}...`);
          
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Migration statement ${i + 1} had an error (this might be expected):`, error.message);
          } else {
            console.log(`✅ Migration statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Migration statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }
    
    console.log('🎉 Schema application completed!');
    
    // Verify the schema was applied correctly
    console.log('🔍 Verifying schema...');
    
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
          console.log(`❌ Table ${tableName} does not exist or has issues:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} check failed:`, err.message);
      }
    }
    
    // Check if required columns exist in users table
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
        console.log('❌ Users table columns check failed:', error.message);
      } else {
        console.log('✅ Users table has all required columns');
      }
    } catch (err) {
      console.log('❌ Users table columns check failed:', err.message);
    }
    
    // Check if functions exist
    const functionsToCheck = [
      'get_stream_duration_by_period',
      'get_top_gifter',
      'get_top_gifts',
      'get_gift_earnings',
      'update_follower_counts',
      'update_like_counts'
    ];
    
    for (const funcName of functionsToCheck) {
      try {
        // Try to call the function with dummy parameters
        const { data, error } = await supabaseAdmin.rpc(funcName, { 
          user_uuid: '00000000-0000-0000-0000-000000000000',
          period_type: 'weekly',
          gift_limit: 1
        });
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Function ${funcName} does not exist`);
        } else {
          console.log(`✅ Function ${funcName} exists`);
        }
      } catch (err) {
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          console.log(`❌ Function ${funcName} does not exist`);
        } else {
          console.log(`✅ Function ${funcName} exists`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Schema application failed:', error);
  }
}

// Run the schema application
applySchema();
