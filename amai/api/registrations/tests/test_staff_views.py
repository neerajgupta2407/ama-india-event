import csv
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core import mail
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

import requests
from model_bakery import baker
from rest_framework.test import APIClient

from audit.models import AuditEvent
from audit.services import AuditService
from core.tests.helpers import make_staff
from events.models import TicketCategory
from payments.choices import OrderStatus
from payments.models import Order
from payments.providers.razorpay import RazorpayProvider
from payments.services import PaymentService
from payments.tests.helpers import (
    make_registration,
    payments_response,
    razorpay_create_order_response,
    razorpay_payment,
)
from qr.models import AttendeePass, CheckIn
from qr.services import PassService
from registrations.choices import MemberValidation, RegistrationStatus
from registrations.models import Registration


def start_order(registration):
    with patch("payments.providers.razorpay.requests.post") as post:
        post.return_value = razorpay_create_order_response(
            f"order_{registration.public_id[-3:]}"
        )
        return PaymentService.start_payment(registration).order


def another(base, public_id, **fields):
    defaults = {
        "public_id": public_id,
        "event": base.event,
        "ticket_category": base.ticket_category,
        "delegates": "1",
        "currency": "INR",
        "quoted_base_minor": 1,
        "quoted_gst_minor": 0,
        "quoted_total_minor": 1,
    }
    return baker.make(Registration, **{**defaults, **fields})


class StaffClientMixin:
    def sign_in(self, *roles, **kwargs):
        self.client = APIClient()
        self.staff = make_staff(*roles, **kwargs)
        self.client.force_authenticate(self.staff)
        return self.staff

    def detail_url(self, name, registration):
        return reverse(name, kwargs={"public_id": registration.public_id})


class StaffRegistrationListTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.first = make_registration(delegates="2")
        self.first.full_name = "Asha Rao"
        self.first.save()
        self.order = start_order(self.first)
        self.second = another(
            self.first,
            "AMAI-AC27-000002",
            full_name="John Smith",
            email="john@example.com",
            status=RegistrationStatus.CONFIRMED,
        )
        self.sign_in("viewer")
        self.url = reverse("staff-registration-list")

    def ids(self, **params):
        return [
            r["public_id"] for r in self.client.get(self.url, params).json()["results"]
        ]

    def test_rows_show_the_latest_payment(self):
        row = next(
            r
            for r in self.client.get(self.url).json()["results"]
            if r["public_id"] == "AMAI-AC27-000001"
        )

        self.assertEqual("pending", row["payment_status"])
        self.assertEqual(self.order.reference, row["order_reference"])
        self.assertEqual(70_800_00, row["order_amount_minor"])
        self.assertEqual("non-member", row["category"])

    def test_a_registration_without_an_order_has_no_payment_fields(self):
        row = next(
            r
            for r in self.client.get(self.url).json()["results"]
            if r["public_id"] == "AMAI-AC27-000002"
        )

        self.assertIsNone(row["payment_status"])
        self.assertIsNone(row["order_reference"])

    def test_the_list_is_paginated_with_a_total(self):
        body = self.client.get(self.url, {"page_size": 1}).json()

        self.assertEqual(2, body["count"])
        self.assertEqual(1, len(body["results"]))
        self.assertIsNotNone(body["next"])

    def test_filters(self):
        self.assertEqual(["AMAI-AC27-000001"], self.ids(payment_status="pending"))
        self.assertEqual(["AMAI-AC27-000002"], self.ids(status="confirmed"))
        self.assertEqual([], self.ids(event="other-event"))
        self.assertEqual(2, len(self.ids(category="non-member")))

    def test_search_covers_name_id_email_and_order_reference(self):
        self.assertEqual(["AMAI-AC27-000002"], self.ids(q="smith"))
        self.assertEqual(["AMAI-AC27-000001"], self.ids(q="000001"))
        self.assertEqual(["AMAI-AC27-000002"], self.ids(q="john@"))
        self.assertEqual(["AMAI-AC27-000001"], self.ids(q=self.order.reference))

    def test_a_registration_with_two_orders_is_listed_once(self):
        start_order_two = baker.make(
            Order,
            registration=self.first,
            provider_order_id="order_second",
            amount_minor=1,
            currency="INR",
            status=OrderStatus.PENDING,
            access_token_hash="x",
        )

        self.assertEqual(
            1, self.ids(payment_status="pending").count("AMAI-AC27-000001")
        )
        self.assertEqual(1, self.ids(q="ORD-").count("AMAI-AC27-000001"))
        self.assertTrue(start_order_two.pk)


class StaffRegistrationDetailTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration(delegates="2")
        self.order = start_order(self.registration)
        self.sign_in("viewer")

    def test_detail_has_orders_attempts_pass_and_audit(self):
        with self.captureOnCommitCallbacks(execute=True):
            PaymentService.apply_payments(
                self.order.pk,
                [
                    RazorpayProvider.parse_payment(
                        razorpay_payment(order_id=self.order.provider_order_id)
                    )
                ],
            )
        actor = make_staff("ops")
        AuditService.record(
            actor=actor,
            action="registration.resend",
            obj=self.registration,
            data={"kind": "confirmation"},
        )

        body = self.client.get(
            self.detail_url("staff-registration-detail", self.registration)
        ).json()

        self.assertEqual("paid", body["orders"][0]["status"])
        self.assertEqual("captured", body["orders"][0]["attempts"][0]["status"])
        self.assertEqual(2, body["attendee_pass"]["admits"])
        self.assertEqual(0, body["attendee_pass"]["admitted"])
        self.assertEqual("registration.resend", body["audit"][0]["action"])
        self.assertEqual(actor.email, body["audit"][0]["actor"])

    def test_the_pass_secret_is_never_in_the_response(self):
        PassService.issue(self.registration)

        text = self.client.get(
            self.detail_url("staff-registration-detail", self.registration)
        ).content.decode()

        self.assertNotIn("token", text)

    def test_unknown_registration_is_not_found(self):
        response = self.client.get(
            reverse(
                "staff-registration-detail", kwargs={"public_id": "AMAI-NOPE-000001"}
            )
        )

        self.assertEqual(404, response.status_code)


class MemberReviewTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration()
        self.registration.member_validation = MemberValidation.PENDING_REVIEW
        self.registration.save()

    def review(self, decision):
        return self.client.post(
            self.detail_url("staff-registration-member-review", self.registration),
            {"decision": decision},
            format="json",
        )

    def test_membership_staff_can_verify_and_it_is_audited(self):
        staff = self.sign_in("membership")

        response = self.review("verified")

        self.assertEqual(200, response.status_code)
        self.assertEqual("verified", response.json()["member_validation"])
        event = AuditEvent.objects.get(action="registration.member_review")
        self.assertEqual({"before": "pending_review", "after": "verified"}, event.data)
        self.assertEqual(staff.email, event.actor_label)

    def test_rejecting_is_recorded_but_does_not_cancel(self):
        self.sign_in("ops")

        body = self.review("rejected").json()

        self.assertEqual("rejected", body["member_validation"])
        self.assertEqual("requested", body["status"])

    def test_it_cannot_be_reviewed_twice(self):
        self.sign_in("membership")
        self.review("verified")

        self.assertEqual(409, self.review("rejected").status_code)

    def test_viewers_and_finance_cannot_review(self):
        for role in ("viewer", "finance", "event_admin"):
            with self.subTest(role=role):
                self.sign_in(role)
                self.assertEqual(403, self.review("verified").status_code)
        self.registration.refresh_from_db()
        self.assertEqual(
            MemberValidation.PENDING_REVIEW, self.registration.member_validation
        )

    def test_an_unknown_decision_is_rejected(self):
        self.sign_in("membership")

        self.assertEqual(400, self.review("maybe").status_code)


class RefreshPaymentTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration()
        self.order = start_order(self.registration)
        self.sign_in("viewer")
        self.url = self.detail_url(
            "staff-registration-refresh-payment", self.registration
        )

    @patch("payments.providers.razorpay.requests.get")
    def test_it_asks_the_provider_and_confirms_a_captured_payment(self, get):
        get.return_value = payments_response(
            razorpay_payment(order_id=self.order.provider_order_id)
        )

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url)

        self.assertEqual(200, response.status_code)
        self.assertEqual("confirmed", response.json()["status"])
        self.assertEqual("paid", response.json()["orders"][0]["status"])
        event = AuditEvent.objects.get(action="payment.refresh")
        self.assertEqual("pending", event.data["before"])
        self.assertEqual("paid", event.data["after"])

    @patch("payments.providers.razorpay.requests.get")
    def test_still_unpaid_stays_pending(self, get):
        get.return_value = payments_response()

        body = self.client.post(self.url).json()

        self.assertEqual("pending", body["orders"][0]["status"])

    @patch("payments.providers.razorpay.requests.get")
    def test_a_registration_with_no_online_payment_is_a_conflict(self, get):
        plain = another(self.registration, "AMAI-AC27-000009")

        response = self.client.post(
            self.detail_url("staff-registration-refresh-payment", plain)
        )

        self.assertEqual(409, response.status_code)
        get.assert_not_called()

    @patch(
        "payments.providers.razorpay.requests.get",
        side_effect=requests.ConnectTimeout(),
    )
    def test_a_provider_outage_is_a_502_and_changes_nothing(self, get):
        response = self.client.post(self.url)

        self.assertEqual(502, response.status_code)
        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PENDING, self.order.status)

    @patch("payments.providers.razorpay.requests.get")
    def test_a_paid_order_is_not_asked_again(self, get):
        Order.objects.filter(pk=self.order.pk).update(status=OrderStatus.PAID)

        self.assertEqual(200, self.client.post(self.url).status_code)

        get.assert_not_called()


class ResendConfirmationTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration(delegates="2")
        self.sign_in("ops")
        self.url = self.detail_url("staff-registration-resend", self.registration)

    def test_confirmed_registrations_get_a_fresh_pass_link_and_the_old_one_dies(self):
        self.registration.status = RegistrationStatus.CONFIRMED
        self.registration.save()
        _, old_token = PassService.issue(self.registration)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url)

        self.assertEqual("confirmation", response.json()["sent"])
        self.assertIsNone(PassService.find_by_token(old_token))
        message = mail.outbox[0]
        self.assertEqual(["asha@example.com"], message.to)
        new_token = next(w for w in message.body.split() if "/c/?t=" in w).split("t=")[
            1
        ]
        self.assertEqual(
            self.registration, PassService.find_by_token(new_token).registration
        )
        self.assertTrue(
            AuditEvent.objects.filter(action="registration.resend").exists()
        )

    def test_unconfirmed_registrations_get_the_acknowledgement(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url)

        self.assertEqual("acknowledgement", response.json()["sent"])
        self.assertIn("received your registration request", mail.outbox[0].subject)
        self.assertEqual(0, AttendeePass.objects.count())

    def test_cancelled_registrations_get_nothing(self):
        self.registration.status = RegistrationStatus.CANCELLED
        self.registration.save()

        self.assertEqual(409, self.client.post(self.url).status_code)
        self.assertEqual(0, len(mail.outbox))

    def test_only_ops_can_resend(self):
        for role in ("viewer", "finance", "membership"):
            with self.subTest(role=role):
                self.sign_in(role)
                self.assertEqual(403, self.client.post(self.url).status_code)


class ConfirmManuallyTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration(delegates="2")
        self.sign_in("ops")
        self.url = self.detail_url("staff-registration-confirm", self.registration)

    def confirm(self, **data):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                self.url, {"note": "Paid by NEFT, ref 123", **data}, format="json"
            )

    def test_confirming_issues_a_pass_emails_it_and_records_why(self):
        response = self.confirm()

        self.assertEqual(200, response.status_code)
        self.assertEqual("confirmed", response.json()["status"])
        self.assertEqual(2, AttendeePass.objects.get().admits)
        self.assertEqual(["asha@example.com"], mail.outbox[0].to)
        event = AuditEvent.objects.get(action="registration.confirm_manually")
        self.assertEqual("Paid by NEFT, ref 123", event.data["note"])

    def test_a_note_is_required(self):
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(400, response.status_code)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.REQUESTED, self.registration.status)

    def test_five_or_more_delegates_need_a_head_count(self):
        big = another(self.registration, "AMAI-AC27-000005", delegates="5 or more")
        url = self.detail_url("staff-registration-confirm", big)

        refused = self.client.post(url, {"note": "NEFT"}, format="json")
        accepted = self.client.post(url, {"note": "NEFT", "admits": 7}, format="json")

        self.assertEqual(409, refused.status_code)
        self.assertEqual(200, accepted.status_code)
        self.assertEqual(7, AttendeePass.objects.get(registration=big).admits)

    def test_an_already_confirmed_registration_is_a_conflict(self):
        self.confirm()

        self.assertEqual(409, self.confirm().status_code)

    def test_a_registration_paid_online_cannot_be_confirmed_again(self):
        order = start_order(self.registration)
        Order.objects.filter(pk=order.pk).update(status=OrderStatus.PAID)

        self.assertEqual(409, self.confirm().status_code)

    def test_only_ops_can_confirm(self):
        for role in ("viewer", "finance", "membership", "event_admin"):
            with self.subTest(role=role):
                self.sign_in(role)
                self.assertEqual(403, self.confirm().status_code)
        self.assertEqual(0, AttendeePass.objects.count())


class CancelRegistrationTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration(delegates="2")
        self.sign_in("ops")
        self.url = self.detail_url("staff-registration-cancel", self.registration)

    def cancel(self, reason="Asked to withdraw"):
        return self.client.post(self.url, {"reason": reason}, format="json")

    def test_cancelling_revokes_the_pass_and_records_why(self):
        self.registration.status = RegistrationStatus.CONFIRMED
        self.registration.save()
        PassService.issue(self.registration)

        response = self.cancel()

        self.assertEqual("cancelled", response.json()["status"])
        self.assertIsNotNone(AttendeePass.objects.get().revoked_at)
        self.assertEqual(
            "Asked to withdraw",
            AuditEvent.objects.get(action="registration.cancel").data["reason"],
        )

    def test_a_reason_is_required(self):
        self.assertEqual(400, self.client.post(self.url, {}, format="json").status_code)

    def test_cancelling_twice_is_a_conflict(self):
        self.cancel()

        self.assertEqual(409, self.cancel().status_code)

    def test_a_registration_paid_online_must_be_refunded_first(self):
        order = start_order(self.registration)
        Order.objects.filter(pk=order.pk).update(status=OrderStatus.PAID)

        response = self.cancel()

        self.assertEqual(409, response.status_code)
        self.assertIn("Refund", response.json()["detail"])
        self.registration.refresh_from_db()
        self.assertNotEqual(RegistrationStatus.CANCELLED, self.registration.status)

    def test_only_ops_can_cancel(self):
        self.sign_in("viewer")

        self.assertEqual(403, self.cancel().status_code)


class ExportTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.registration = make_registration(delegates="2")
        self.order = start_order(self.registration)
        self.url = reverse("staff-registration-export")

    def rows(self, **params):
        response = self.client.get(self.url, params)
        self.assertEqual(200, response.status_code)
        return response, list(csv.reader(StringIO(response.content.decode())))

    def test_ops_get_a_csv_with_one_row_per_registration(self):
        self.sign_in("ops")

        response, rows = self.rows()

        self.assertIn("text/csv", response["Content-Type"])
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertEqual(2, len(rows))
        header = dict(zip(rows[0], rows[1], strict=True))
        self.assertEqual("AMAI-AC27-000001", header["Registration"])
        self.assertEqual(self.order.reference, header["Order"])
        self.assertEqual("70800.00", header["Amount (order total)"])
        self.assertEqual("asha@example.com", header["Email"])

    def test_the_export_follows_the_filters(self):
        self.sign_in("finance")
        another(
            self.registration, "AMAI-AC27-000002", status=RegistrationStatus.CONFIRMED
        )

        _, rows = self.rows(status="confirmed")

        self.assertEqual(["AMAI-AC27-000002"], [r[0] for r in rows[1:]])

    def test_cells_that_look_like_formulas_are_defused(self):
        self.sign_in("ops")
        Registration.objects.filter(pk=self.registration.pk).update(
            full_name='=HYPERLINK("http://evil.test","click")',
            company_name="+1+1",
            message="@SUM(A1)",
        )

        _, rows = self.rows()

        header = dict(zip(rows[0], rows[1], strict=True))
        self.assertTrue(header["Name"].startswith("'="))
        self.assertTrue(header["Company"].startswith("'+"))

    def test_every_export_is_audited(self):
        staff = self.sign_in("ops")

        self.rows(status="pending_payment")

        event = AuditEvent.objects.get(action="registrations.export")
        self.assertEqual(staff.email, event.actor_label)
        self.assertEqual(1, event.data["rows"])
        self.assertEqual({"status": "pending_payment"}, event.data["filters"])

    def test_viewers_and_membership_cannot_export_personal_data(self):
        for role in ("viewer", "membership", "event_admin", "checkin_operator"):
            with self.subTest(role=role):
                self.sign_in(role)
                self.assertEqual(403, self.client.get(self.url).status_code)
        self.assertEqual(
            0, AuditEvent.objects.filter(action="registrations.export").count()
        )


