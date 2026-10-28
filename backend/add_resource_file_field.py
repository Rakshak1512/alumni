import os
import sqlite3

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alumni.db")
conn = sqlite3.connect(db_path)

try:
    conn.execute("ALTER TABLE resources ADD COLUMN file_path TEXT")
    print("Added column: file_path")
except sqlite3.OperationalError:
    print("Column file_path already exists, skipping.")

conn.commit()
conn.close()
print(f"Done verifying file_path column in {db_path}!")