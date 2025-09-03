const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Debug environment variables
console.log('🔧 Supabase Environment Check:');
console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configured' : 'missing');
console.log('🔧 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing');
console.log('🔧 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Client for frontend operations (with RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = {
  supabase,
  supabaseAdmin
};
