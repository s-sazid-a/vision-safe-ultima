@echo off
cd /d "%~dp0"

echo.
echo ===============================================
echo   VISION SAFE ULTIMA v2.0 - SYSTEM LAUNCHER
echo ===============================================
echo.
echo [1/2] Starting Backend...

start "Vision Safe Ultima - Backend" cmd /k "cd vision_safe_ultima_backend_v2.0 && python main.py"

timeout /t 3 /nobreak

echo [2/2] Starting Frontend...

start "Vision Safe Ultima - Frontend" cmd /k "cd vision_safe_ultima_webapp_v2.0 && npm run dev"

timeout /t 4 /nobreak

echo.
echo ✅ System started!
echo.
echo 🌐 Opening Dashboard at http://localhost:5173/home
echo.

start http://localhost:5173/home

echo Opening browser...
