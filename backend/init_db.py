"""
Run this file to create or initialize the database: python init_db.py
It reads schema.sql, builds alumni.db, creates default admin,
and seeds predefined test accounts (Student, Alumni, Faculty, Admin).
"""
import sqlite3
import os
from werkzeug.security import generate_password_hash

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, "alumni.db")
schema_path = os.path.join(base_dir, "schema.sql")

conn = sqlite3.connect(db_path)

with open(schema_path, "r", encoding="utf-8") as f:
    conn.executescript(f.read())

# Default admin account: email admin@college.edu / password admin123
existing_admin = conn.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", ("admin@college.edu",)).fetchone()
if not existing_admin:
    conn.execute(
        "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
        ("Admin", "admin@college.edu", generate_password_hash("admin123"), "admin", "active")
    )

conn.commit()
conn.close()
print("Database initialized: alumni.db")

# Seed predefined test users
try:
    import sys
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
    from seed import seed_database
    seed_database()
except Exception as e:
    print(f"Notice: could not run seed_database: {e}")
