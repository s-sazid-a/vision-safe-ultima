@echo off
REM Vision Safe Ultima v2.0 - Quick Start Script
REM Fixes all remaining issues and starts the application

echo.
echo ====================================================
echo Vision Safe Ultima v2.0 - Setup & Start
echo ====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✓ Python and Node.js found
echo.

REM Setup Backend
echo Setting up backend...
cd vision_safe_ultima_backend_v2.0

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing backend dependencies...
pip install -r requirements.txt >nul

echo Backend setup complete!
cd ..
echo.

REM Setup Frontend
echo Setting up frontend...
cd vision_safe_ultima_webapp_v2.0

echo Installing frontend dependencies...
if not exist "node_modules" (
    npm install >nul
)

echo Frontend setup complete!
cd ..
echo.

echo ====================================================
echo Starting Vision Safe Ultima v2.0
echo ====================================================
echo.
echo Opening two terminal windows...
echo.
echo Terminal 1: Backend server (http://localhost:8000)
echo Terminal 2: Frontend app (http://localhost:5173)
echo.

REM Start Backend
echo Launching backend...
start "Vision Safe Backend" cmd /k "cd vision_safe_ultima_backend_v2.0 && .venv\Scripts\activate && python main.py"

timeout /t 3

REM Start Frontend
echo Launching frontend...
start "Vision Safe Frontend" cmd /k "cd vision_safe_ultima_webapp_v2.0 && npm run dev"

echo.
echo ====================================================
echo ✓ Vision Safe Ultima Started!
echo ====================================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo.
echo Press Ctrl+C in each terminal to stop
echo.
pause
