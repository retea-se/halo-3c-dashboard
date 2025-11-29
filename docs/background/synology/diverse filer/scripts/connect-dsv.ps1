# Quick SSH connection script for Mittemellan DSV
# Last updated: 2025-11-10

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Connecting to Mittemellan DSV" -ForegroundColor White
Write-Host "  Server: REDACTED_SERVER_IP" -ForegroundColor Yellow
Write-Host "  User: REDACTED_USERNAME" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Connect via SSH
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Connection failed!" -ForegroundColor Red
    Write-Host "  Check network and credentials" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Red
    pause
}
