"""
Comprehensive verification test suite for Alumni Portal authentication and registration.
Tests:
- Predefined test accounts (Student, Alumni, Faculty, Admin)
- Database authentication against hashed passwords
- Invalid credential rejection (wrong pw, wrong uucms, wrong name, nonexistent)
- Role separation
- No automatic user creation on invalid attempts
- Duplicate prevention
- Alumni pending approval message
"""
import sqlite3
import json
import os
import sys

# Ensure backend can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.app import app
from backend import firebase_db

def run_tests():
    client = app.test_client()
    passed = 0
    failed = 0

    def assert_eq(actual, expected, msg):
        nonlocal passed, failed
        if actual == expected:
            print(f"  [PASS] {msg}")
            passed += 1
        else:
            print(f"  [FAIL] {msg} -> Expected: {expected}, Got: {actual}")
            failed += 1

    print("\n=== 1. TESTING STUDENT TEST USER LOGIN ===")
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "teststudent",
        "uucms_id": "TESTUUCMS001",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 200, "Student valid login returns 200 OK")
    data = res.get_json()
    assert_eq(data.get("user", {}).get("role"), "student", "Student user role is student")
    assert_eq(data.get("user", {}).get("username"), "teststudent", "Student username matches")
    assert_eq("password" not in data.get("user", {}), True, "Password hash is not exposed")

    print("\n=== 2. TESTING ALUMNI TEST USER LOGIN ===")
    res = client.post("/api/auth/login", json={
        "role": "alumni",
        "username": "testalumni",
        "uucms_id": "TESTALUMNI001",
        "password": "Alumni@123"
    })
    assert_eq(res.status_code, 200, "Alumni valid login returns 200 OK")
    data = res.get_json()
    assert_eq(data.get("user", {}).get("role"), "alumni", "Alumni user role is alumni")
    assert_eq(data.get("user", {}).get("username"), "testalumni", "Alumni username matches")
    assert_eq("password" not in data.get("user", {}), True, "Password hash is not exposed")

    print("\n=== 3. TESTING FACULTY TEST USER LOGIN ===")
    res = client.post("/api/auth/login", json={
        "role": "faculty",
        "faculty_id": "TESTFAC001",
        "name": "Test Faculty",
        "password": "Faculty@123"
    })
    assert_eq(res.status_code, 200, "Faculty valid login returns 200 OK")
    data = res.get_json()
    assert_eq(data.get("user", {}).get("role"), "faculty", "Faculty user role is faculty")
    assert_eq(data.get("user", {}).get("faculty_id"), "TESTFAC001", "Faculty ID matches")
    assert_eq("password" not in data.get("user", {}), True, "Password hash is not exposed")

    print("\n=== 4. TESTING ADMIN TEST USER LOGIN ===")
    # Login via username
    res = client.post("/api/auth/login", json={
        "role": "admin",
        "username": "testadmin",
        "password": "Admin@123"
    })
    assert_eq(res.status_code, 200, "Admin login via username returns 200 OK")
    data = res.get_json()
    assert_eq(data.get("user", {}).get("role"), "admin", "Admin role is admin")

    # Login via email
    res = client.post("/api/auth/login", json={
        "role": "admin",
        "email": "testadmin@example.com",
        "password": "Admin@123"
    })
    assert_eq(res.status_code, 200, "Admin login via email returns 200 OK")

    print("\n=== 5. TESTING INVALID LOGINS & ERROR MESSAGES ===")
    # Student wrong password
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "teststudent",
        "uucms_id": "TESTUUCMS001",
        "password": "WrongPassword!"
    })
    assert_eq(res.status_code, 401, "Student wrong password returns 401")
    assert_eq(res.get_json().get("error"), "Invalid username, UUCMS ID, or password.", "Student error message conforms to requirement")

    # Student wrong uucms_id
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "teststudent",
        "uucms_id": "WRONG_UUCMS",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 401, "Student wrong UUCMS ID returns 401")
    assert_eq(res.get_json().get("error"), "Invalid username, UUCMS ID, or password.", "Student wrong UUCMS error message matches")

    # Student wrong username
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "nonexistent_student",
        "uucms_id": "TESTUUCMS001",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 401, "Student nonexistent user returns 401")
    assert_eq(res.get_json().get("error"), "Invalid username, UUCMS ID, or password.", "Nonexistent user does not leak existence")

    # Alumni wrong password
    res = client.post("/api/auth/login", json={
        "role": "alumni",
        "username": "testalumni",
        "uucms_id": "TESTALUMNI001",
        "password": "WrongPassword!"
    })
    assert_eq(res.status_code, 401, "Alumni wrong password returns 401")
    assert_eq(res.get_json().get("error"), "Invalid username, UUCMS ID, or password.", "Alumni error message conforms")

    # Faculty wrong password
    res = client.post("/api/auth/login", json={
        "role": "faculty",
        "faculty_id": "TESTFAC001",
        "name": "Test Faculty",
        "password": "WrongPassword!"
    })
    assert_eq(res.status_code, 401, "Faculty wrong password returns 401")
    assert_eq(res.get_json().get("error"), "Invalid Faculty ID, name, or password.", "Faculty error conforms to requirement")

    # Faculty wrong name
    res = client.post("/api/auth/login", json={
        "role": "faculty",
        "faculty_id": "TESTFAC001",
        "name": "Wrong Name",
        "password": "Faculty@123"
    })
    assert_eq(res.status_code, 401, "Faculty wrong name returns 401")
    assert_eq(res.get_json().get("error"), "Invalid Faculty ID, name, or password.", "Faculty wrong name error conforms")

    # Faculty wrong ID
    res = client.post("/api/auth/login", json={
        "role": "faculty",
        "faculty_id": "NONEXISTENT",
        "name": "Test Faculty",
        "password": "Faculty@123"
    })
    assert_eq(res.status_code, 401, "Faculty nonexistent ID returns 401")

    # Admin wrong password
    res = client.post("/api/auth/login", json={
        "role": "admin",
        "username": "testadmin",
        "password": "WrongPassword!"
    })
    assert_eq(res.status_code, 401, "Admin wrong password returns 401")

    print("\n=== 6. TESTING ROLE SEPARATION ===")
    # Student trying to log in as Faculty
    res = client.post("/api/auth/login", json={
        "role": "faculty",
        "faculty_id": "TESTUUCMS001",
        "name": "Test Student",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 401, "Student cannot log in through Faculty login")

    # Faculty trying to log in as Student
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "Test Faculty",
        "uucms_id": "TESTFAC001",
        "password": "Faculty@123"
    })
    assert_eq(res.status_code, 401, "Faculty cannot log in through Student login")

    # Alumni trying to log in as Student
    res = client.post("/api/auth/login", json={
        "role": "student",
        "username": "testalumni",
        "uucms_id": "TESTALUMNI001",
        "password": "Alumni@123"
    })
    assert_eq(res.status_code, 401, "Alumni cannot log in through Student login")

    # Student trying to log in as Alumni
    res = client.post("/api/auth/login", json={
        "role": "alumni",
        "username": "teststudent",
        "uucms_id": "TESTUUCMS001",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 401, "Student cannot log in through Alumni login")

    # Student trying to log in as Admin
    res = client.post("/api/auth/login", json={
        "role": "admin",
        "username": "teststudent",
        "password": "Student@123"
    })
    assert_eq(res.status_code, 401, "Student cannot log in through Admin login")

    print("\n=== 7. VERIFY NO USERS CREATED ON INVALID LOGINS ===")
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "alumni.db")
    conn = sqlite3.connect(db_path)
    count_before = conn.execute("SELECT count(*) FROM users").fetchone()[0]
    conn.close()

    # Attempt bogus logins
    for i in range(5):
        client.post("/api/auth/login", json={
            "role": "student",
            "username": f"fake_user_{i}",
            "uucms_id": f"FAKE_{i}",
            "password": "BogusPassword@123"
        })

    conn = sqlite3.connect(db_path)
    count_after = conn.execute("SELECT count(*) FROM users").fetchone()[0]
    conn.close()
    assert_eq(count_before, count_after, "No users are automatically created on invalid login attempts")

    print("\n=== 8. TESTING DUPLICATE REGISTRATION PREVENTION ===")
    # Duplicate email
    res = client.post("/api/auth/register", json={
        "role": "student",
        "name": "Another Student",
        "email": "teststudent@example.com",
        "username": "unique_username_123",
        "uucms_id": "UNIQUE_UUCMS_123",
        "password": "Password@123",
        "branch": "Computer Science"
    })
    assert_eq(res.status_code, 409, "Duplicate email registration rejected with 409")

    # Duplicate username
    res = client.post("/api/auth/register", json={
        "role": "student",
        "name": "Another Student",
        "email": "unique_email_123@example.com",
        "username": "teststudent",
        "uucms_id": "UNIQUE_UUCMS_123",
        "password": "Password@123",
        "branch": "Computer Science"
    })
    assert_eq(res.status_code, 409, "Duplicate student username rejected with 409")

    # Duplicate UUCMS ID
    res = client.post("/api/auth/register", json={
        "role": "student",
        "name": "Another Student",
        "email": "unique_email_456@example.com",
        "username": "unique_user_456",
        "uucms_id": "TESTUUCMS001",
        "password": "Password@123",
        "branch": "Computer Science"
    })
    assert_eq(res.status_code, 409, "Duplicate student UUCMS ID rejected with 409")

    # Duplicate Faculty ID
    res = client.post("/api/auth/register", json={
        "role": "faculty",
        "name": "Another Faculty",
        "email": "unique_faculty_789@example.com",
        "faculty_id": "TESTFAC001",
        "password": "Password@123",
        "department": "Computer Science"
    })
    assert_eq(res.status_code, 409, "Duplicate Faculty ID rejected with 409")

    print("\n=== 9. TESTING PENDING ALUMNI APPROVAL MESSAGE ===")
    # Update SQLite if db exists
    try:
        conn = sqlite3.connect(db_path)
        conn.execute("UPDATE users SET status = 'pending' WHERE username = 'testalumni'")
        conn.commit()
        conn.close()
    except Exception:
        pass
    # Update Firestore
    u = firebase_db.get_user_by_username("testalumni", role="alumni")
    if u:
        firebase_db.update_user(u["id"], {"status": "pending"})

    res = client.post("/api/auth/login", json={
        "role": "alumni",
        "username": "testalumni",
        "uucms_id": "TESTALUMNI001",
        "password": "Alumni@123"
    })
    assert_eq(res.status_code, 403, "Pending alumni login rejected with 403")
    assert_eq(res.get_json().get("error"), "Your alumni account is pending approval by the administrator.", "Pending alumni approval message matches")

    # Restore active status
    try:
        conn = sqlite3.connect(db_path)
        conn.execute("UPDATE users SET status = 'active' WHERE username = 'testalumni'")
        conn.commit()
        conn.close()
    except Exception:
        pass
    if u:
        firebase_db.update_user(u["id"], {"status": "active"})

    print(f"\n==========================================")
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print(f"==========================================")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
