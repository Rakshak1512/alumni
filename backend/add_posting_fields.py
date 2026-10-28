import os
import sqlite3

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alumni.db")
conn = sqlite3.connect(db_path)

new_columns = ["location", "education", "experience", "skills", "apply_link"]

for col in new_columns:
    try:
        conn.execute(f"ALTER TABLE postings ADD COLUMN {col} TEXT")
        print(f"Added column: {col}")
    except sqlite3.OperationalError:
        print(f"Column {col} already exists, skipping.")

conn.commit()
conn.close()
print(f"Done updating postings columns in {db_path}!")