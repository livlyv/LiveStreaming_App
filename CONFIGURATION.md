# Configuration Management

## Centralized API Configuration

All API URLs and configuration are now managed from a single location: `lib/config.ts`

### Files that use the centralized config:

1. **Frontend Services:**
   - `services/authService.ts` - imports `API_BASE_URL`
   - `services/api.ts` - imports `API_BASE_URL`

2. **Backend:**
   - `backend/src/server.js` - imports `BACKEND_HOST` and `BACKEND_PORT`

3. **Legacy Support:**
   - `config.js` - imports from centralized config for backward compatibility

### How to update the ngrok URL:

**Option 1: Use the update script (Recommended)**
```bash
node update-ngrok.js https://your-new-ngrok-url.ngrok-free.app
```

**Option 2: Manual update**
Edit `lib/config.ts` and change the `BASE_URL` value:
```typescript
BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-new-ngrok-url.ngrok-free.app',
```

### Environment Variables:

- `EXPO_PUBLIC_API_BASE_URL` - Overrides the default ngrok URL
- `HOST` - Backend host (default: localhost)
- `PORT` - Backend port (default: 3000)
- `NODE_ENV` - Environment (default: development)

### Benefits:

✅ **Single source of truth** - Only one file to update  
✅ **Type safety** - TypeScript configuration with proper types  
✅ **Automatic API path** - Always appends `/api` correctly  
✅ **Environment variable support** - Can override via .env files  
✅ **Backward compatibility** - Existing scripts still work  

### File Structure:
```
lib/
├── config.ts          # TypeScript config (frontend)
└── config.js          # JavaScript config (backend)
```

The configuration automatically handles:
- Base URL + `/api` path combination
- Environment variable fallbacks
- Type safety for frontend usage
- CommonJS exports for backend usage
