"""
Create the four demo accounts displayed on the Alumni login page.

This is an explicit, manual operation. It never runs automatically at app startup.
Run only against a dedicated demo/test Firebase project, not a production project
containing real users. Existing accounts are never overwritten.
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import firebase_db  # noqa: E402

DEMO_USERS = [
    {
        "username": "teststudent",
        "uucms_id": "TESTUUCMS001",
        "email": "teststudent@demo.invalid",
        "name": "Test Student",
        "role": "student",
        "password": "Student@123",
        "status": "active",
        "branch": "Computer Applications",
        "department": None,
        "faculty_id": None,
        "last_year_uucms_id": None,
        "cgpa": None,
        "certificate_file": None,
        "grad_year": None,
        "company": None,
        "location": None,
        "profile_pic": None,
    },
    {
        "username": "testalumni",
        "uucms_id": "TESTALUMNI001",
        "last_year_uucms_id": "TESTALUMNI001",
        "email": "testalumni@demo.invalid",
        "name": "Test Alumni",
        "role": "alumni",
        "password": "Alumni@123",
        "status": "active",
        "branch": "Computer Applications",
        "department": None,
        "faculty_id": None,
        "cgpa": 8.0,
        "certificate_file": None,
        "grad_year": 2025,
        "company": "Demo Company",
        "location": "Bengaluru",
        "profile_pic": None,
    },
    {
        "username": "testfaculty",
        "uucms_id": None,
        "email": "testfaculty@demo.invalid",
        "name": "Test Faculty",
        "role": "faculty",
        "password": "Faculty@123",
        "status": "active",
        "branch": None,
        "department": "Computer Applications",
        "faculty_id": "TESTFAC001",
        "last_year_uucms_id": None,
        "cgpa": None,
        "certificate_file": None,
        "grad_year": None,
        "company": None,
        "location": None,
        "profile_pic": None,
    },
    {
        "username": "testadmin",
        "uucms_id": None,
        "email": "testadmin@demo.invalid",
        "name": "Test Admin",
        "role": "admin",
        "password": "Admin@123",
        "status": "active",
        "branch": None,
        "department": None,
        "faculty_id": None,
        "last_year_uucms_id": None,
        "cgpa": None,
        "certificate_file": None,
        "grad_year": None,
        "company": None,
        "location": None,
        "profile_pic": None,
    },
]


def bootstrap_demo_users():
    firebase_db.get_firestore_client()  # Fail early if credentials/database access are invalid.
    created, repaired = [], []

    # These exact demo identities are intentionally maintained for repeatable
    # testing. Only these explicitly named demo accounts are updated; no other
    # user records are touched.
    for user in DEMO_USERS:
        existing = (
            firebase_db.get_user_by_username(user["username"], role=user["role"])
            or firebase_db.get_user_by_email(user["email"])
            or (
                firebase_db.get_user_by_faculty_id(user["faculty_id"])
                if user.get("faculty_id") else None
            )
        )

        password = user["password"]
        payload = dict(user)
        payload["password"] = generate_password_hash(password)

        if existing:
            existing_id = existing.get("id")
            if not existing_id:
                print(f"ERROR {user['username']}: matching record has no usable ID; left unchanged.")
                raise SystemExit(1)
            # Repair the exact known demo record so credentials and active status
            # match the login cards. This never touches non-demo accounts.
            firebase_db.update_user(existing_id, payload)
            repaired.append(user["username"])
            print(f"REPAIRED {user['username']} ({user['role']}, id={existing_id})")
        else:
            new_id = firebase_db.create_user(payload)
            created.append(user["username"])
            print(f"CREATED {user['username']} ({user['role']}, id={new_id})")

    print(f"\nCreated: {len(created)}; repaired: {len(repaired)}")
    failures = []
    for user in DEMO_USERS:
        if user["role"] == "faculty":
            found = firebase_db.get_user_by_faculty_id(user["faculty_id"])
        elif user["role"] == "admin":
            found = firebase_db.get_user_by_admin_identifier(user["username"])
        else:
            found = firebase_db.get_user_by_username(user["username"], role=user["role"])

        if not found:
            failures.append(user["username"])
            print(f"VERIFY FAILED: {user['username']} is not discoverable in Firestore.")
            continue
        if found.get("status") != "active":
            failures.append(user["username"])
            print(f"VERIFY FAILED: {user['username']} is not active.")
            continue
        if not check_password_hash(found.get("password", ""), user["password"]):
            failures.append(user["username"])
            print(f"VERIFY FAILED: password check did not pass for {user['username']}.")
            continue
        print(f"PASS: {user['username']} ({user['role']}) record, active status, and password verified.")

    if failures:
        print("Failed demo-account checks: " + ", ".join(failures))
        raise RuntimeError("Failed demo-account checks: " + ", ".join(failures))
    print("\nAll four demo accounts are ready in Firestore.")
    return {
        "created": created,
        "repaired": repaired,
        "verified": [user["username"] for user in DEMO_USERS],
    }


def main():
    if os.getenv("SEED_DEMO_USERS", "").strip().lower() not in {"1", "true", "yes"}:
        print("Refusing to seed demo users.")
        print("Set SEED_DEMO_USERS=true in backend/.env after confirming this is a dedicated test Firebase project.")
        raise SystemExit(2)
    bootstrap_demo_users()


if __name__ == "__main__":
    main()
