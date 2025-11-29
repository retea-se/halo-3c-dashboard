@echo off
echo Fixar Docker-rattigheter pa Mittemellan...
echo.
echo Loggar in som admin...
ssh admin@REDACTED_SERVER_IP "sudo chmod 666 /var/run/docker.sock && echo 'Rattigheter andrade!' && ls -la /var/run/docker.sock"
echo.
echo Testar med REDACTED_USERNAME...
ssh REDACTED_USERNAME@REDACTED_SERVER_IP "docker ps"
echo.
echo Om du ser "CONTAINER ID   IMAGE..." sa fungerar det!
pause
