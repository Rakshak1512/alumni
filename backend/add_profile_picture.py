import os
import sqlite3

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alumni.db")
conn = sqlite3.connect(db_path)

try:
    conn.execute("ALTER TABLE users ADD COLUMN profile_pic TEXT")
    print("Added column: profile_pic")
except sqlite3.OperationalError:
    print("Column profile_pic already exists, skipping.")

conn.commit()
conn.close()
print(f"Done verifying profile_pic column in {db_path}!")