@echo off
echo Starting HHG KDS Development Server...
echo.
echo The server will be available at:
echo   - http://localhost:3000
echo   - http://127.0.0.1:3000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm run dev