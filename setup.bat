@echo off
echo ========================================
echo Live Streaming App - REST API Setup
echo ========================================
echo.

echo Installing backend dependencies...
call npm run install:backend

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy backend/env.example to backend/.env
echo 2. Configure your environment variables in backend/.env
echo 3. Run: npm run start:backend
echo 4. In another terminal, run: npm start
echo.
echo Or run both together with: npm run start:both
echo.
pause
