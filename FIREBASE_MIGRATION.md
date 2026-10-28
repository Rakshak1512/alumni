# Alumni Portal: environment and Firebase migration setup

## Folder layout

- `backend/` — Flask app, templates, static uploads, backend `.env`, SQLite database, and migration tools.
- `frontend/` — Vite app and its own `.env`.
- `backend/.env.example` and `frontend/.env.example` are safe templates. Local `.env` files are ignored by Git.

## Local environment files

1. Backend: edit `backend/.env`.
   - Set `FLASK_SECRET_KEY` to a random secret.
   - Set `FRONTEND_ORIGIN=http://localhost:5173`.
   - Set `FIREBASE_PROJECT_ID` and `FIREBASE_CREDENTIALS_PATH`.
2. Frontend: edit `frontend/.env`.
   - Local default is `VITE_API_BASE_URL=http://localhost:5000`.
   - For production, set it to the deployed Flask backend's HTTPS URL.
3. Never put Firebase service-account credentials, Flask secrets, or database secrets in `frontend/.env`. Vite variables are public in the browser bundle.
4. Place the Firebase service account JSON at the path configured in `FIREBASE_CREDENTIALS_PATH`, or use a secure absolute path. Never commit this file.

## Firebase setup

1. Open Firebase Console and create/select a project.
2. Enable Firestore Database in the console.
3. In Project settings > Service accounts, generate a private service-account key JSON. Store it securely outside `frontend/` and outside public/static folders.
4. Install dependencies from the backend directory:
   `pip install -r requirements.txt`
5. Set the project ID and credential path in `backend/.env`.

## Non-destructive SQLite -> Firestore copy

The existing Flask backend currently uses many direct SQLite SQL statements. The current app continues to use SQLite at runtime; adding Firebase credentials alone does not switch those queries to Firestore.

To copy the current SQLite data to Firestore while keeping SQLite intact:

1. Stop the app briefly so the source data is stable.
2. Back up `backend/alumni.db` (or your actual SQLite file) to a separate safe location.
3. Set `SQLITE_DB_PATH` in `backend/.env` to the exact existing SQLite database path.
4. Configure Firebase credentials and project ID.
5. From `backend/`, run:
   `python migrate_sqlite_to_firebase.py`
6. Review the printed per-collection counts in Firestore Console. By default, existing Firestore documents with matching IDs are skipped.
7. Only use `--overwrite` if you intentionally want to replace matching Firestore documents.

The migration script opens SQLite in read-only mode. It does not delete, alter, rename, or move the SQLite database. It preserves each row's `id` as the Firestore document ID when the table has an `id` column, and also stores the ID field in the document data.

### Important limitation

Firestore is a document database, while this application relies on SQL joins, `WHERE` queries, ordering, and relational foreign keys. The migration creates a cloud copy; it does not by itself make the running Flask application read/write Firestore. A safe full cutover requires refactoring the application's database access layer and testing every route. Until that is done, SQLite remains the active database and should be retained as the rollback source.
