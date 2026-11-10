from datetime import timedelta
from decimal import Decimal

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from model_bakery import baker
from rest_framework.test import APIClient

from audit.models import AuditEvent
from core.tests.helpers import make_staff
from events.choices import EventStatus
from events.models import Event, TicketCategory
from registrations.models import Registration


class StaffEventTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_staff("event_admin")
        self.client.force_authenticate(self.admin)
        self.event = baker.make(
            Event,
            slug="conf",
            title="Conference",
            status=EventStatus.OPEN,
            registration_prefix="AC27",
            online_payment_enabled=False,
        )
        self.member = baker.make(
            TicketCategory,
            event=self.event,
            code="member",
            currency="INR",
            audience="member",
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
        )
        self.settings_url = reverse("staff-event-settings", kwargs={"slug": "conf"})

    def test_the_list_shows_events_with_categories_and_registration_counts(self):
        baker.make(
            Registration,
            event=self.event,
            ticket_category=self.member,
            delegates="1",
            currency="INR",
            quoted_base_minor=1,
            quoted_gst_minor=0,
            quoted_total_minor=1,
        )

        body = self.client.get(reverse("staff-event-list")).json()

        self.assertEqual(1, len(body))
        self.assertEqual(1, body[0]["registrations"])
        self.assertEqual("member", body[0]["categories"][0]["code"])
        self.assertEqual("conf", body[0]["slug"])

    def test_the_detail_includes_discount_settings(self):
        body = self.client.get(
            reverse("staff-event-detail", kwargs={"slug": "conf"})
        ).json()

        for key in (
            "online_payment_enabled",
            "early_bird_percent",
            "early_bird_until",
            "group_discount_percent",
            "group_min_delegates",
        ):
            self.assertIn(key, body)

    @override_settings(RAZORPAY_KEY_ID="rzp_test_x", RAZORPAY_KEY_SECRET="s")
    def test_event_admin_can_turn_on_online_payment_and_it_is_audited(self):
        response = self.client.patch(
            self.settings_url, {"online_payment_enabled": True}, format="json"
        )

        self.assertEqual(200, response.status_code)
        self.assertTrue(response.json()["online_payment_enabled"])
        self.event.refresh_from_db()
        self.assertTrue(self.event.online_payment_enabled)
        audit = AuditEvent.objects.get(action="event.settings")
        self.assertEqual(
            {"online_payment_enabled": {"before": "False", "after": "True"}}, audit.data
        )
        self.assertEqual(self.admin.email, audit.actor_label)

    @override_settings(RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET="")
    def test_online_payment_cannot_be_enabled_without_provider_keys(self):
        response = self.client.patch(
            self.settings_url, {"online_payment_enabled": True}, format="json"
        )

        self.assertEqual(400, response.status_code)
        self.assertIn("online_payment_enabled", response.json())
        self.event.refresh_from_db()
        self.assertFalse(self.event.online_payment_enabled)

    def test_setting_the_discount_rules_for_a_campaign(self):
        cutoff = (timezone.now() + timedelta(days=30)).isoformat()

        response = self.client.patch(
            self.settings_url,
            {
                "early_bird_percent": "10",
                "early_bird_until": cutoff,
                "group_discount_percent": "10",
                "group_min_delegates": 3,
            },
            format="json",
        )

        self.assertEqual(200, response.status_code)
        self.event.refresh_from_db()
        self.assertEqual(Decimal("10.00"), self.event.early_bird_percent)
        self.assertEqual(3, self.event.group_min_delegates)

    def test_an_early_bird_discount_needs_a_cutoff_date(self):
        response = self.client.patch(
            self.settings_url, {"early_bird_percent": "10"}, format="json"
        )

        self.assertEqual(400, response.status_code)
        self.assertIn("early_bird_until", response.json())

    @override_settings(RAZORPAY_KEY_ID="rzp_test_x", RAZORPAY_KEY_SECRET="s")
    def test_an_inactive_early_bird_setup_does_not_block_other_saves(self):
        # What the seed leaves behind: a percentage with no cutoff date yet.
        Event.objects.filter(pk=self.event.pk).update(
            early_bird_percent=Decimal("10.00"), early_bird_until=None
        )

        response = self.client.patch(
            self.settings_url,
            {
                "early_bird_percent": "10.00",
                "early_bird_until": None,
                "online_payment_enabled": True,
            },
            format="json",
        )

        self.assertEqual(200, response.status_code)
        self.event.refresh_from_db()
        self.assertTrue(self.event.online_payment_enabled)

    def test_changing_the_early_bird_percentage_still_needs_a_cutoff(self):
        Event.objects.filter(pk=self.event.pk).update(
            early_bird_percent=Decimal("10.00"), early_bird_until=None
        )

        response = self.client.patch(
            self.settings_url, {"early_bird_percent": "15"}, format="json"
        )

        self.assertEqual(400, response.status_code)
        self.assertIn("early_bird_until", response.json())

    def test_percentages_and_group_size_are_bounded(self):
        for payload, field in (
            ({"group_discount_percent": "150"}, "group_discount_percent"),
            ({"group_discount_percent": "-5"}, "group_discount_percent"),
            ({"group_min_delegates": 1}, "group_min_delegates"),
            ({"status": "bogus"}, "status"),
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(self.settings_url, payload, format="json")
                self.assertEqual(400, response.status_code)
                self.assertIn(field, response.json())

    def test_registration_must_close_after_it_opens(self):
        now = timezone.now()

        response = self.client.patch(
            self.settings_url,
            {
                "registration_opens_at": now.isoformat(),
                "registration_closes_at": (now - timedelta(days=1)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(400, response.status_code)

    def test_identity_fields_are_not_editable_here(self):
        self.client.patch(
            self.settings_url,
            {"slug": "hacked", "registration_prefix": "XX", "title": "New"},
            format="json",
        )

        self.event.refresh_from_db()
        self.assertEqual(
            ("conf", "AC27", "Conference"),
            (self.event.slug, self.event.registration_prefix, self.event.title),
        )

    def test_an_unchanged_save_writes_no_audit_event(self):
        self.client.patch(self.settings_url, {"status": "open"}, format="json")

        self.assertEqual(0, AuditEvent.objects.filter(action="event.settings").count())

    def test_closing_registration_takes_effect_on_the_public_page(self):
        self.client.patch(self.settings_url, {"status": "closed"}, format="json")

        public = (
            APIClient().get(reverse("event-detail", kwargs={"slug": "conf"})).json()
        )

        self.assertFalse(public["registration_open"])


class StaffCategoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_staff("event_admin")
        self.client.force_authenticate(self.admin)
        self.event = baker.make(
            Event, slug="conf", status=EventStatus.OPEN, registration_prefix="AC27"
        )
        self.category = baker.make(
            TicketCategory,
            event=self.event,
            code="member",
            audience="member",
            currency="INR",
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
        )
        self.url = reverse("staff-category-update", kwargs={"pk": self.category.pk})

    def test_changing_a_fee_is_saved_and_audited_with_before_and_after(self):
        response = self.client.patch(
            self.url, {"base_amount_minor": 32_000_00}, format="json"
        )

        self.assertEqual(200, response.status_code)
        self.category.refresh_from_db()
        self.assertEqual(32_000_00, self.category.base_amount_minor)
        audit = AuditEvent.objects.get(action="category.update")
        self.assertEqual(
            {"before": "3000000", "after": "3200000"}, audit.data["base_amount_minor"]
        )
        self.assertEqual("member", audit.data["category"])

    def test_the_new_fee_applies_to_the_public_price_straight_away(self):
        self.client.patch(self.url, {"base_amount_minor": 32_000_00}, format="json")

        public = (
            APIClient().get(reverse("event-detail", kwargs={"slug": "conf"})).json()
        )

        self.assertEqual(32_000_00, public["categories"][0]["base_amount_minor"])

    def test_a_category_can_be_switched_off(self):
        self.client.patch(self.url, {"is_active": False}, format="json")

        public = (
            APIClient().get(reverse("event-detail", kwargs={"slug": "conf"})).json()
        )

        self.assertEqual([], public["categories"])

    def test_code_audience_and_currency_cannot_change(self):
        self.client.patch(
            self.url,
            {"code": "x", "audience": "international", "currency": "USD"},
            format="json",
        )

        self.category.refresh_from_db()
        self.assertEqual(
            ("member", "member", "INR"),
            (self.category.code, self.category.audience, self.category.currency),
        )

    def test_bad_values_are_rejected(self):
        for payload, field in (
            ({"base_amount_minor": 0}, "base_amount_minor"),
            ({"base_amount_minor": -5}, "base_amount_minor"),
            ({"gst_rate": "120"}, "gst_rate"),
            ({"gst_rate": "-1"}, "gst_rate"),
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(self.url, payload, format="json")
                self.assertEqual(400, response.status_code)
                self.assertIn(field, response.json())

    def test_only_event_admins_can_change_fees(self):
        for role in ("ops", "finance", "viewer", "membership"):
            with self.subTest(role=role):
                self.client.force_authenticate(make_staff(role))
                self.assertEqual(
                    403,
                    self.client.patch(
                        self.url, {"base_amount_minor": 1}, format="json"
                    ).status_code,
                )
        self.category.refresh_from_db()
        self.assertEqual(30_000_00, self.category.base_amount_minor)
