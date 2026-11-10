from django.test import TestCase
from django.urls import reverse

from model_bakery import baker
from rest_framework.test import APIClient

from core.roles import ALL_ROLES, user_roles
from core.tests.helpers import make_staff
from events.choices import EventStatus
from events.models import Event


class UserRolesTests(TestCase):
    def test_superuser_holds_every_role(self):
        self.assertEqual(set(ALL_ROLES), user_roles(make_staff(superuser=True)))

    def test_roles_come_from_groups(self):
        self.assertEqual({"ops", "viewer"}, user_roles(make_staff("ops", "viewer")))

    def test_non_staff_and_inactive_users_hold_none(self):
        staff = make_staff("ops")
        staff.is_active = False
        staff.save()
        outsider = make_staff("ops")
        outsider.is_staff = False
        outsider.save()

        self.assertEqual(set(), user_roles(staff))
        self.assertEqual(set(), user_roles(outsider))


class RoleMatrixTests(TestCase):
    """Who may call what. A 403 means refused; anything else means the role got through."""

    def setUp(self):
        self.event = baker.make(Event, slug="conf", status=EventStatus.OPEN)

    def status_for(self, user, method, url, data=None):
        client = APIClient()
        client.force_authenticate(user)
        return getattr(client, method)(url, data or {}, format="json").status_code

    def assert_allowed_exactly(self, allowed, method, url, data=None):
        for role in ALL_ROLES:
            with self.subTest(role=role, url=url):
                code = self.status_for(make_staff(role), method, url, data)
                if role in allowed:
                    self.assertNotEqual(403, code, f"{role} should be allowed")
                else:
                    self.assertEqual(403, code, f"{role} should be refused")
        with self.subTest(role="superuser", url=url):
            self.assertNotEqual(
                403, self.status_for(make_staff(superuser=True), method, url, data)
            )

    def test_reading_the_dashboard(self):
        readers = {"ops", "finance", "membership", "event_admin", "viewer"}
        for name in (
            "staff-overview",
            "staff-registration-list",
            "staff-order-list",
            "staff-enquiry-list",
            "staff-event-list",
            "staff-reconciliation",
        ):
            self.assert_allowed_exactly(readers, "get", reverse(name))

    def test_export_is_for_ops_and_finance(self):
        self.assert_allowed_exactly(
            {"ops", "finance"}, "get", reverse("staff-registration-export")
        )

    def test_running_reconciliation_is_finance_only(self):
        self.assert_allowed_exactly(
            {"finance"}, "post", reverse("staff-reconciliation-run")
        )

    def test_checkin_is_for_checkin_operators_and_ops(self):
        for name in ("staff-checkin-recent", "staff-checkin-search"):
            self.assert_allowed_exactly(
                {"checkin_operator", "ops"}, "get", reverse(name)
            )
        self.assert_allowed_exactly(
            {"checkin_operator", "ops"}, "post", reverse("staff-checkin"), {"code": "x"}
        )

    def test_event_settings_are_event_admin_only(self):
        url = reverse("staff-event-settings", kwargs={"slug": "conf"})
        self.assert_allowed_exactly(
            {"event_admin"}, "patch", url, {"group_min_delegates": 3}
        )

    def test_everyone_signed_in_can_ask_who_they_are(self):
        self.assert_allowed_exactly(set(ALL_ROLES), "get", reverse("staff-me"))
