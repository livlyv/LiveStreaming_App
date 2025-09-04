const { supabaseAdmin } = require('./src/config/database');

async function debugSettings() {
  console.log('🔍 Debugging settings endpoint...');
  
  const userId = 'c3688b4b-898e-4430-9b08-1137af4080e2';
  
  try {
    // Test 1: Check if user exists
    console.log('📋 Test 1: Checking if user exists...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }
    console.log('✅ User found:', user);
    
    // Test 2: Check current settings
    console.log('📋 Test 2: Checking current settings...');
    const { data: currentSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Settings query error:', settingsError);
    } else {
      console.log('✅ Current settings:', currentSettings);
    }
    
    // Test 3: Try to upsert settings with onConflict
    console.log('📋 Test 3: Testing settings upsert with onConflict...');
    const testSettings = {
      user_id: userId,
      notifications_enabled: true,
      gift_notifications: true,
      live_notifications: true
    };
    
    const { data: upsertResult, error: upsertError } = await supabaseAdmin
      .from('user_settings')
      .upsert(testSettings, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('❌ Upsert error:', upsertError);
      console.error('❌ Error details:', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint
      });
    } else {
      console.log('✅ Upsert successful:', upsertResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugSettings();
