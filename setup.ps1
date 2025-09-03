Write-Host "========================================" -ForegroundColor Green
Write-Host "Live Streaming App - REST API Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm run install:backend

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy backend/env.example to backend/.env" -ForegroundColor White
Write-Host "2. Configure your environment variables in backend/.env" -ForegroundColor White
Write-Host "3. Run: npm run start:backend" -ForegroundColor White
Write-Host "4. In another terminal, run: npm start" -ForegroundColor White
Write-Host ""
Write-Host "Or run both together with: npm run start:both" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
