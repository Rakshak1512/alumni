import os
import sqlite3

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alumni.db")
conn = sqlite3.connect(db_path)

conn.execute("""
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
)
""")
conn.commit()
conn.close()
print(f"messages table verified/created successfully in {db_path}!")