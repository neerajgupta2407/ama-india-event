from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from audit.models import AuditEvent
from core.tests.helpers import make_staff

PASSWORD = "S3cure-pass!word"


class StaffAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        # CSRF checks stay on, as in a real browser.
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = make_staff("ops", "finance")
        self.user.set_password(PASSWORD)
        self.user.save()

    def csrf_token(self):
        return self.client.get(reverse("staff-csrf")).cookies["csrftoken"].value

    def login(self, email, password, token=None):
        return self.client.post(
            reverse("staff-login"),
            {"email": email, "password": password},
            format="json",
            HTTP_X_CSRFTOKEN=token or self.csrf_token(),
        )

    def test_csrf_endpoint_sets_the_cookie(self):
        response = self.client.get(reverse("staff-csrf"))

        self.assertEqual(200, response.status_code)
        self.assertIn("csrftoken", response.cookies)

    def test_login_returns_the_user_and_starts_a_session(self):
        response = self.login(self.user.email, PASSWORD)

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual(self.user.email, body["email"])
        self.assertEqual(["finance", "ops"], body["roles"])
        self.assertNotIn("password", body)
        self.assertEqual(200, self.client.get(reverse("staff-me")).status_code)
        self.assertTrue(
            AuditEvent.objects.filter(action="staff.login", actor=self.user).exists()
        )

    def test_email_is_matched_case_insensitively(self):
        self.assertEqual(200, self.login(self.user.email.upper(), PASSWORD).status_code)

    def test_login_needs_a_csrf_token(self):
        response = self.client.post(
            reverse("staff-login"),
            {"email": self.user.email, "password": PASSWORD},
            format="json",
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual(403, self.client.get(reverse("staff-me")).status_code)

    def test_wrong_password_and_unknown_email_look_identical(self):
        wrong_password = self.login(self.user.email, "nope")
        unknown_email = self.login("nobody@example.com", "nope")

        self.assertEqual(401, wrong_password.status_code)
        self.assertEqual(401, unknown_email.status_code)
        self.assertEqual(wrong_password.json(), unknown_email.json())

    def test_a_non_staff_account_cannot_log_in(self):
        self.user.is_staff = False
        self.user.save()

        self.assertEqual(401, self.login(self.user.email, PASSWORD).status_code)

    def test_an_inactive_account_cannot_log_in(self):
        self.user.is_active = False
        self.user.save()

        self.assertEqual(401, self.login(self.user.email, PASSWORD).status_code)

    def test_staff_without_a_role_is_told_to_ask_an_administrator(self):
        roleless = make_staff()
        roleless.set_password(PASSWORD)
        roleless.save()

        response = self.login(roleless.email, PASSWORD)

        self.assertEqual(403, response.status_code)
        self.assertIn("no dashboard role", response.json()["detail"])
        self.assertEqual(403, self.client.get(reverse("staff-me")).status_code)

    def test_me_requires_a_session(self):
        self.assertIn(self.client.get(reverse("staff-me")).status_code, (401, 403))

    def test_logout_ends_the_session(self):
        self.login(self.user.email, PASSWORD)

        response = self.client.post(
            reverse("staff-logout"), HTTP_X_CSRFTOKEN=self.csrf_token()
        )

        self.assertEqual(204, response.status_code)
        self.assertEqual(403, self.client.get(reverse("staff-me")).status_code)
        self.assertTrue(AuditEvent.objects.filter(action="staff.logout").exists())

    def test_logout_needs_a_csrf_token(self):
        self.login(self.user.email, PASSWORD)

        response = self.client.post(reverse("staff-logout"))

        self.assertEqual(403, response.status_code)
        self.assertEqual(200, self.client.get(reverse("staff-me")).status_code)

    def test_repeated_guesses_against_one_account_are_throttled(self):
        with patch.dict(
            SimpleRateThrottle.THROTTLE_RATES, {"staff_login_email": "3/hour"}
        ):
            statuses = [
                self.login(self.user.email, "guess").status_code for _ in range(5)
            ]

        self.assertEqual([401, 401, 401, 429, 429], statuses)

    def test_a_throttled_account_stays_locked_even_with_the_right_password(self):
        with patch.dict(
            SimpleRateThrottle.THROTTLE_RATES, {"staff_login_email": "2/hour"}
        ):
            self.login(self.user.email, "guess")
            self.login(self.user.email, "guess")
            response = self.login(self.user.email, PASSWORD)

        self.assertEqual(429, response.status_code)

    def test_one_address_cannot_try_many_accounts(self):
        with patch.dict(
            SimpleRateThrottle.THROTTLE_RATES, {"staff_login_ip": "3/hour"}
        ):
            statuses = [
                self.login(f"user{i}@example.com", "guess").status_code
                for i in range(5)
            ]

        self.assertEqual([401, 401, 401, 429, 429], statuses)
