# 🎓 Smart Alumni & Student Career Networking Portal

A premium, modern 3D web platform connecting verified alumni with students for 1-on-1 mentorship, career referrals, job postings, resource sharing, campus bulletins, real-time messaging, and live video sessions.

---

## 🌟 Key Features & 3D Visual Experience

- **3D Alumni Network Orbital Grid**: A geometric 3D visualization representing network nodes (`Student`, `Alumni`, `Mentor`, `Career`, `Community`) around a central pulsing core with interactive cursor parallax.
- **Light / Dark Mode Switcher**: Instant theme toggle located at the top-right header, with system theme detection and persistent `localStorage` saving.
- **Admin User Management (`/admin/users`)**: Secure dashboard for viewing, searching, and filtering all registered accounts with role and status tags (passwords securely hidden).
- **Admin Database Viewer (`/admin/database`)**: Read-only Firestore collection inspector for exploring supported collections, row counts, and data pagination.
- **Role-Based Portals**: Tailored dashboards for Students, Verified Alumni, Faculty, and Administrators with 3D KPI metrics.
- **Career & Job Board**: Job listings with company badges, referral tags, and direct application links.
- **Alumni Directory & Geo-Map**: Search graduates by branch, company, grad year, or geographical distribution.
- **Resource Vault**: Shared study roadmaps, interview preparation notes, and YouTube video tutorials.
- **Encrypted Messaging & Live Video**: 1-on-1 instant chat bubbles and integrated peer-to-peer video rooms.

---

## 🏗️ Project Architecture

```
alumni_portal/
├── backend/                      # Python Flask API & Firebase Firestore integration
│   ├── app.py                    # Flask application, REST endpoints & Jinja views
│   ├── firebase_db.py            # Firestore access layer
│   ├── init_db.py                # Legacy SQLite migration/setup utility (not runtime storage)
│   ├── requirements.txt          # Backend dependencies (Flask, Flask-CORS, Firebase Admin, Gunicorn)
│   ├── static/                   # Static CSS, user uploads, and video assets
│   │   └── css/style.css         # 3D design system & CSS variables (Light/Dark)
│   └── templates/                # Server-rendered HTML templates (all 22 views)
│
├── frontend/                     # Modern Vite Single Page Application (SPA)
│   ├── index.html                # SPA HTML shell
│   ├── package.json              # NPM scripts & dependencies
│   ├── vite.config.js            # Vite build & proxy config
│   ├── .env                      # API configuration
│   └── src/
│       ├── main.js               # Router, theme manager, and shell component
│       ├── api.js                # Central REST client
│       ├── state.js              # Auth & session store
│       ├── style.css             # Unified 3D design system & tokens
│       └── pages/                # Modular page components (all 17 SPA views)
│
├── app.py                        # Root delegate entrypoint
├── README.md                     # Documentation
└── .gitignore                    # Git ignore file
```

---

## 🚀 Quick Start & Run Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Option 1: Running the Flask Application (Full-Stack Mode)

1. Open your terminal in `alumni_portal/`:
```powershell
python app.py
```
2. Open your browser and navigate to:
```
http://localhost:5000
```

---

### Option 2: Running with Vite Frontend (Dev Server)

1. **Start the Flask Backend** (Terminal 1):
```powershell
python app.py
```

2. **Start the Vite Frontend** (Terminal 2):
```powershell
cd frontend
npm install
npm run dev
```

3. Open your browser at:
```
http://localhost:5173
```

---

### 🔑 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` |
| **Alumni** | `john.doe@google.com` | `password123` |
| **Student** | `student@college.edu` | `student123` |
| **Faculty** | `prof.smith@college.edu` | `faculty123` |

---

### Demo/test accounts (Firestore)

The login page's test-user cards only fill credentials into the form; they do not create accounts automatically. To create missing demo users, run the explicit seeder **only against a dedicated test Firebase project**:

1. Configure `backend/.env` with the test project's `FIREBASE_PROJECT_ID` and service-account file path.
2. Add `SEED_DEMO_USERS=true` to `backend/.env`.
3. From the repository root run:
   ```bash
   python backend/seed_demo_users.py
   ```
4. Confirm the output says the expected records were verified, then remove `SEED_DEMO_USERS` from the environment. The script never overwrites existing accounts.
5. For hosted deployments without a shell, use the protected one-time bootstrap endpoint described below. Do not put test passwords or service-account secrets in frontend environment variables.

Demo credentials:
- Student: username `teststudent`, UUCMS `TESTUUCMS001`, password `Student@123`
- Alumni: username `testalumni`, UUCMS `TESTALUMNI001`, password `Alumni@123`
- Faculty: faculty ID `TESTFAC001`, name `Test Faculty`, password `Faculty@123`
- Admin: username `testadmin`, password `Admin@123`

