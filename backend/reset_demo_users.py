"""Explicitly replace only Firestore's top-level users documents with four demo accounts.

Run only after reviewing the target project. This never deletes other collections.
Required backend/.env guards:
  RESET_FIRESTORE_USERS=true
  RESET_FIRESTORE_PROJECT_ID=<same value as FIREBASE_PROJECT_ID>
  RESET_CONFIRMATION=DELETE_USERS_COLLECTION
  SEED_DEMO_USERS=true
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

if os.getenv("RESET_FIRESTORE_USERS", "").lower() != "true":
    raise SystemExit("Refusing: set RESET_FIRESTORE_USERS=true only when ready.")
if os.getenv("RESET_CONFIRMATION") != "DELETE_USERS_COLLECTION":
    raise SystemExit("Refusing: set RESET_CONFIRMATION=DELETE_USERS_COLLECTION to confirm.")
project = os.getenv("FIREBASE_PROJECT_ID", "").strip()
expected = os.getenv("RESET_FIRESTORE_PROJECT_ID", "").strip()
if not project or project != expected:
    raise SystemExit("Refusing: RESET_FIRESTORE_PROJECT_ID must exactly match FIREBASE_PROJECT_ID.")
if os.getenv("SEED_DEMO_USERS", "").lower() not in {"1", "true", "yes"}:
    raise SystemExit("Refusing: set SEED_DEMO_USERS=true to seed the four demo users after deletion.")

if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import firebase_db

db = firebase_db.get_firestore_client()
users = list(db.collection("users").stream())
print(f"Target Firebase project: {project}")
print(f"Top-level users documents to delete: {len(users)}")
for start in range(0, len(users), 400):
    batch = db.batch()
    for doc in users[start:start + 400]:
        batch.delete(doc.reference)
    batch.commit()
print("Deleted only documents in the top-level 'users' collection.")
# Keep the script explicit and idempotent; seed script checks/creates only the demo identities.
import seed_demo_users
seed_demo_users.main()
print("Reset complete. Other Firestore collections were not intentionally modified.")
