@echo off
REM Quick SSH connection script for Mittemellan DSV
REM Last updated: 2025-11-10

echo ========================================
echo   Connecting to Mittemellan DSV
echo   Server: REDACTED_SERVER_IP
echo   User: REDACTED_USERNAME
echo ========================================
echo.

ssh REDACTED_USERNAME@REDACTED_SERVER_IP

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   Connection failed!
    echo   Check network and credentials
    echo ========================================
    pause
)
