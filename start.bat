@echo off
echo Starting Backend & Frontend Servers...
echo.

echo [1/2] Starting Backend (Flask) on port 5000...
start "Backend" cmd /c "cd /d "%~dp0backend" && python -m flask run --host=0.0.0.0 --port=5000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Vite) on port 5173...
start "Frontend" cmd /c "cd /d "%~dp0." && npm run dev"

echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo Health:   http://localhost:5000/health
echo.
echo ============================================================
echo Demo Credentials:
echo   Patient: patient@example.com / demo
echo   Doctor:  doctor@example.com / demo
echo ============================================================
echo.
echo Close the terminal windows to stop the servers.
