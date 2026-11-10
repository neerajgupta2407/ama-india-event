from unittest.mock import MagicMock, patch

from django.test import TestCase

import requests

from payments.models import Order
from payments.providers.base import InvalidSignature, ProviderError
from payments.providers.razorpay import RazorpayProvider
from payments.tests.helpers import (
    make_registration,
    payments_response,
    razorpay_create_order_response,
    razorpay_payment,
    sign,
    webhook_body,
)


class RazorpayCreateOrderTests(TestCase):
    def setUp(self):
        self.registration = make_registration()
        self.order = Order(
            registration=self.registration, amount_minor=70_800_00, currency="INR"
        )

    @patch("payments.providers.razorpay.requests.post")
    def test_posts_amount_currency_receipt_and_notes(self, post):
        post.return_value = razorpay_create_order_response("order_ABC")

        provider_order = RazorpayProvider().create_order(self.order)

        self.assertEqual("order_ABC", provider_order.id)
        args, kwargs = post.call_args
        self.assertEqual("https://api.razorpay.com/v1/orders", args[0])
        self.assertEqual(("rzp_test_dummy", "dummy"), kwargs["auth"])
        body = kwargs["json"]
        self.assertEqual(70_800_00, body["amount"])
        self.assertEqual("INR", body["currency"])
        self.assertEqual(self.order.reference, body["receipt"])
        self.assertEqual("AMAI-AC27-000001", body["notes"]["registration"])
        self.assertEqual("conf-2027", body["notes"]["event"])

    @patch("payments.providers.razorpay.requests.post")
    def test_rejected_order_raises_provider_error(self, post):
        post.return_value = MagicMock(ok=False, status_code=400)

        with self.assertRaises(ProviderError):
            RazorpayProvider().create_order(self.order)

    @patch(
        "payments.providers.razorpay.requests.post",
        side_effect=requests.ConnectTimeout(),
    )
    def test_network_failure_raises_provider_error(self, post):
        with self.assertRaises(ProviderError):
            RazorpayProvider().create_order(self.order)


class RazorpayFetchPaymentsTests(TestCase):
    @patch("payments.providers.razorpay.requests.get")
    def test_parses_payments_and_strips_card_and_contact_details(self, get):
        get.return_value = payments_response(
            razorpay_payment(
                payment_id="pay_1",
                status="failed",
                error_code="BAD_REQUEST_ERROR",
                error_description="Declined",
            ),
            razorpay_payment(payment_id="pay_2", status="captured"),
        )
        registration = make_registration()
        order = Order(registration=registration, provider_order_id="order_TEST1")

        payments = RazorpayProvider().fetch_payments(order)

        self.assertEqual(["failed", "captured"], [p.status for p in payments])
        self.assertEqual("Declined", payments[0].error_description)
        self.assertEqual(70_800_00, payments[1].amount_minor)
        for payment in payments:
            for key in ("card", "email", "contact", "vpa"):
                self.assertNotIn(key, payment.raw)
        self.assertEqual(
            "https://api.razorpay.com/v1/orders/order_TEST1/payments",
            get.call_args.args[0],
        )

    @patch(
        "payments.providers.razorpay.requests.get",
        side_effect=requests.ConnectionError(),
    )
    def test_network_failure_raises_provider_error(self, get):
        order = Order(registration=make_registration(), provider_order_id="order_TEST1")

        with self.assertRaises(ProviderError):
            RazorpayProvider().fetch_payments(order)


class RazorpayVerifyWebhookTests(TestCase):
    def setUp(self):
        self.body = webhook_body("payment.captured", razorpay_payment())

    def test_valid_signature_returns_event_with_payment(self):
        headers = {
            "X-Razorpay-Signature": sign(self.body),
            "X-Razorpay-Event-Id": "evt_1",
        }

        event = RazorpayProvider().verify_webhook(self.body, headers)

        self.assertEqual("evt_1", event.event_id)
        self.assertEqual("payment.captured", event.event_type)
        self.assertEqual("pay_1", event.payments[0].id)

    def test_wrong_signature_is_rejected(self):
        with self.assertRaises(InvalidSignature):
            RazorpayProvider().verify_webhook(
                self.body, {"X-Razorpay-Signature": sign(self.body, "other")}
            )

    def test_signature_over_a_different_body_is_rejected(self):
        headers = {"X-Razorpay-Signature": sign(self.body)}

        with self.assertRaises(InvalidSignature):
            RazorpayProvider().verify_webhook(self.body + b" ", headers)

    def test_missing_signature_is_rejected(self):
        with self.assertRaises(InvalidSignature):
            RazorpayProvider().verify_webhook(self.body, {})

    def test_unset_webhook_secret_rejects_everything(self):
        provider = RazorpayProvider()
        provider.webhook_secret = ""

        with self.assertRaises(InvalidSignature):
            provider.verify_webhook(
                self.body, {"X-Razorpay-Signature": sign(self.body, "")}
            )
