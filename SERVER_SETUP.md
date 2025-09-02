# Server Setup Instructions

## How to Run the Backend Server

### Option 1: Run the server directly
```bash
bun run server.ts
```

### Option 2: Run with auto-reload (recommended for development)
```bash
bun --watch server.ts
```

### Option 3: Run both server and Expo app together
```bash
# Install concurrently first (already done)
# bun add concurrently

# Then run both
bun run concurrently "bun --watch server.ts" "bun run start"
```

## Server Endpoints

Once the server is running on `http://localhost:3000`, you can access:

- **API Root**: http://localhost:3000/api/
- **Health Check**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api/docs
- **Auth Signup**: http://localhost:3000/api/auth/signup
- **Auth Login**: http://localhost:3000/api/auth/login

## Environment Variables

Make sure your `.env` file has:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
```

## Testing the Connection

1. Start the server: `bun --watch server.ts`
2. Open your Expo app
3. Use the Network Test component to verify connectivity
4. Try signing up with email/password

## Troubleshooting

If you get network errors:
1. Make sure the server is running on port 3000
2. Check that `EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000` in your `.env`
3. Verify your Supabase credentials are correct
4. Check the server logs for any errors

## Production Deployment

For production, update your `.env` file:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-production-domain.com
```