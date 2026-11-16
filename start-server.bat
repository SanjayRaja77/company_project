@echo off
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   KCET Employee Management System       ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Starting backend server...
echo  Open browser at: http://localhost:3000
echo.
cd /d "%~dp0backend"
start "" "http://localhost:3000"
node server.js
pause
