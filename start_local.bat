@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  echo Run setup_windows.bat first.
  pause
  exit /b 1
)
if not exist "backend\.env" (
  echo backend\.env is missing. Run setup_windows.bat first.
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo Frontend dependencies are missing. Run setup_windows.bat first.
  pause
  exit /b 1
)

echo Starting Alumni backend and frontend in separate windows...
start "Alumni Backend - 127.0.0.1:5000" cmd /k "cd /d ""%~dp0backend"" && ..\backend\.venv\Scripts\python.exe app.py"
timeout /t 2 /nobreak >nul
start "Alumni Frontend - Vite" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
echo.
echo Backend: http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo Close the two opened terminal windows to stop the services.
endlocal
