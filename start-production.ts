// Production server starter
import { config } from 'dotenv';

// Force production environment
process.env.APP_ENV = 'production';
process.env.BASE_URL = 'https://dev-bo44fwxvov01657rf6ttq.rorktest.dev';

// Load other env vars
config();

// Start the server
import('./server');