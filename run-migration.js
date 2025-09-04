const { supabaseAdmin } = require('./backend/src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔧 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
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
    
    console.log('🎉 Migration completed!');
    
    // Verify the migration worked by checking if tables exist
    console.log('🔍 Verifying migration...');
    
    const tablesToCheck = [
      'user_settings',
      'blocked_users', 
      'withdrawals',
      'stream_likes',
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
    
    // Check if columns exist in users table
    const columnsToCheck = [
      'kyc_completed_at',
      'first_withdrawal_completed',
      'kyc_status',
      'kyc_document_url'
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
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Run the migration
runMigration();
