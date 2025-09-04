const { supabaseAdmin } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  try {
    console.log('🔄 Applying database schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
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
    
    console.log('🎉 Database schema application completed!');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

// Alternative approach: Execute schema directly
async function applySchemaDirect() {
  try {
    console.log('🔄 Applying database schema directly...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
    } else {
      console.log('✅ Schema executed successfully');
    }
    
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    
    // Fallback: Try to create tables individually
    console.log('🔄 Trying fallback approach...');
    await createTablesIndividually();
  }
}

async function createTablesIndividually() {
  try {
    console.log('🔧 Creating tables individually...');
    
    // Create support_complaints table
    const supportComplaintsSQL = `
      CREATE TABLE IF NOT EXISTS support_complaints (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assigned_to UUID REFERENCES users(id),
        resolution TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: supportError } = await supabaseAdmin.rpc('exec_sql', { sql: supportComplaintsSQL });
    if (supportError) {
      console.log('⚠️  Support complaints table error (might already exist):', supportError.message);
    } else {
      console.log('✅ Support complaints table created');
    }
    
    // Add missing columns to stream_gifts
    const alterStreamGiftsSQL = `
      ALTER TABLE stream_gifts 
      ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS coins_amount INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS message TEXT;
    `;
    
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { sql: alterStreamGiftsSQL });
    if (alterError) {
      console.log('⚠️  Stream gifts alteration error:', alterError.message);
    } else {
      console.log('✅ Stream gifts table updated');
    }
    
    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_support_complaints_user_id ON support_complaints(user_id);
      CREATE INDEX IF NOT EXISTS idx_support_complaints_status ON support_complaints(status);
      CREATE INDEX IF NOT EXISTS idx_support_complaints_created_at ON support_complaints(created_at);
    `;
    
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', { sql: indexesSQL });
    if (indexError) {
      console.log('⚠️  Index creation error:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }
    
    console.log('🎉 Individual table creation completed!');
    
  } catch (error) {
    console.error('❌ Error in individual table creation:', error);
  }
}

// Run the schema application
applySchemaDirect();
