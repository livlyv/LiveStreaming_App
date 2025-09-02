# Demo Streaming App

A React Native streaming app built with Expo, Hono backend, and Supabase.

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Start the Server
```bash
bun start
```

This will:
- Start the Hono backend server
- Create a tunnel to make it accessible at: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev`
- Start the Expo development server

### 3. Environment Variables

Your `.env` file is already configured with:
- `EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-bo44fwxvov01657rf6ttq.rorktest.dev`
- Supabase credentials
- JWT secret

### 4. API Endpoints

Once the server is running, you can access:
- **API Root**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/`
- **Health Check**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/health`
- **API Docs**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/docs`
- **Auth Signup**: `https://dev-bo44fwxvov01657rf6ttq.rorktest.dev/api/auth/signup`

### 5. Testing the Connection

The app includes a Network Test component that will verify all endpoints are working.

## Backend Framework

- **Backend**: Hono (lightweight web framework)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **API Style**: REST with tRPC for some endpoints

## Frontend Framework

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Query + Context API
- **Styling**: StyleSheet (React Native)

## Troubleshooting

### Server Not Starting
1. Make sure you're in the project root directory
2. Run `bun start` (not `npm start` or `yarn start`)
3. Check that port 3000 is not in use

### Network Request Failed
1. Ensure the server is running with `bun start`
2. Check that the tunnel URL is accessible
3. Verify `.env` has the correct `EXPO_PUBLIC_RORK_API_BASE_URL`

### JSON Parse Error
This usually means the server is returning HTML instead of JSON:
1. Check server logs for errors
2. Verify the API endpoint exists
3. Test endpoints manually in browser or Postman

Created by Rork