class OverviewTests(StaffClientMixin, TestCase):
    def setUp(self):
        self.sign_in("viewer")
        self.url = reverse("staff-overview")
        self.paid = make_registration(delegates="2")
        paid_order = start_order(self.paid)
        with self.captureOnCommitCallbacks(execute=True):
            PaymentService.apply_payments(
                paid_order.pk,
                [
                    RazorpayProvider.parse_payment(
                        razorpay_payment(order_id=paid_order.provider_order_id)
                    )
                ],
            )
        self.waiting = another(self.paid, "AMAI-AC27-000002", full_name="Waiting Wendy")
        self.review = another(
            self.paid,
            "AMAI-AC27-000003",
            full_name="Review Ravi",
            member_validation=MemberValidation.PENDING_REVIEW,
        )

    def test_counts_and_money(self):
        body = self.client.get(self.url).json()

        self.assertEqual(3, body["registrations"]["total"])
        self.assertEqual(1, body["registrations"]["confirmed"])
        self.assertEqual(2, body["registrations"]["requested"])
        self.assertEqual(1, body["payments"]["paid"])
        self.assertEqual(1, body["member_reviews_pending"])
        revenue = body["payments"]["revenue"]
        self.assertEqual(1, len(revenue))
        self.assertEqual("INR", revenue[0]["currency"])
        self.assertEqual(70_800_00, revenue[0]["total_minor"])
        self.assertEqual(60_000_00, revenue[0]["taxable_minor"])
        self.assertEqual(10_800_00, revenue[0]["gst_minor"])

    def test_revenue_is_kept_per_currency_never_added_across(self):
        usd_registration = another(self.paid, "AMAI-AC27-000004", currency="USD")
        baker.make(
            Order,
            registration=usd_registration,
            status=OrderStatus.PAID,
            currency="USD",
            amount_minor=90000,
            tax_breakup={"taxable_minor": 90000, "gst_minor": 0},
            provider_order_id="order_usd",
            access_token_hash="x",
        )

        revenue = {
            r["currency"]: r
            for r in self.client.get(self.url).json()["payments"]["revenue"]
        }

        self.assertEqual({"INR", "USD"}, set(revenue))
        self.assertEqual(90000, revenue["USD"]["total_minor"])

    def test_attention_lists_what_needs_a_human(self):
        mismatch = another(self.paid, "AMAI-AC27-000005", full_name="Mismatch Meera")
        baker.make(
            Order,
            registration=mismatch,
            status=OrderStatus.MISMATCH,
            currency="INR",
            amount_minor=5,
            provider_order_id="order_mm",
            access_token_hash="x",
        )
        stale = another(self.paid, "AMAI-AC27-000006", full_name="Stale Sam")
        old = baker.make(
            Order,
            registration=stale,
            status=OrderStatus.PENDING,
            currency="INR",
            amount_minor=5,
            provider_order_id="order_st",
            access_token_hash="x",
        )
        Order.objects.filter(pk=old.pk).update(
            created_at=timezone.now() - timedelta(hours=3)
        )

        items = self.client.get(self.url).json()["attention"]

        kinds = [i["kind"] for i in items]
        self.assertEqual("payment_mismatch", kinds[0])
        self.assertEqual("urgent", items[0]["severity"])
        self.assertIn("member_review", kinds)
        self.assertIn("payment_stale", kinds)
        self.assertEqual("Mismatch Meera", items[0]["name"])

    def test_a_fresh_pending_order_is_not_flagged(self):
        order = Order.objects.get(registration=self.paid)
        self.assertEqual("paid", order.status)
        fresh = another(self.paid, "AMAI-AC27-000007")
        baker.make(
            Order,
            registration=fresh,
            status=OrderStatus.PENDING,
            currency="INR",
            amount_minor=5,
            provider_order_id="order_fresh",
            access_token_hash="x",
        )

        kinds = [i["kind"] for i in self.client.get(self.url).json()["attention"]]

        self.assertNotIn("payment_stale", kinds)

    def test_the_event_filter_narrows_everything(self):
        other = baker.make("events.Event", slug="agm", registration_prefix="AGM")
        category = baker.make(TicketCategory, event=other, code="member")
        baker.make(
            Registration,
            event=other,
            ticket_category=category,
            public_id="AMAI-AGM-000001",
            delegates="1",
            currency="INR",
            quoted_base_minor=1,
            quoted_gst_minor=0,
            quoted_total_minor=1,
        )

        everything = self.client.get(self.url).json()
        only_agm = self.client.get(self.url, {"event": "agm"}).json()

        self.assertEqual(4, everything["registrations"]["total"])
        self.assertEqual(1, only_agm["registrations"]["total"])
        self.assertEqual([], only_agm["payments"]["revenue"])
        self.assertEqual(
            {"conf-2027", "agm"}, {e["slug"] for e in everything["events"]}
        )

    def test_check_in_progress_counts_people_not_registrations(self):
        baker.make(CheckIn, attendee_pass=self.paid.attendee_pass)

        body = self.client.get(self.url).json()

        self.assertEqual({"admitted": 1, "expected": 2}, body["check_in"])

    def test_by_category_counts_confirmed_separately(self):
        rows = self.client.get(self.url).json()["by_category"]

        self.assertEqual(
            [
                {
                    "code": "non-member",
                    "name": rows[0]["name"],
                    "total": 3,
                    "confirmed": 1,
                }
            ],
            rows,
        )
