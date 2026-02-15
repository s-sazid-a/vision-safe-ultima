@echo off
echo Setting up Vision Safe Ultima Backend Environment...
echo.

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Setup Complete!
echo To run the server:
echo call .venv\Scripts\activate
echo uvicorn main:app --reload
pause