These credentials are public and intended only for a disposable test project. Do not seed them into a production database with real users.

## 🧪 Create a fresh demo/test database and provision test users

To isolate test credentials from real accounts, create a **separate Firebase project** for the demo deployment and enable **Cloud Firestore in Native mode** in that project. This repository cannot create a Firebase project inside your Google account.

1. In Firebase Console, create a new project dedicated to testing, then create its Firestore database.
2. In Google Cloud Console for that project, create a service account with access to Firestore and generate a JSON key. Keep the key private; never commit it to Git.
3. In the Vercel **backend** project, set these private environment variables for Production:
   - `FIREBASE_PROJECT_ID`: the new test Firebase project ID.
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete service-account JSON content, stored as a secret environment variable.
   - `FLASK_SECRET_KEY` and `JWT_SECRET`: separate strong random values.
   - `FRONTEND_ORIGIN=https://alumni-vysa.vercel.app`.
   - `ENABLE_DEMO_USER_BOOTSTRAP=true`.
   - `DEMO_BOOTSTRAP_TOKEN`: a long random one-time token. Generate one locally with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
4. Redeploy the backend. Check `/api/health`; it must report `"status": "ok"` and `"database": "connected"`.
5. From PowerShell, invoke the endpoint once, replacing the token with the value configured in Vercel:
   ```powershell
   $token = Read-Host "Enter the DEMO_BOOTSTRAP_TOKEN"
   Invoke-RestMethod -Method Post -Uri "https://alumni-ry3u.vercel.app/api/admin/bootstrap-demo-users" -Headers @{ Authorization = "Bearer $token" }
   ```
   The response must list all four verified test usernames. If it fails, check the backend runtime logs and Firestore project/service-account configuration.
6. Immediately set `ENABLE_DEMO_USER_BOOTSTRAP=false`, remove `DEMO_BOOTSTRAP_TOKEN`, and redeploy the backend. The seeded accounts remain in the test database.
7. If local testing should use the same test data, update only your local, ignored `backend/.env` with the same test-project ID and service-account credentials. Do not commit `.env` or key files.

Demo credentials are intentionally public and must be used **only** in the dedicated test database, never in a database containing real users. Pointing the backend to a new Firestore project intentionally gives the app a clean data store; records from the old project are not automatically copied.

## 🚀 Production deployment (Flask + Firestore)

The repository includes a root `requirements.txt` and `Procfile`. On Render, create a **Web Service** for this repository and use:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
- **Health check path:** `/api/health`

Set these backend environment values in the hosting dashboard (do not commit private values):

- `JWT_SECRET`: generate a strong value with `python -c "import secrets; print(secrets.token_hex(32))"`.
- `FLASK_SECRET_KEY`: generate a strong value with `python -c "import secrets; print(secrets.token_hex(32))"`
- `FIREBASE_PROJECT_ID`: `alumni-5edf6` if that is the project containing your Firestore data.
- `FIREBASE_CREDENTIALS_PATH`: the actual mounted service-account secret-file path, such as `/etc/secrets/firebase-service-account.json`; or configure `FIREBASE_SERVICE_ACCOUNT_JSON` as a protected secret.
- `FRONTEND_ORIGIN`: the exact deployed frontend origin (scheme + hostname only, no path). Comma-separate multiple exact origins if needed.

For the frontend Vercel project (`alumni-vysa.vercel.app`), set Root Directory to `frontend`, Framework Preset to Vite, Build Command to `npm run build`, and Output Directory to `dist`. Set `VITE_API_BASE_URL=https://alumni-ry3u.vercel.app` in the frontend project's production environment and redeploy. The frontend API client also uses this backend URL as a fallback. Vite embeds this value at build time.

After deployment, open `https://YOUR-BACKEND-URL/api/health`. A healthy response reports `"status": "ok"` and `"database": "connected"`. A 503 response means the backend cannot connect to Firestore: verify the project ID, service-account file path/JSON, and Firestore access. Check server logs for the underlying error.

The frontend and backend are separate origins, so production sessions use Secure, HttpOnly cookies and credentialed CORS. Add the exact frontend origin to `FRONTEND_ORIGIN`. Keep the service-account JSON and `.env` files out of GitHub.

## 🧪 Verification & Security Checks

- **Zero Credential Leakage**: Passwords and password hashes are strictly filtered out from all API responses and templates.
- **Database Safety**: `alumni.db` path is resolved absolutely via `os.path.abspath`, ensuring consistency across development and production.
- **Responsive 3D Experience**: Tested across desktop viewports, tablets, and mobile screens.
