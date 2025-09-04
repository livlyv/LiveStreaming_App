const { supabaseAdmin } = require('./src/config/database');

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database issues...');
    
    // 1. Create support_complaints table
    console.log('📝 Creating support_complaints table...');
    const { error: supportError } = await supabaseAdmin
      .from('support_complaints')
      .select('id')
      .limit(1);
    
    if (supportError && supportError.code === 'PGRST205') {
      console.log('✅ support_complaints table does not exist, creating...');
      // We'll need to create this through Supabase dashboard or SQL editor
      console.log('⚠️  Please create the support_complaints table manually in Supabase dashboard');
    } else {
      console.log('✅ support_complaints table exists');
    }
    
    // 2. Check stream_gifts table structure
    console.log('📝 Checking stream_gifts table...');
    const { data: streamGifts, error: giftsError } = await supabaseAdmin
      .from('stream_gifts')
      .select('*')
      .limit(1);
    
    if (giftsError) {
      console.log('❌ Error checking stream_gifts:', giftsError.message);
    } else {
      console.log('✅ stream_gifts table exists');
    }
    
    // 3. Check if we can create a test support complaint
    console.log('📝 Testing support complaint creation...');
    const testComplaint = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      topic: 'test',
      subject: 'test subject',
      description: 'test description',
      email: 'test@test.com'
    };
    
    const { error: testError } = await supabaseAdmin
      .from('support_complaints')
      .insert(testComplaint);
    
    if (testError) {
      console.log('❌ Support complaints table issue:', testError.message);
    } else {
      console.log('✅ Support complaints table working');
      // Clean up test data
      await supabaseAdmin
        .from('support_complaints')
        .delete()
        .eq('email', 'test@test.com');
    }
    
    // 4. Check earnings function
    console.log('📝 Testing earnings function...');
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .rpc('get_gift_earnings', { user_uuid: '00000000-0000-0000-0000-000000000000' });
    
    if (earningsError) {
      console.log('❌ Earnings function error:', earningsError.message);
    } else {
      console.log('✅ Earnings function working');
    }
    
    // 5. Check top gifts function
    console.log('📝 Testing top gifts function...');
    const { data: topGifts, error: topGiftsError } = await supabaseAdmin
      .rpc('get_top_gifts', { user_uuid: '00000000-0000-0000-0000-000000000000', gift_limit: 4 });
    
    if (topGiftsError) {
      console.log('❌ Top gifts function error:', topGiftsError.message);
    } else {
      console.log('✅ Top gifts function working');
    }
    
    // 6. Check top gifter function
    console.log('📝 Testing top gifter function...');
    const { data: topGifter, error: topGifterError } = await supabaseAdmin
      .rpc('get_top_gifter', { user_uuid: '00000000-0000-0000-0000-000000000000' });
    
    if (topGifterError) {
      console.log('❌ Top gifter function error:', topGifterError.message);
    } else {
      console.log('✅ Top gifter function working');
    }
    
    console.log('🎉 Database check completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  }
}

fixDatabase();
