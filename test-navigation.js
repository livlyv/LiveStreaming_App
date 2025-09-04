const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Navigation Structure');
console.log('===============================\n');

// Check if all required navigation files exist
const requiredFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/chat.tsx',
  'app/(tabs)/wallet.tsx',
  'app/(tabs)/go-live.tsx',
  'app/auth.tsx',
  'app/onboarding.tsx',
  'app/earnings.tsx',
  'app/purchase-coins.tsx',
  'app/settings.tsx',
  'app/notifications.tsx',
  'app/broadcast.tsx',
  'app/wallet.tsx',
  'app/chat/inbox.tsx',
  'app/chat/[chatId].tsx',
  'app/profile/[userId].tsx',
  'app/stream/[streamId].tsx'
];

console.log('📁 Checking required navigation files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) {
    allFilesExist = false;
  }
});

console.log('\n📋 Navigation Structure Analysis:');
console.log('================================');

if (allFilesExist) {
  console.log('✅ All required navigation files exist');
  
  // Check _layout.tsx for Stack.Screen declarations
  try {
    const layoutContent = fs.readFileSync('app/_layout.tsx', 'utf8');
    const stackScreens = layoutContent.match(/<Stack\.Screen name="([^"]+)"/g);
    
    if (stackScreens) {
      console.log('\n📱 Stack.Screen declarations found:');
      stackScreens.forEach(screen => {
        const name = screen.match(/name="([^"]+)"/)[1];
        console.log(`  - ${name}`);
      });
    }
    
    // Check for missing screens
    const declaredScreens = stackScreens ? stackScreens.map(s => s.match(/name="([^"]+)"/)[1]) : [];
    const missingScreens = [];
    
    ['earnings', 'purchase-coins'].forEach(screen => {
      if (!declaredScreens.includes(screen)) {
        missingScreens.push(screen);
      }
    });
    
    if (missingScreens.length > 0) {
      console.log('\n⚠️  Missing Stack.Screen declarations:');
      missingScreens.forEach(screen => {
        console.log(`  - ${screen}`);
      });
    } else {
      console.log('\n✅ All screens properly declared in Stack');
    }
    
  } catch (error) {
    console.log('❌ Error reading _layout.tsx:', error.message);
  }
  
  // Check tabs layout
  try {
    const tabsLayoutContent = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');
    const tabScreens = tabsLayoutContent.match(/<Tabs\.Screen name="([^"]+)"/g);
    
    if (tabScreens) {
      console.log('\n📱 Tab.Screen declarations found:');
      tabScreens.forEach(screen => {
        const name = screen.match(/name="([^"]+)"/)[1];
        console.log(`  - ${name}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error reading (tabs)/_layout.tsx:', error.message);
  }
  
} else {
  console.log('❌ Some required navigation files are missing');
}

console.log('\n🔧 Troubleshooting Tips:');
console.log('=======================');
console.log('1. Make sure all screen files exist in the correct locations');
console.log('2. Check that Stack.Screen declarations match the file names');
console.log('3. Verify that the navigation structure follows Expo Router conventions');
console.log('4. Ensure that dynamic routes ([param]) are properly handled');
console.log('5. Check that the auth flow properly navigates to (tabs) after login');

console.log('\n📝 Common Navigation Issues:');
console.log('============================');
console.log('- Missing Stack.Screen declarations in _layout.tsx');
console.log('- Incorrect file paths or naming conventions');
console.log('- Auth provider not properly setting user state');
console.log('- AsyncStorage issues preventing auth state persistence');
console.log('- Router.replace() calls happening before auth state is ready');
