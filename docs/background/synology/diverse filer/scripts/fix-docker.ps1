# Docker Fix Script for Mittemellan
Write-Host "Fixar Docker-rattigheter pa Mittemellan..." -ForegroundColor Green
Write-Host ""

Write-Host "Steg 1: Loggar in som admin och andrar rattigheter..." -ForegroundColor Yellow
$adminPassword = "^5`$_RfC-OeS>Ikhwk*V."
$vscodPassword = "REDACTED_PASSWORD"

# Fixa rattigheter via admin
Write-Host "Kör: sudo chmod 666 /var/run/docker.sock" -ForegroundColor Cyan
ssh admin@REDACTED_SERVER_IP "sudo chmod 666 /var/run/docker.sock && echo 'Rattigheter OK!' && ls -la /var/run/docker.sock"

Write-Host ""
Write-Host "Steg 2: Testar Docker med REDACTED_USERNAME..." -ForegroundColor Yellow
ssh REDACTED_USERNAME@REDACTED_SERVER_IP "docker --version && docker ps"

Write-Host ""
Write-Host "Om du ser 'CONTAINER ID' ovan sa fungerar Docker!" -ForegroundColor Green
Write-Host ""
Read-Host "Tryck Enter for att avsluta"
