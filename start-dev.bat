@echo off
REM Development starter script for Windows
REM Runs both frontend and backend

echo Starting Student Review App in development mode...

REM Start backend in new window
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && python main.py"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend server...
start "Frontend Server" cmd /k "npm start"

echo.
echo ==================================
echo Development servers started!
echo ==================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Close the terminal windows to stop the servers
echo ==================================
echo.

pause
