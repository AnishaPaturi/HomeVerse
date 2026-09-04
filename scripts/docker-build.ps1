# ==============================================================================
# HomeVerse Docker Build & Tag Script for Windows PowerShell (Phase 32)
# ==============================================================================
param (
    [string]$Registry = $env:AWS_ECR_REGISTRY,
    [switch]$Push = $false
)

$ErrorActionPreference = "Stop"

# Derive short commit SHA
try {
    $CommitSha = (git rev-parse --short HEAD).Trim()
} catch {
    $CommitSha = "dev-$((Get-Date).Ticks)"
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " HomeVerse Docker CI Build (Phase 32)" -ForegroundColor Cyan
Write-Host " Commit SHA: $CommitSha" -ForegroundColor Cyan
Write-Host "======================================================"

$BackendLocalTag = "homeverse-backend:$CommitSha"
$BackendLatestTag = "homeverse-backend:latest"
$FrontendLocalTag = "homeverse-frontend:$CommitSha"
$FrontendLatestTag = "homeverse-frontend:latest"

# 1. Build Backend Image
Write-Host "`n--> Building Backend Docker Image ($BackendLocalTag)..." -ForegroundColor Yellow
docker build `
    -t $BackendLocalTag `
    -t $BackendLatestTag `
    -f infrastructure/docker/backend.Dockerfile .

# 2. Build Frontend Image
Write-Host "`n--> Building Frontend Docker Image ($FrontendLocalTag)..." -ForegroundColor Yellow
docker build `
    -t $FrontendLocalTag `
    -t $FrontendLatestTag `
    -f infrastructure/docker/frontend.Dockerfile .

# 3. Optional ECR Tag & Push
if ($Registry) {
    Write-Host "`n--> Tagging for AWS ECR Registry: $Registry..." -ForegroundColor Yellow
    docker tag $BackendLocalTag "$Registry/homeverse-backend:$CommitSha"
    docker tag $BackendLocalTag "$Registry/homeverse-backend:latest"
    docker tag $FrontendLocalTag "$Registry/homeverse-frontend:$CommitSha"
    docker tag $FrontendLocalTag "$Registry/homeverse-frontend:latest"

    if ($Push) {
        Write-Host "--> Pushing images to AWS ECR..." -ForegroundColor Green
        docker push "$Registry/homeverse-backend:$CommitSha"
        docker push "$Registry/homeverse-backend:latest"
        docker push "$Registry/homeverse-frontend:$CommitSha"
        docker push "$Registry/homeverse-frontend:latest"
        Write-Host "--> ECR Push completed successfully." -ForegroundColor Green
    } else {
        Write-Host "--> Pass -Push switch to publish images to AWS ECR." -ForegroundColor DarkGray
    }
}

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " Docker images built successfully!" -ForegroundColor Green
Write-Host " - $BackendLocalTag" -ForegroundColor Green
Write-Host " - $FrontendLocalTag" -ForegroundColor Green
Write-Host "======================================================"
