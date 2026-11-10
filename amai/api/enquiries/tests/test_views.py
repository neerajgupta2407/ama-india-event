from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from model_bakery import baker
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from audit.models import AuditEvent
from core.tests.helpers import make_staff
from enquiries.choices import EnquiryStatus
from enquiries.models import Enquiry

VALID = {
    "name": "Asha Rao",
    "company_name": "Rao Chemicals",
    "mobile": "+91 98100 12345",
    "email": "asha@example.com",
    "message": "Please share sponsorship details.",
}


class EnquiryCreateViewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.url = reverse("enquiry-create")

    def test_valid_enquiry_is_saved_and_staff_are_alerted(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url, VALID, format="json")

        self.assertEqual(201, response.status_code)
        enquiry = Enquiry.objects.get()
        self.assertEqual("asha@example.com", enquiry.email)
        self.assertEqual(EnquiryStatus.NEW, enquiry.status)
        self.assertEqual(1, len(mail.outbox))
        self.assertEqual(["staff@example.com"], mail.outbox[0].to)
        self.assertIn("Rao Chemicals", mail.outbox[0].body)

    def test_honeypot_is_accepted_but_not_saved(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url, {**VALID, "website": "http://spam.example"}, format="json"
            )

        self.assertEqual(201, response.status_code)
        self.assertEqual(0, Enquiry.objects.count())
        self.assertEqual(0, len(mail.outbox))

    def test_invalid_email_and_mobile_are_rejected(self):
        response = self.client.post(
            self.url, {**VALID, "email": "nope", "mobile": "abc"}, format="json"
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual({"email", "mobile"}, set(response.json()))
        self.assertEqual(0, Enquiry.objects.count())

    def test_mail_failure_does_not_fail_the_request(self):
        with patch("core.email.send_mail", side_effect=OSError("smtp down")):
            with self.assertLogs("core.email", level="ERROR"):
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.post(self.url, VALID, format="json")

        self.assertEqual(201, response.status_code)
        self.assertEqual(1, Enquiry.objects.count())

    def test_rate_limit_returns_429(self):
        with patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"enquiry": "2/hour"}):
            statuses = [
                self.client.post(self.url, VALID, format="json").status_code
                for _ in range(3)
            ]

        self.assertEqual([201, 201, 429], statuses)


class StaffEnquiryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse("staff-enquiry-list")
        self.new = baker.make(
            Enquiry, name="Asha Rao", email="asha@example.com", status=EnquiryStatus.NEW
        )
        self.closed = baker.make(
            Enquiry, name="Vikram", email="v@example.com", status=EnquiryStatus.CLOSED
        )

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.list_url)

        self.assertIn(response.status_code, (401, 403))

    def test_staff_without_a_role_cannot_list(self):
        self.client.force_authenticate(make_staff())

        response = self.client.get(self.list_url)

        self.assertEqual(403, response.status_code)

    def test_check_in_operators_cannot_see_enquiries(self):
        self.client.force_authenticate(make_staff("checkin_operator"))

        self.assertEqual(403, self.client.get(self.list_url).status_code)

    def test_viewer_can_list_and_filter_by_status(self):
        self.client.force_authenticate(make_staff("viewer"))

        everything = self.client.get(self.list_url).json()
        only_new = self.client.get(self.list_url, {"status": EnquiryStatus.NEW}).json()

        self.assertEqual(2, everything["count"])
        self.assertEqual([str(self.new.id)], [r["id"] for r in only_new["results"]])

    def test_staff_can_search_by_name(self):
        self.client.force_authenticate(make_staff("viewer"))

        response = self.client.get(self.list_url, {"q": "vikram"})

        self.assertEqual(
            [str(self.closed.id)], [r["id"] for r in response.json()["results"]]
        )

    def test_staff_can_open_one_enquiry(self):
        self.client.force_authenticate(make_staff("viewer"))

        response = self.client.get(
            reverse("staff-enquiry-detail", kwargs={"pk": self.new.id})
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("Asha Rao", response.json()["name"])


class StaffEnquiryStatusViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.enquiry = baker.make(Enquiry, status=EnquiryStatus.NEW)
        self.url = reverse("staff-enquiry-status", kwargs={"pk": self.enquiry.id})

    def test_ops_can_move_an_enquiry_and_it_is_audited(self):
        ops = make_staff("ops")
        self.client.force_authenticate(ops)

        response = self.client.patch(self.url, {"status": "contacted"}, format="json")

        self.assertEqual(200, response.status_code)
        self.assertEqual("contacted", response.json()["status"])
        event = AuditEvent.objects.get(action="enquiry.status")
        self.assertEqual({"before": "new", "after": "contacted"}, event.data)
        self.assertEqual(ops.email, event.actor_label)

    def test_viewer_cannot_change_status(self):
        self.client.force_authenticate(make_staff("viewer"))

        response = self.client.patch(self.url, {"status": "closed"}, format="json")

        self.assertEqual(403, response.status_code)
        self.enquiry.refresh_from_db()
        self.assertEqual(EnquiryStatus.NEW, self.enquiry.status)

    def test_unknown_status_is_rejected(self):
        self.client.force_authenticate(make_staff("ops"))

        self.assertEqual(
            400,
            self.client.patch(self.url, {"status": "bogus"}, format="json").status_code,
        )
