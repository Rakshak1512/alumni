"""Local smoke tests that do not require Firebase credentials or production data."""
import unittest

from app import app


class DeploymentSmokeTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="test-only-secret")
        self.client = app.test_client()

    def test_root_entrypoint_imports_and_returns_api_status(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json().get("service"), "Alumni Portal API")
        self.assertEqual(response.get_json().get("status"), "running")

    def test_legacy_login_route_redirects_to_frontend_spa(self):
        response = self.client.get("/login")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers.get("Location"), "http://localhost:5173/#/login")

    def test_auth_me_reports_anonymous_without_database_access(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"authenticated": False, "user": None})

    def test_login_rejects_missing_password_without_database_access(self):
        response = self.client.post("/api/auth/login", json={
            "role": "student",
            "username": "sample",
            "uucms_id": "SAMPLE-ID",
            "password": ""
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("Password is required", response.get_json().get("error", ""))

    def test_send_otp_rejects_invalid_email_without_database_access(self):
        response = self.client.post("/api/auth/send-otp", json={"email": "not-an-email"})
        self.assertEqual(response.status_code, 400)

    def test_verify_otp_rejects_invalid_code_format_without_database_access(self):
        response = self.client.post("/api/auth/verify-otp", json={"email": "test@example.com", "code": "abc"})
        self.assertEqual(response.status_code, 400)

    def test_jwt_token_is_three_part_token(self):
        from backend.app import _issue_auth_token
        token = _issue_auth_token({"id": 123, "role": "student"})
        self.assertEqual(len(token.split(".")), 3)

    def test_login_route_exists_and_requires_password(self):
        response = self.client.post("/api/auth/login", json={
            "role": "student",
            "username": "teststudent",
            "uucms_id": "TESTUUCMS001",
            "password": ""
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("Password is required", response.get_json().get("error", ""))

    def test_login_does_not_return_demo_token_for_invalid_request(self):
        response = self.client.post("/api/auth/login", json={
            "role": "unknown",
            "password": "not-a-valid-login"
        })
        self.assertIn(response.status_code, (400, 401))
        self.assertNotIn("auth_token", response.get_json())

    def test_local_frontend_origin_is_allowed_for_credentialed_cors(self):
        response = self.client.options(
            "/api/auth/me",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        self.assertIn(response.status_code, (200, 204))
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5173"
        )
        self.assertEqual(response.headers.get("Access-Control-Allow-Credentials"), "true")

    def test_current_vercel_frontend_origin_is_allowed_for_credentialed_cors(self):
        response = self.client.options(
            "/api/auth/me",
            headers={
                "Origin": "https://alumni-three-theta.vercel.app",
                "Access-Control-Request-Method": "GET"
            }
        )
        self.assertIn(response.status_code, (200, 204))
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "https://alumni-three-theta.vercel.app"
        )
        self.assertEqual(response.headers.get("Access-Control-Allow-Credentials"), "true")


if __name__ == "__main__":
    unittest.main()
