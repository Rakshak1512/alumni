# Alumni Portal — Automated Windows Setup

## One-time setup
1. Install Python (prefer Python 3.11 or a version supported by the backend) and Node.js LTS.
2. Open the cloned repository folder in File Explorer.
3. Double-click `setup_windows.bat`.
4. Edit `backend/.env` and enter your own Firebase and SMTP configuration. Do not paste secrets into GitHub or share them.
5. Double-click `start_local.bat`.

## Local addresses
- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:5000

## Notes
- Setup copies `.env.example` files only when a real `.env` file does not already exist. Existing local configuration is preserved.
- The frontend environment should contain only frontend-safe values such as `VITE_APP_NAME` and `VITE_API_BASE_URL`. Never put private keys or SMTP passwords in a variable beginning with `VITE_`.
- The backend `.env` contains private configuration. Keep it out of Git.
- Email OTP requires valid SMTP credentials; Firebase features require valid Firebase credentials and project settings.
- This script installs dependencies and launches the app; it does not automatically deploy the app or modify/delete live Firebase data.
- If the backend starts with a different command or port in your local copy, follow the backend's current entrypoint and environment configuration.
