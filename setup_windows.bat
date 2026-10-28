@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo Alumni Portal - Windows Setup
echo ==========================================

if not exist "backend\app.py" (
  echo ERROR: backend\app.py was not found.
  echo Run this file from the root of the cloned alumni repository.
  pause
  exit /b 1
)
if not exist "frontend\package.json" (
  echo ERROR: frontend\package.json was not found.
  pause
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python is not installed or not on PATH. Install Python 3.11+ and retry.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js/npm is not installed or not on PATH. Install the LTS version and retry.
  pause
  exit /b 1
)

if not exist "backend\.env" (
  if exist "backend\.env.example" (
    copy "backend\.env.example" "backend\.env" >nul
    echo Created backend\.env from example. Review and fill in your own secrets.
  ) else (
    echo WARNING: backend\.env.example is missing.
  )
) else (
  echo Keeping existing backend\.env.
)
if not exist "frontend\.env" (
  if exist "frontend\.env.example" (
    copy "frontend\.env.example" "frontend\.env" >nul
    echo Created frontend\.env from example.
  ) else (
    echo WARNING: frontend\.env.example is missing.
  )
) else (
  echo Keeping existing frontend\.env.
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  pushd backend
  python -m venv .venv
  if errorlevel 1 (popd & echo ERROR: Could not create Python environment. & pause & exit /b 1)
  popd
)
echo Installing backend requirements...
if exist "backend\requirements.txt" (
  "backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
  "backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
  if errorlevel 1 (echo ERROR: Backend dependencies failed to install. & pause & exit /b 1)
) else (
  echo ERROR: backend\requirements.txt was not found.
  pause
  exit /b 1
)

echo Installing frontend dependencies...
pushd frontend
call npm install
if errorlevel 1 (popd & echo ERROR: Frontend dependencies failed to install. & pause & exit /b 1)
popd

echo.
echo Setup complete.
echo IMPORTANT: Edit backend\.env and fill in Firebase and SMTP settings before testing email OTP or Firebase features.
echo Do not share or commit either .env file.
echo Run start_local.bat to start both services.
pause
endlocal
