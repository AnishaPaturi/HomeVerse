# HomeVerse One-Click Launcher for Windows PowerShell
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             🏠 HOMEVERSE SPATIAL ARCHITECTURE OS         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# 1. Verify and Launch Backend (FastAPI on Port 8080)
$BackendPortCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($BackendPortCheck) {
    Write-Host "✓ Backend server is ALREADY running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "Starting FastAPI Backend server on port 8080..." -ForegroundColor Yellow
    $BackendCmd = "cd '$WorkspaceRoot\backend'; ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BackendCmd" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# 2. Verify and Launch Frontend Web (Next.js on Port 3000)
$FrontendPortCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($FrontendPortCheck) {
    Write-Host "✓ Frontend Web server is ALREADY running on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Starting Next.js Frontend server on port 3000..." -ForegroundColor Yellow
    $FrontendCmd = "cd '$WorkspaceRoot\frontend-web'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "$FrontendCmd" -WindowStyle Normal
    Start-Sleep -Seconds 4
}

Write-Host "`nAll HomeVerse services are active!" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host "  Landing Page:     http://localhost:3000" -ForegroundColor White
Write-Host "  Sign In / Auth:   http://localhost:3000/login" -ForegroundColor White
Write-Host "  9-Step Wizard:    http://localhost:3000/home/new" -ForegroundColor White
Write-Host "  Dashboard:        http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "  Backend API:      http://localhost:8080" -ForegroundColor White
Write-Host "  Interactive Docs: http://localhost:8080/docs" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

# Open default browser
Start-Process "http://localhost:3000"
