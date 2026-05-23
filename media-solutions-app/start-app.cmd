@echo off
cd /d "%~dp0"
echo Starting Media Solutions CRM...
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:5173/
echo.
node server.js
echo.
echo If port 5173 is busy, run:
echo node server.js 5174
pause
