from decimal import Decimal

from django.core import mail
from django.test import TestCase

from model_bakery import baker

from events.choices import Currency, EventStatus
from events.models import Event, TicketCategory
from registrations.choices import MemberValidation, RegistrationStatus
from registrations.services import RegistrationService

DATA = {
    "name": "Asha Rao",
    "company_name": "Rao Chemicals",
    "mobile": "9810012345",
    "email": "asha@example.com",
    "delegates": "2",
    "message": "",
}


class RegistrationServiceTests(TestCase):
    def setUp(self):
        self.event = baker.make(
            Event, status=EventStatus.OPEN, registration_prefix="AC27"
        )
        self.member = baker.make(
            TicketCategory,
            event=self.event,
            code="member",
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
            requires_member_validation=True,
        )
        self.international = baker.make(
            TicketCategory,
            event=self.event,
            code="international",
            currency=Currency.USD,
            base_amount_minor=900_00,
            gst_rate=Decimal("0.00"),
        )

    def test_creates_request_with_server_side_price_snapshot(self):
        registration = RegistrationService.create_request(
            event=self.event, category=self.member, data=DATA
        )

        self.assertEqual(RegistrationStatus.REQUESTED, registration.status)
        self.assertEqual("INR", registration.currency)
        self.assertEqual(30_000_00, registration.quoted_base_minor)
        self.assertEqual(5_400_00, registration.quoted_gst_minor)
        self.assertEqual(35_400_00, registration.quoted_total_minor)

    def test_public_ids_are_sequential_per_event(self):
        first = RegistrationService.create_request(
            event=self.event, category=self.member, data=DATA
        )
        second = RegistrationService.create_request(
            event=self.event, category=self.international, data=DATA
        )

        self.assertEqual("AMAI-AC27-000001", first.public_id)
        self.assertEqual("AMAI-AC27-000002", second.public_id)
        self.event.refresh_from_db()
        self.assertEqual(2, self.event.registration_counter)

    def test_other_event_has_its_own_sequence(self):
        other = baker.make(Event, status=EventStatus.OPEN, registration_prefix="AGM")
        category = baker.make(
            TicketCategory, event=other, code="member", base_amount_minor=1000
        )

        RegistrationService.create_request(
            event=self.event, category=self.member, data=DATA
        )
        registration = RegistrationService.create_request(
            event=other, category=category, data=DATA
        )

        self.assertEqual("AMAI-AGM-000001", registration.public_id)

    def test_member_category_is_flagged_for_membership_review(self):
        member = RegistrationService.create_request(
            event=self.event, category=self.member, data=DATA
        )
        international = RegistrationService.create_request(
            event=self.event, category=self.international, data=DATA
        )

        self.assertEqual(MemberValidation.PENDING_REVIEW, member.member_validation)
        self.assertEqual(MemberValidation.NOT_REQUIRED, international.member_validation)

    def test_sends_staff_alert_and_acknowledgement_after_commit(self):
        with self.captureOnCommitCallbacks(execute=True):
            registration = RegistrationService.create_request(
                event=self.event, category=self.member, data=DATA
            )

        recipients = sorted(m.to[0] for m in mail.outbox)
        self.assertEqual(["asha@example.com", "staff@example.com"], recipients)
        for message in mail.outbox:
            self.assertIn(registration.public_id, message.subject)
