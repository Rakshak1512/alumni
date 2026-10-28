"""
Database Seeding Script for Alumni Portal
Creates predefined test users for Student, Alumni, Faculty, and Admin.
Safe to run multiple times without duplicating data.
"""
import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "alumni.db")

def ensure_test_certificate():
    """Create a sample test certificate PDF file if it doesn't already exist."""
    certs_dir = os.path.join(BASE_DIR, "static", "uploads", "certs")
    os.makedirs(certs_dir, exist_ok=True)
    cert_path = os.path.join(certs_dir, "test_alumni_certificate.pdf")
    if not os.path.exists(cert_path):
        # A minimal, valid PDF 1.4 file
        minimal_pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n"
            b"xref\n"
            b"0 4\n"
            b"0000000000 65535 f \n"
            b"0000000009 00000 n \n"
            b"0000000052 00000 n \n"
            b"0000000101 00000 n \n"
            b"trailer<</Size 4/Root 1 0 R>>\n"
            b"startxref\n"
            b"178\n"
            b"%%EOF\n"
        )
        with open(cert_path, "wb") as f:
            f.write(minimal_pdf)
        print(f"Created test certificate at: {cert_path}")
    return "uploads/certs/test_alumni_certificate.pdf"

def backfill_existing_legacy_users(cursor):
    """
    Ensure existing users in the database have valid values for newly required fields
    (uucms_id, faculty_id, username, etc.) without altering passwords or personal data.
    """
    legacy_defaults = {
        "admin@college.edu": {"username": "admin"},
        "sana@gmail.com": {"username": "sana", "uucms_id": "U03AC21S0002", "branch": "Computer Science"},
        "alumni1@test.com": {"username": "alumni1", "uucms_id": "U03AC21A0003", "last_year_uucms_id": "U03AC21A0003", "cgpa": 8.0, "branch": "Computer Science"},
        "newstudent@test.com": {"username": "newstudent", "uucms_id": "U03AC21S0004", "branch": "Computer Science"},
        "faculty1@test.com": {"faculty_id": "FAC1005", "department": "Computer Science"},
        "vinod.pq@gmail.com": {"faculty_id": "FAC1006", "department": "Computer Science"},
        "lavanya@gmail.com": {"username": "lavanya", "uucms_id": "U03AC21S0007", "branch": "Computer Science"},
    }

    for email, fields in legacy_defaults.items():
        row = cursor.execute("SELECT id, username, uucms_id, last_year_uucms_id, faculty_id, department, cgpa, branch FROM users WHERE LOWER(email) = LOWER(?)", (email,)).fetchone()
        if row:
            updates = []
            params = []
            for col, val in fields.items():
                if row[col] is None or row[col] == "":
                    updates.append(f"{col} = ?")
                    params.append(val)
            if updates:
                params.append(row["id"])
                cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
                print(f"[OK] Backfilled legacy fields for: {email}")

def seed_database():
    cert_rel_path = ensure_test_certificate()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Safely backfill legacy users if missing new fields
    backfill_existing_legacy_users(cursor)

    test_users = [
        {
            "name": "Test Student",
            "email": "teststudent@example.com",
            "username": "teststudent",
            "password": "Student@123",
            "role": "student",
            "branch": "Computer Science",
            "uucms_id": "TESTUUCMS001",
            "last_year_uucms_id": None,
            "cgpa": None,
            "certificate_file": None,
            "faculty_id": None,
            "department": "Computer Science",
            "status": "active"
        },
        {
            "name": "Test Alumni",
            "email": "testalumni@example.com",
            "username": "testalumni",
            "password": "Alumni@123",
            "role": "alumni",
            "branch": "Computer Science",
            "uucms_id": "TESTALUMNI001",
            "last_year_uucms_id": "TESTALUMNI001",
            "cgpa": 8.5,
            "certificate_file": cert_rel_path,
            "faculty_id": None,
            "department": "Computer Science",
            "status": "active"  # Verified & Approved
        },
        {
            "name": "Test Faculty",
            "email": "testfaculty@example.com",
            "username": None,
            "password": "Faculty@123",
            "role": "faculty",
            "branch": "Computer Science",
            "uucms_id": None,
            "last_year_uucms_id": None,
            "cgpa": None,
            "certificate_file": None,
            "faculty_id": "TESTFAC001",
            "department": "Computer Science",
            "status": "active"
        },
        {
            "name": "Test Admin",
            "email": "testadmin@example.com",
            "username": "testadmin",
            "password": "Admin@123",
            "role": "admin",
            "branch": None,
            "uucms_id": None,
            "last_year_uucms_id": None,
            "cgpa": None,
            "certificate_file": None,
            "faculty_id": None,
            "department": None,
            "status": "active"
        }
    ]

    print("--- Seeding Predefined Test Users ---")
    seeded_count = 0
    updated_count = 0

    for u in test_users:
        # Check if user already exists by email, username, uucms_id, or faculty_id
        existing = cursor.execute("""
            SELECT id, email, username, uucms_id, faculty_id FROM users
            WHERE LOWER(email) = LOWER(?)
               OR (? IS NOT NULL AND LOWER(username) = LOWER(?))
               OR (? IS NOT NULL AND LOWER(uucms_id) = LOWER(?))
               OR (? IS NOT NULL AND LOWER(faculty_id) = LOWER(?))
        """, (
            u["email"],
            u["username"], u["username"],
            u["uucms_id"], u["uucms_id"],
            u["faculty_id"], u["faculty_id"]
        )).fetchone()

        pw_hash = generate_password_hash(u["password"])

        if existing:
            # Update credentials and fields to ensure test credentials match requirement
            cursor.execute("""
                UPDATE users SET
                    name = ?,
                    email = ?,
                    password = ?,
                    role = ?,
                    branch = ?,
                    status = ?,
                    username = ?,
                    uucms_id = ?,
                    last_year_uucms_id = ?,
                    cgpa = ?,
                    certificate_file = COALESCE(?, certificate_file),
                    faculty_id = ?,
                    department = ?
                WHERE id = ?
            """, (
                u["name"],
                u["email"],
                pw_hash,
                u["role"],
                u["branch"],
                u["status"],
                u["username"],
                u["uucms_id"],
                u["last_year_uucms_id"],
                u["cgpa"],
                u["certificate_file"],
                u["faculty_id"],
                u["department"],
                existing["id"]
            ))
            updated_count += 1
            print(f"[OK] Updated existing test user: {u['name']} (ID #{existing['id']}, Role: {u['role']})")
        else:
            cursor.execute("""
                INSERT INTO users (
                    name, email, password, role, branch, status,
                    username, uucms_id, last_year_uucms_id, cgpa,
                    certificate_file, faculty_id, department
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                u["name"],
                u["email"],
                pw_hash,
                u["role"],
                u["branch"],
                u["status"],
                u["username"],
                u["uucms_id"],
                u["last_year_uucms_id"],
                u["cgpa"],
                u["certificate_file"],
                u["faculty_id"],
                u["department"]
            ))
            new_id = cursor.lastrowid
            seeded_count += 1
            print(f"[OK] Created new test user: {u['name']} (ID #{new_id}, Role: {u['role']})")

    conn.commit()
    conn.close()
    print(f"--- Seeding Finished: {seeded_count} created, {updated_count} refreshed ---")

if __name__ == "__main__":
    seed_database()
