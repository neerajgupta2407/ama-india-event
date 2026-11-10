from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

import requests

from payments.choices import OrderStatus
from payments.models import Order
from payments.services import PaymentService
from payments.tests.helpers import (
    make_registration,
    payments_response,
    razorpay_create_order_response,
    razorpay_payment,
)
from registrations.choices import RegistrationStatus


class ReconcilePendingOrdersTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def setUp(self, post):
        post.return_value = razorpay_create_order_response("order_TEST1")
        self.registration = make_registration()
        self.order = PaymentService.start_payment(self.registration).order

    def run_command(self, *args):
        out = StringIO()
        with self.captureOnCommitCallbacks(execute=True):
            call_command("reconcile_pending_orders", *args, stdout=out)
        return out.getvalue()

    @patch("payments.providers.razorpay.requests.get")
    def test_confirms_an_order_that_was_paid_after_the_visitor_left(self, get):
        get.return_value = payments_response(razorpay_payment())

        output = self.run_command()

        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PAID, self.order.status)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.CONFIRMED, self.registration.status)
        self.assertIn("1 newly paid", output)
        self.assertEqual(2, len(mail.outbox))

    @patch("payments.providers.razorpay.requests.get")
    def test_leaves_unpaid_orders_alone(self, get):
        get.return_value = payments_response()

        self.run_command()

        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PENDING, self.order.status)

    @patch("payments.providers.razorpay.requests.get")
    def test_skips_old_and_already_paid_orders(self, get):
        Order.objects.filter(pk=self.order.pk).update(
            created_at=timezone.now() - timedelta(hours=100)
        )

        output = self.run_command()

        get.assert_not_called()
        self.assertIn("Checked 0 open orders", output)

    @patch(
        "payments.providers.razorpay.requests.get",
        side_effect=requests.ConnectTimeout(),
    )
    def test_provider_outage_is_reported_and_does_not_crash(self, get):
        with self.assertLogs(
            "payments.management.commands.reconcile_pending_orders", level="ERROR"
        ):
            output = self.run_command()

        self.assertIn("1 could not be checked", output)
