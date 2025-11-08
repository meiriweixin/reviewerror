@echo off
REM Student Review App - Quick Setup Script for Windows
REM This script helps you set up the development environment quickly

echo ==================================
echo Student Review App - Setup Script
echo ==================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check if Python is installed
echo Checking Python installation...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python 3 is not installed. Please install Python 3.9+ first.
    exit /b 1
)
echo [OK] Python found
python --version

echo.
echo ==================================
echo Setting up Frontend
echo ==================================

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)

REM Create frontend .env file
if not exist .env.local (
    echo Creating .env.local file...
    copy .env.example .env.local
    echo [OK] .env.local created
    echo [WARNING] Please edit .env.local with your actual values
) else (
    echo [OK] .env.local already exists
)

echo.
echo ==================================
echo Setting up Backend
echo ==================================

cd backend

REM Create Python virtual environment
echo Creating Python virtual environment...
python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create virtual environment
    exit /b 1
)
echo [OK] Virtual environment created

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)

REM Create backend .env file
if not exist .env (
    echo Creating backend .env file...
    copy .env.example .env
    echo [OK] backend\.env created
    echo [WARNING] Please edit backend\.env with your actual values
) else (
    echo [OK] backend\.env already exists
)

REM Create uploads directory
if not exist uploads mkdir uploads
echo [OK] Uploads directory created

cd ..

echo.
echo ==================================
echo Setup Complete! 🎉
echo ==================================
echo.
echo Next steps:
echo.
echo 1. Configure your environment variables:
echo    - Edit .env.local (frontend)
echo    - Edit backend\.env (backend)
echo.
echo 2. Set up Supabase:
echo    - Follow instructions in SUPABASE_SETUP.md
echo.
echo 3. Configure Google OAuth:
echo    - Create OAuth credentials in Google Cloud Console
echo    - Add client ID to .env.local and backend\.env
echo.
echo 4. Set up Azure OpenAI:
echo    - Add endpoint and API key to backend\.env
echo.
echo 5. Start the development servers:
echo.
echo    Terminal 1 (Frontend):
echo    $ npm start
echo.
echo    Terminal 2 (Backend):
echo    $ cd backend
echo    $ venv\Scripts\activate
echo    $ python main.py
echo.
echo For detailed instructions, see README.md
echo.

pause
