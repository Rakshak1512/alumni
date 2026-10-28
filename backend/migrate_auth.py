"""
Database migration script to add authentication and registration fields:
- username
- uucms_id
- last_year_uucms_id
- cgpa
- certificate_file
- faculty_id
- department
"""
import sqlite3
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, "alumni.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
existing_cols = [row[1] for row in cursor.fetchall()]
print("Existing columns:", existing_cols)

new_cols = [
    ("username", "TEXT"),
    ("uucms_id", "TEXT"),
    ("last_year_uucms_id", "TEXT"),
    ("cgpa", "REAL"),
    ("certificate_file", "TEXT"),
    ("faculty_id", "TEXT"),
    ("department", "TEXT"),
]

for col_name, col_type in new_cols:
    if col_name not in existing_cols:
        cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
        print(f"Added column: {col_name} ({col_type})")
    else:
        print(f"Column already exists: {col_name}")

cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
    ON users(username) WHERE username IS NOT NULL AND username != ''
""")
cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uucms_id
    ON users(uucms_id) WHERE uucms_id IS NOT NULL AND uucms_id != ''
""")
cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_faculty_id
    ON users(faculty_id) WHERE faculty_id IS NOT NULL AND faculty_id != ''
""")

conn.commit()
conn.close()
print("Migration completed successfully.")
