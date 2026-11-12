from datetime import timedelta
from decimal import Decimal

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from model_bakery import baker
from rest_framework.test import APIClient

from events.choices import EventStatus
from events.models import Event, TicketCategory
from registrations.models import Registration


class RegistrationRequestCreateViewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.url = reverse("registration-request-create")
        self.event = baker.make(
            Event, slug="conf-2027", status=EventStatus.OPEN, registration_prefix="AC27"
        )
        self.member = baker.make(
            TicketCategory,
            event=self.event,
            code="member",
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
            requires_member_validation=True,
        )
        self.payload = {
            "event": "conf-2027",
            "category": "member",
            "name": "Asha Rao",
            "company_name": "Rao Chemicals",
            "membership": "Tata Chemicals Ltd.",
            "mobile": "+91 98100 12345",
            "email": "asha@example.com",
            "delegates": "2",
            "message": "Please seat us together.",
            "additional_delegates": [
                {
                    "name": "Dev Rao",
                    "email": "dev@example.com",
                    "phone": "+91 98100 54321",
                    "designation": "Plant Manager",
                }
            ],
        }

    def test_valid_request_returns_receipt_and_sends_emails(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(201, response.status_code)
        body = response.json()
        self.assertEqual("AMAI-AC27-000001", body["public_id"])
        self.assertEqual("requested", body["status"])
        self.assertEqual("member", body["category"])
        self.assertEqual(35_400_00, body["quoted_total_minor"])
        self.assertEqual(1, Registration.objects.count())
        self.assertEqual(2, len(mail.outbox))

    def test_client_cannot_set_the_price(self):
        payload = {**self.payload, "quoted_total_minor": 1, "base_amount_minor": 1}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(201, response.status_code)
        self.assertEqual(35_400_00, Registration.objects.get().quoted_total_minor)

    def test_unknown_event_is_rejected(self):
        response = self.client.post(
            self.url, {**self.payload, "event": "nope"}, format="json"
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual(["event"], list(response.json()))

    def test_closed_event_is_rejected(self):
        Event.objects.filter(pk=self.event.pk).update(status=EventStatus.CLOSED)

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual(0, Registration.objects.count())

    def test_event_before_registration_window_is_rejected(self):
        Event.objects.filter(pk=self.event.pk).update(
            registration_opens_at=timezone.now() + timedelta(days=1)
        )

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(400, response.status_code)

    def test_unknown_or_inactive_category_is_rejected(self):
        TicketCategory.objects.filter(pk=self.member.pk).update(is_active=False)

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual(["category"], list(response.json()))

    def test_invalid_fields_are_reported_per_field(self):
        payload = {
            **self.payload,
            "email": "nope",
            "mobile": "12",
            "delegates": "9",
            "name": "",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual({"email", "mobile", "delegates", "name"}, set(response.json()))

    def test_additional_delegates_are_saved_and_emailed_to_staff(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.url, self.payload, format="json")

        registration = Registration.objects.get()
        self.assertEqual(
            self.payload["additional_delegates"], registration.additional_delegates
        )
        self.assertIn(
            "Dev Rao | dev@example.com | +91 98100 54321 | Plant Manager",
            mail.outbox[0].body,
        )

    def test_single_delegate_needs_no_additional_details(self):
        payload = {**self.payload, "delegates": "1", "additional_delegates": []}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(201, response.status_code)

    def test_missing_additional_delegates_are_rejected(self):
        payload = {**self.payload, "delegates": "3"}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual({"additional_delegates"}, set(response.json()))

    def test_additional_delegate_needs_name_email_phone_and_designation(self):
        payload = {
            **self.payload,
            "additional_delegates": [{"name": "Dev Rao", "email": "nope"}],
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual({"additional_delegates"}, set(response.json()))
        self.assertEqual(
            {"email", "phone", "designation"},
            set(response.json()["additional_delegates"]["0"]),
        )

    def test_member_category_needs_a_membership(self):
        payload = {**self.payload, "membership": ""}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(400, response.status_code)
        self.assertEqual({"membership"}, set(response.json()))

    def test_membership_is_saved_on_the_registration(self):
        self.client.post(self.url, self.payload, format="json")

        self.assertEqual("Tata Chemicals Ltd.", Registration.objects.get().membership)

    def test_non_member_category_needs_no_membership(self):
        baker.make(
            TicketCategory,
            event=self.event,
            code="non-member",
            base_amount_minor=35_000_00,
            gst_rate=Decimal("18.00"),
            requires_member_validation=False,
        )
        payload = {**self.payload, "category": "non-member", "membership": ""}

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(201, response.status_code)

    def test_five_or_more_needs_at_least_four_additional_delegates(self):
        delegate = self.payload["additional_delegates"][0]
        too_few = {**self.payload, "delegates": "5 or more"}
        enough = {
            **too_few,
            "additional_delegates": [delegate] * 4,
        }

        self.assertEqual(
            400, self.client.post(self.url, too_few, format="json").status_code
        )
        self.assertEqual(
            201, self.client.post(self.url, enough, format="json").status_code
        )

    def test_honeypot_is_accepted_but_not_saved(self):
        response = self.client.post(
            self.url, {**self.payload, "website": "http://spam.example"}, format="json"
        )

        self.assertEqual(201, response.status_code)
        self.assertEqual(0, Registration.objects.count())
