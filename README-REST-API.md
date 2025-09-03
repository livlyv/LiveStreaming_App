# Live Streaming App - REST API Backend

This project has been restructured to use a RESTful API architecture with Node.js and Express.js, replacing the previous tRPC implementation.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm
- Supabase account and project
- Expo CLI (for frontend)

### 1. Install Backend Dependencies
```bash
npm run install:backend
```

### 2. Configure Environment Variables
Copy the example environment file and configure your variables:
```bash
cd backend
cp env.example .env
```

Edit `.env` with your actual values:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Start the Backend Server
```bash
npm run start:backend
```

The API will be available at `http://localhost:3000`

### 4. Start the Frontend (in a new terminal)
```bash
npm start
```

### 5. Start Both Frontend and Backend Together
```bash
npm run start:both
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Supabase configuration
│   ├── middleware/
│   │   └── auth.ts             # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   ├── users.ts             # User management routes
│   │   ├── streaming.ts         # Streaming routes
│   │   ├── payments.ts          # Payment routes
│   │   ├── notifications.ts     # Notification routes
│   │   └── media.ts             # Media upload routes
│   ├── utils/
│   │   └── jwt.ts               # JWT utilities
│   └── server.js                # Main server file
├── package.json                 # Backend dependencies
├── tsconfig.json               # TypeScript configuration
└── env.example                 # Environment variables template

services/
└── api.ts                      # Frontend API client
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login/signup
- `POST /api/auth/email/signup` - Email signup
- `POST /api/auth/email/login` - Email login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/social` - Social authentication (placeholder)

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user
- `GET /api/users/:userId/followers` - Get user followers
- `GET /api/users/:userId/following` - Get user following
- `GET /api/users/search` - Search users

### Streaming
- `POST /api/streaming` - Create new stream
- `GET /api/streaming/live` - Get live streams
- `GET /api/streaming/:streamId` - Get stream by ID
- `POST /api/streaming/:streamId/start` - Start stream
- `POST /api/streaming/:streamId/end` - End stream
- `GET /api/streaming/user/:userId` - Get user's streams
- `DELETE /api/streaming/:streamId` - Delete stream

### Payments
- `GET /api/payments/gifts` - Get available gifts
- `POST /api/payments/purchase-coins` - Purchase coins
- `POST /api/payments/send-gift` - Send gift to streamer
- `GET /api/payments/transactions` - Get user transactions
- `GET /api/payments/earnings` - Get user earnings
- `POST /api/payments/withdraw` - Request withdrawal

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

### Media
- `POST /api/media/upload` - Upload file
- `GET /api/media/my-files` - Get user's files
- `DELETE /api/media/:fileId` - Delete file
- `GET /api/media/:fileId` - Get file by ID

### Health Check
- `GET /health` - Health check endpoint

## 🔧 Frontend Integration

The frontend has been updated to use the new REST API client located in `services/api.ts`. The API client handles:

- Automatic token management
- Token refresh on expiration
- Error handling
- Request/response typing

### Usage Example
```typescript
import { apiClient } from '../services/api';

// Login with OTP
const login = async () => {
  try {
    const response = await apiClient.verifyOTP('+1234567890', '123456', 'username');
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get live streams
const getStreams = async () => {
  try {
    const response = await apiClient.getLiveStreams();
    console.log('Live streams:', response.streams);
  } catch (error) {
    console.error('Failed to get streams:', error);
  }
};
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
```

### Frontend Development
```bash
npm start           # Start Expo development server
npm run start-web   # Start web version
```

## 🔒 Security Features

- JWT-based authentication with access and refresh tokens
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet security headers
- Input validation with express-validator
- Password hashing with bcryptjs

## 📊 Database Schema

The backend uses Supabase with the following main tables:
- `users` - User profiles and authentication
- `streams` - Live streaming sessions
- `follows` - User follow relationships
- `gifts` - Available gifts for purchase
- `transactions` - Payment and gift transactions
- `notifications` - User notifications
- `messages` - Stream chat messages
- `media_files` - Uploaded media files

## 🚀 Deployment

### Backend Deployment
1. Build the backend: `npm run build:backend`
2. Set production environment variables
3. Deploy to your preferred hosting service (Heroku, Vercel, etc.)

### Frontend Deployment
1. Update `EXPO_PUBLIC_API_BASE_URL` to point to your deployed backend
2. Deploy using Expo's deployment services

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the frontend URL is added to the CORS origins in `server.js`
2. **Authentication Errors**: Check that JWT_SECRET is properly set
3. **Database Errors**: Verify Supabase credentials and connection
4. **Port Conflicts**: Change PORT in .env if 3000 is already in use

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 📝 API Documentation

For detailed API documentation, visit `http://localhost:3000` when the server is running to see available endpoints.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
