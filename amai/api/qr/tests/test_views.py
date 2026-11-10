from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from model_bakery import baker
from rest_framework.test import APIClient

from core.tests.helpers import make_staff
from payments.tests.helpers import make_registration
from qr.models import CheckIn
from qr.services import PassService
from registrations.choices import RegistrationStatus


def confirmed_with_pass(delegates="2"):
    registration = make_registration(delegates=delegates)
    registration.status = RegistrationStatus.CONFIRMED
    registration.save()
    attendee_pass, token = PassService.issue(registration)
    return registration, attendee_pass, token


class PublicPassViewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.registration, self.attendee_pass, self.token = confirmed_with_pass("3")

    def test_the_token_opens_the_attendees_own_pass(self):
        response = self.client.get(reverse("public-pass", kwargs={"token": self.token}))

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("AMAI-AC27-000001", body["public_id"])
        self.assertEqual("Asha Rao", body["name"])
        self.assertEqual(3, body["admits"])
        self.assertEqual(0, body["admitted"])
        self.assertTrue(body["valid"])
        self.assertEqual("Conference 2027", body["event"]["title"])

    def test_the_pass_page_does_not_expose_contact_details(self):
        body = self.client.get(
            reverse("public-pass", kwargs={"token": self.token})
        ).json()

        text = str(body)
        self.assertNotIn("asha@example.com", text)
        self.assertNotIn("9810012345", text)

    def test_a_wrong_token_is_not_found(self):
        response = self.client.get(reverse("public-pass", kwargs={"token": "wrong"}))

        self.assertEqual(404, response.status_code)

    def test_a_reissued_pass_stops_the_old_link(self):
        PassService.issue(self.registration)

        response = self.client.get(reverse("public-pass", kwargs={"token": self.token}))

        self.assertEqual(404, response.status_code)

    def test_shows_how_many_have_arrived(self):
        baker.make(CheckIn, attendee_pass=self.attendee_pass)

        body = self.client.get(
            reverse("public-pass", kwargs={"token": self.token})
        ).json()

        self.assertEqual(1, body["admitted"])


class StaffCheckInViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.operator = make_staff("checkin_operator")
        self.client.force_authenticate(self.operator)
        self.registration, self.attendee_pass, self.token = confirmed_with_pass("2")

    def scan(self, code, **extra):
        return self.client.post(
            reverse("staff-checkin"), {"code": code, **extra}, format="json"
        )

    def test_a_good_scan_returns_ok_with_the_attendee(self):
        response = self.scan(self.token, gate="Main")

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("OK", body["result"])
        self.assertEqual(
            {"admitted": 1, "admits": 2}, {k: body[k] for k in ("admitted", "admits")}
        )
        self.assertEqual("Asha Rao", body["registration"]["name"])

    def test_the_gate_response_carries_no_email_or_mobile(self):
        body = self.scan(self.token).json()

        self.assertEqual(
            {"public_id", "name", "company", "category", "delegates"},
            set(body["registration"]),
        )

    def test_every_outcome_is_a_200_the_screen_can_show(self):
        self.scan(self.token)
        self.scan(self.token)

        outcomes = {
            "ALREADY_CHECKED_IN": self.scan(self.token),
            "INVALID": self.scan("nonsense"),
        }

        for expected, response in outcomes.items():
            with self.subTest(expected=expected):
                self.assertEqual(200, response.status_code)
                self.assertEqual(expected, response.json()["result"])

    def test_invalid_scan_has_no_registration(self):
        body = self.scan("nonsense").json()

        self.assertIsNone(body["registration"])

    def test_a_request_without_a_code_is_rejected(self):
        response = self.client.post(reverse("staff-checkin"), {}, format="json")

        self.assertEqual(400, response.status_code)

    def test_search_returns_gate_safe_rows(self):
        response = self.client.get(reverse("staff-checkin-search"), {"q": "asha"})

        self.assertEqual(200, response.status_code)
        row = response.json()[0]
        self.assertEqual("AMAI-AC27-000001", row["public_id"])
        self.assertEqual((2, 0), (row["admits"], row["admitted"]))
        self.assertNotIn("email", row)
        self.assertNotIn("mobile", row)

    def test_search_needs_at_least_two_characters(self):
        self.assertEqual(
            [], self.client.get(reverse("staff-checkin-search"), {"q": "a"}).json()
        )

    def test_recent_lists_who_was_just_checked_in(self):
        self.scan(self.token, gate="Gate 2")

        rows = self.client.get(reverse("staff-checkin-recent")).json()

        self.assertEqual(1, len(rows))
        self.assertEqual("Asha Rao", rows[0]["registration"]["name"])
        self.assertEqual(self.operator.email, rows[0]["operator_label"])
        self.assertEqual("Gate 2", rows[0]["gate"])

    def test_anonymous_cannot_scan(self):
        anonymous = APIClient()

        response = anonymous.post(
            reverse("staff-checkin"), {"code": self.token}, format="json"
        )

        self.assertIn(response.status_code, (401, 403))
        self.assertEqual(0, CheckIn.objects.count())
