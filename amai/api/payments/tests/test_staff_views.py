from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

import requests
from model_bakery import baker
from rest_framework.test import APIClient

from audit.models import AuditEvent
from core.tests.helpers import make_staff
from payments.choices import OrderStatus, PaymentAttemptStatus, ReconciliationIssue
from payments.models import Order, PaymentAttempt, ReconciliationRun
from payments.tests.helpers import (
    make_registration,
    payments_response,
    razorpay_payment,
)
from registrations.choices import RegistrationStatus
from registrations.models import Registration


def make_order(
    base, number, status, *, amount=70_800_00, created_ago=None, name="Person", **extra
):
    registration = baker.make(
        Registration,
        public_id=f"AMAI-AC27-{number:06d}",
        event=base.event,
        ticket_category=base.ticket_category,
        full_name=name,
        email=f"{name.lower().replace(' ', '')}@example.com",
        delegates="2",
        currency="INR",
        quoted_base_minor=1,
        quoted_gst_minor=0,
        quoted_total_minor=1,
        status=RegistrationStatus.PENDING_PAYMENT,
    )
    order = baker.make(
        Order,
        registration=registration,
        status=status,
        amount_minor=amount,
        currency="INR",
        provider_order_id=f"order_{number}",
        access_token_hash="x",
        **extra,
    )
    if created_ago:
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - created_ago
        )
        order.refresh_from_db()
    return order


class StaffOrderListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_staff("viewer"))
        self.base = make_registration()
        self.paid = make_order(self.base, 10, OrderStatus.PAID, name="Paid Priya")
        self.failed = make_order(self.base, 11, OrderStatus.FAILED, name="Failed Farid")
        self.stale = make_order(
            self.base,
            12,
            OrderStatus.PENDING,
            name="Stale Sam",
            created_ago=timedelta(hours=3),
        )
        self.fresh = make_order(self.base, 13, OrderStatus.PENDING, name="Fresh Fay")
        self.url = reverse("staff-order-list")

    def refs(self, **params):
        return {
            r["reference"] for r in self.client.get(self.url, params).json()["results"]
        }

    def test_lists_every_order_with_the_attendee(self):
        body = self.client.get(self.url).json()

        self.assertEqual(4, body["count"])
        row = next(r for r in body["results"] if r["reference"] == self.paid.reference)
        self.assertEqual("Paid Priya", row["name"])
        self.assertEqual("AMAI-AC27-000010", row["registration"])
        self.assertEqual(70_800_00, row["amount_minor"])

    def test_filter_by_status(self):
        self.assertEqual({self.failed.reference}, self.refs(status="failed"))

    def test_stale_means_pending_for_over_an_hour(self):
        self.assertEqual({self.stale.reference}, self.refs(stale="true"))

    def test_search_by_reference_registration_or_name(self):
        self.assertEqual({self.fresh.reference}, self.refs(q=self.fresh.reference))
        self.assertEqual({self.paid.reference}, self.refs(q="000010"))
        self.assertEqual({self.failed.reference}, self.refs(q="farid"))

    def test_event_filter(self):
        self.assertEqual(set(), self.refs(event="other"))
        self.assertEqual(4, len(self.refs(event="conf-2027")))

    def test_shows_attempt_count_and_the_last_error(self):
        baker.make(
            PaymentAttempt,
            order=self.failed,
            provider_payment_id="pay_a",
            amount_minor=1,
            currency="INR",
            status=PaymentAttemptStatus.FAILED,
            error_description="Card declined",
        )

        row = next(
            r
            for r in self.client.get(self.url).json()["results"]
            if r["reference"] == self.failed.reference
        )

        self.assertEqual(1, row["attempts"])
        self.assertEqual("Card declined", row["last_error"])


def provider_says(mapping):
    """requests.get stand-in: maps a provider order id to its payments (or an exception)."""

    def fake_get(url, **kwargs):
        order_id = url.split("/orders/")[1].split("/")[0]
        answer = mapping[order_id]
        if isinstance(answer, Exception):
            raise answer
        return payments_response(*answer)

    return fake_get


class ReconciliationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.finance = make_staff("finance")
        self.client.force_authenticate(self.finance)
        self.base = make_registration()
        self.run_url = reverse("staff-reconciliation-run")

    def run_with(self, mapping, **body):
        with patch(
            "payments.providers.razorpay.requests.get",
            side_effect=provider_says(mapping),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                return self.client.post(self.run_url, body, format="json")

    def issues(self, response):
        return {(e["order"], e["issue"]) for e in response.json()["exceptions"]}

    def test_a_correctly_paid_order_matches_and_raises_nothing(self):
        order = make_order(self.base, 20, OrderStatus.PAID)

        response = self.run_with(
            {
                order.provider_order_id: [
                    razorpay_payment(order_id=order.provider_order_id)
                ]
            }
        )

        self.assertEqual(201, response.status_code)
        body = response.json()
        self.assertEqual(
            (1, 1, 0, []),
            (
                body["orders_checked"],
                body["matched"],
                body["recovered"],
                body["exceptions"],
            ),
        )

    def test_paid_here_but_nothing_captured_there_is_flagged(self):
        order = make_order(self.base, 21, OrderStatus.PAID)

        response = self.run_with({order.provider_order_id: []})

        self.assertEqual(
            {(order.reference, ReconciliationIssue.PAID_NOT_CAPTURED)},
            self.issues(response),
        )

    def test_a_paid_order_captured_for_the_wrong_amount_is_flagged(self):
        order = make_order(self.base, 22, OrderStatus.PAID)

        response = self.run_with(
            {
                order.provider_order_id: [
                    razorpay_payment(order_id=order.provider_order_id, amount=1_00)
                ]
            }
        )

        self.assertEqual(
            {(order.reference, ReconciliationIssue.PAID_NOT_CAPTURED)},
            self.issues(response),
        )

    def test_two_captures_on_one_order_is_a_duplicate(self):
        order = make_order(self.base, 23, OrderStatus.PAID)
        both = [
            razorpay_payment(payment_id="pay_a", order_id=order.provider_order_id),
            razorpay_payment(payment_id="pay_b", order_id=order.provider_order_id),
        ]

        response = self.run_with({order.provider_order_id: both})

        self.assertEqual(
            {(order.reference, ReconciliationIssue.DUPLICATE_CAPTURE)},
            self.issues(response),
        )

    def test_a_pending_order_that_was_actually_paid_is_recovered_and_confirmed(self):
        order = make_order(self.base, 24, OrderStatus.PENDING)

        response = self.run_with(
            {
                order.provider_order_id: [
                    razorpay_payment(order_id=order.provider_order_id)
                ]
            }
        )

        body = response.json()
        self.assertEqual((1, []), (body["recovered"], body["exceptions"]))
        order.refresh_from_db()
        self.assertEqual(OrderStatus.PAID, order.status)
        order.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.CONFIRMED, order.registration.status)

    def test_old_pending_orders_are_stale_but_fresh_ones_are_left_alone(self):
        stale = make_order(
            self.base, 25, OrderStatus.PENDING, created_ago=timedelta(hours=2)
        )
        fresh = make_order(self.base, 26, OrderStatus.PENDING)

        response = self.run_with(
            {stale.provider_order_id: [], fresh.provider_order_id: []}
        )

        self.assertEqual(
            {(stale.reference, ReconciliationIssue.STALE_PENDING)},
            self.issues(response),
        )

    def test_a_mismatch_is_always_listed_without_asking_the_provider(self):
        order = make_order(self.base, 27, OrderStatus.MISMATCH)

        with patch("payments.providers.razorpay.requests.get") as get:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(self.run_url)

        self.assertEqual(
            {(order.reference, ReconciliationIssue.MISMATCH)}, self.issues(response)
        )
        get.assert_not_called()

    def test_an_unreachable_provider_is_reported_per_order_and_the_run_continues(self):
        down = make_order(self.base, 28, OrderStatus.PAID)
        fine = make_order(self.base, 29, OrderStatus.PAID)

        response = self.run_with(
            {
                down.provider_order_id: requests.ConnectTimeout(),
                fine.provider_order_id: [
                    razorpay_payment(order_id=fine.provider_order_id)
                ],
            }
        )

        body = response.json()
        self.assertEqual(
            {(down.reference, ReconciliationIssue.PROVIDER_UNREACHABLE)},
            self.issues(response),
        )
        self.assertEqual(1, body["matched"])

    def test_every_run_is_saved_and_audited_with_who_ran_it(self):
        make_order(self.base, 30, OrderStatus.MISMATCH)

        self.run_with({})

        run = ReconciliationRun.objects.get()
        self.assertEqual(self.finance.email, run.triggered_by_label)
        self.assertIsNotNone(run.finished_at)
        event = AuditEvent.objects.get(action="reconciliation.run")
        self.assertEqual({"checked": 1, "exceptions": 1, "recovered": 0}, event.data)

    def test_a_run_can_be_limited_to_one_event(self):
        order = make_order(self.base, 31, OrderStatus.MISMATCH)

        everything = self.run_with({}).json()
        other_event = self.run_with({}, event="some-other-event").json()

        self.assertEqual(1, everything["orders_checked"])
        self.assertEqual(0, other_event["orders_checked"])
        self.assertTrue(order.pk)

    def test_history_lists_runs_newest_first_for_any_dashboard_reader(self):
        self.run_with({})
        self.run_with({}, event="x")
        self.client.force_authenticate(make_staff("viewer"))

        runs = self.client.get(reverse("staff-reconciliation")).json()

        self.assertEqual(["x", ""], [r["event_slug"] for r in runs])

    def test_only_finance_can_start_a_run(self):
        for role in ("viewer", "ops", "membership", "event_admin"):
            with self.subTest(role=role):
                self.client.force_authenticate(make_staff(role))
                self.assertEqual(403, self.client.post(self.run_url).status_code)
        self.assertEqual(0, ReconciliationRun.objects.count())
