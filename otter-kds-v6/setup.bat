@echo off
REM Otter Menu Sync Setup Script for Windows

echo Setting up Otter Menu Sync...

REM Check Python version
python --version 2>nul
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo Python detected

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check for .env file
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please edit .env and add your Otter credentials
) else (
    echo .env file exists
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your Otter credentials
echo 2. Activate the virtual environment: venv\Scripts\activate
echo 3. Run the menu sync: python -m src.menu_sync sync
echo.
echo For more information, see README.md
pause