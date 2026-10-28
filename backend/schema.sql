-- Everyone (student, alumni, faculty, admin) lives in one table.
-- role tells us who they are, status tells us if alumni are approved yet.
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,              -- stored as a hash, never plain text
    role TEXT NOT NULL,                  -- 'student', 'alumni', 'faculty', 'admin'
    username TEXT,                       -- unique username for student & alumni
    uucms_id TEXT,                       -- unique UUCMS ID for student & alumni
    last_year_uucms_id TEXT,             -- alumni last year UUCMS ID
    cgpa REAL,                           -- alumni CGPA (0 to 10)
    certificate_file TEXT,               -- alumni certificate upload path
    faculty_id TEXT,                     -- unique faculty ID
    department TEXT,                     -- faculty department
    branch TEXT,                         -- e.g. 'CSE', 'ECE' (students & alumni)
    grad_year INTEGER,                   -- alumni only
    company TEXT,                        -- alumni only
    location TEXT,                       -- alumni only
    status TEXT NOT NULL DEFAULT 'active', -- 'pending' or 'active' (used for alumni)
    profile_pic TEXT                     -- path to uploaded avatar
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL AND username != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uucms_id ON users(uucms_id) WHERE uucms_id IS NOT NULL AND uucms_id != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_faculty_id ON users(faculty_id) WHERE faculty_id IS NOT NULL AND faculty_id != '';


-- Jobs / internships posted by alumni
CREATE TABLE postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumni_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,                  -- 'job' or 'internship'
    location TEXT,
    education TEXT,
    experience TEXT,
    skills TEXT,
    apply_link TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES users(id)
);

-- Resources shared by faculty
CREATE TABLE resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    file_path TEXT,
    description TEXT,
    FOREIGN KEY (faculty_id) REFERENCES users(id)
);

-- Announcements (from admin or faculty)
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_by INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Private messages between two users (chat)
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);