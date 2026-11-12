from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

import requests
from rest_framework.test import APIClient

from payments.choices import OrderStatus
from payments.models import Order
from payments.services import PaymentService
from payments.tests.helpers import (
    make_registration,
    payments_response,
    razorpay_create_order_response,
    razorpay_payment,
    sign,
    webhook_body,
)
from registrations.choices import RegistrationStatus


class RegistrationStartsPaymentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.registration = make_registration()
        self.payload = {
            "event": "conf-2027",
            "category": "non-member",
            "name": "Vikram Shah",
            "company_name": "Shah Alkalis",
            "mobile": "+91 98100 12345",
            "email": "vikram@example.com",
            "delegates": "2",
            "additional_delegates": [
                {
                    "name": "Dev",
                    "email": "dev@example.com",
                    "phone": "9810054321",
                    "designation": "Manager",
                }
            ],
        }

    @patch("payments.providers.razorpay.requests.post")
    def test_submit_returns_checkout_details_and_no_ack_email(self, post):
        post.return_value = razorpay_create_order_response("order_NEW")

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse("registration-request-create"), self.payload, format="json"
            )

        self.assertEqual(201, response.status_code)
        payment = response.json()["payment"]
        self.assertEqual("order_NEW", payment["checkout"]["order_id"])
        self.assertEqual(70_800_00, payment["amount_minor"])
        self.assertEqual(70_800_00, payment["checkout"]["amount"])
        self.assertTrue(payment["order_ref"].startswith("ORD-"))
        self.assertTrue(payment["access_token"])
        self.assertEqual("pending_payment", Order.objects.get().registration.status)
        self.assertEqual("pending_payment", response.json()["status"])
        # Staff hear about the request; the visitor is sent to pay instead of "we'll contact you".
        self.assertEqual(["staff@example.com"], [m.to[0] for m in mail.outbox])

    @patch("payments.providers.razorpay.requests.post")
    def test_client_cannot_choose_the_amount(self, post):
        post.return_value = razorpay_create_order_response()

        self.client.post(
            reverse("registration-request-create"),
            {**self.payload, "amount": 1, "amount_minor": 1, "quoted_total_minor": 1},
            format="json",
        )

        self.assertEqual(70_800_00, post.call_args.kwargs["json"]["amount"])

    def test_payment_is_null_when_online_payment_is_off(self):
        self.registration.event.online_payment_enabled = False
        self.registration.event.save()

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse("registration-request-create"), self.payload, format="json"
            )

        self.assertEqual(201, response.status_code)
        self.assertIsNone(response.json()["payment"])
        self.assertEqual(
            ["staff@example.com", "vikram@example.com"],
            sorted(m.to[0] for m in mail.outbox),
        )

    @patch(
        "payments.providers.razorpay.requests.post",
        side_effect=requests.ConnectTimeout(),
    )
    def test_provider_outage_still_saves_the_registration(self, post):
        with self.assertLogs("payments.services", level="ERROR"):
            response = self.client.post(
                reverse("registration-request-create"), self.payload, format="json"
            )

        self.assertEqual(201, response.status_code)
        self.assertIsNone(response.json()["payment"])
        self.assertEqual(0, Order.objects.count())


class OrderStatusViewTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def setUp(self, post):
        cache.clear()
        post.return_value = razorpay_create_order_response("order_TEST1")
        self.client = APIClient()
        self.registration = make_registration()
        started = PaymentService.start_payment(self.registration)
        self.order = started.order
        self.token = started.access_token
        self.url = reverse("order-status", kwargs={"reference": self.order.reference})

    @patch("payments.providers.razorpay.requests.get")
    def test_token_is_required(self, get):
        for headers in (
            {},
            {"HTTP_X_ORDER_TOKEN": "wrong"},
            {"HTTP_X_ORDER_TOKEN": ""},
        ):
            with self.subTest(headers=headers):
                response = self.client.get(self.url, **headers)
                self.assertEqual(403, response.status_code)
        get.assert_not_called()

    def test_unknown_order_is_not_found(self):
        response = self.client.get(
            reverse("order-status", kwargs={"reference": "ORD-NOPE0000"}),
            HTTP_X_ORDER_TOKEN=self.token,
        )

        self.assertEqual(404, response.status_code)

    @patch("payments.providers.razorpay.requests.get")
    def test_pending_order_returns_checkout_to_retry_with(self, get):
        get.return_value = payments_response()

        response = self.client.get(self.url, HTTP_X_ORDER_TOKEN=self.token)

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("pending", body["status"])
        self.assertEqual("AMAI-AC27-000001", body["registration"])
        self.assertEqual("order_TEST1", body["checkout"]["order_id"])

    @patch("payments.providers.razorpay.requests.get")
    def test_polling_asks_razorpay_and_confirms_a_captured_payment(self, get):
        get.return_value = payments_response(razorpay_payment())

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.get(self.url, HTTP_X_ORDER_TOKEN=self.token)

        body = response.json()
        self.assertEqual("paid", body["status"])
        self.assertNotIn("checkout", body)
        self.assertIsNotNone(body["paid_at"])
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.CONFIRMED, self.registration.status)
        self.assertEqual(2, len(mail.outbox))

    @patch("payments.providers.razorpay.requests.get")
    def test_failed_attempt_is_reported_with_checkout_for_retry(self, get):
        get.return_value = payments_response(
            razorpay_payment(status="failed", error_description="Declined")
        )

        body = self.client.get(self.url, HTTP_X_ORDER_TOKEN=self.token).json()

        self.assertEqual("failed", body["status"])
        self.assertEqual("order_TEST1", body["checkout"]["order_id"])

    @patch("payments.providers.razorpay.requests.get")
    def test_paid_order_does_not_call_razorpay_again(self, get):
        Order.objects.filter(pk=self.order.pk).update(status=OrderStatus.PAID)

        response = self.client.get(self.url, HTTP_X_ORDER_TOKEN=self.token)

        self.assertEqual("paid", response.json()["status"])
        get.assert_not_called()

    @patch(
        "payments.providers.razorpay.requests.get",
        side_effect=requests.ConnectTimeout(),
    )
    def test_razorpay_outage_still_answers_with_the_current_status(self, get):
        with self.assertLogs("payments.views", level="ERROR"):
            response = self.client.get(self.url, HTTP_X_ORDER_TOKEN=self.token)

        self.assertEqual(200, response.status_code)
        self.assertEqual("pending", response.json()["status"])


class RazorpayWebhookViewTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def setUp(self, post):
        post.return_value = razorpay_create_order_response("order_TEST1")
        # Razorpay cannot send a CSRF token, so the endpoint must work with checks switched on.
        self.client = APIClient(enforce_csrf_checks=True)
        self.order = PaymentService.start_payment(make_registration()).order
        self.url = reverse("razorpay-webhook")

    def post_webhook(self, body, signature, event_id="evt_1"):
        return self.client.post(
            self.url,
            data=body,
            content_type="application/json",
            HTTP_X_RAZORPAY_SIGNATURE=signature,
            HTTP_X_RAZORPAY_EVENT_ID=event_id,
        )

    def test_signed_capture_marks_the_order_paid(self):
        body = webhook_body("payment.captured", razorpay_payment())

        with self.captureOnCommitCallbacks(execute=True):
            response = self.post_webhook(body, sign(body))

        self.assertEqual(200, response.status_code)
        self.assertEqual("processed", response.json()["status"])
        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PAID, self.order.status)

    def test_bad_signature_is_a_400_and_changes_nothing(self):
        body = webhook_body("payment.captured", razorpay_payment())

        with self.assertLogs("payments.views", level="WARNING"):
            response = self.post_webhook(body, "forged")

        self.assertEqual(400, response.status_code)
        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PENDING, self.order.status)

    def test_same_event_twice_is_harmless(self):
        body = webhook_body("payment.captured", razorpay_payment())
        self.post_webhook(body, sign(body))

        response = self.post_webhook(body, sign(body))

        self.assertEqual(200, response.status_code)
        self.assertEqual("duplicate", response.json()["status"])

    def test_amount_mismatch_in_webhook_blocks_confirmation(self):
        body = webhook_body("payment.captured", razorpay_payment(amount=100))

        with self.captureOnCommitCallbacks(execute=True):
            self.post_webhook(body, sign(body))

        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.MISMATCH, self.order.status)


class RegistrationQuoteViewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.registration = make_registration()
        self.url = reverse("registration-quote")

    def quote(self, delegates):
        return self.client.post(
            self.url,
            {"event": "conf-2027", "category": "non-member", "delegates": delegates},
            format="json",
        )

    def test_quote_matches_what_the_order_will_charge(self):
        body = self.quote("3").json()

        self.assertTrue(body["payable_online"])
        self.assertEqual(3, body["delegates"])
        self.assertEqual(90_000_00, body["subtotal_minor"])
        self.assertEqual("10.00", body["discount_percent"])
        self.assertEqual(9_000_00, body["discount_minor"])
        self.assertEqual(14_580_00, body["gst_minor"])
        self.assertEqual(95_580_00, body["total_minor"])

    @patch("payments.providers.razorpay.requests.post")
    def test_quote_total_equals_the_razorpay_order_amount(self, post):
        post.return_value = razorpay_create_order_response()
        quoted = self.quote("3").json()["total_minor"]

        response = self.client.post(
            reverse("registration-request-create"),
            {
                "event": "conf-2027",
                "category": "non-member",
                "name": "Vikram Shah",
                "mobile": "9810012345",
                "email": "vikram@example.com",
                "delegates": "3",
                "additional_delegates": [
                    {
                        "name": "A",
                        "email": "a@example.com",
                        "phone": "9810000001",
                        "designation": "Manager",
                    },
                    {
                        "name": "B",
                        "email": "b@example.com",
                        "phone": "9810000002",
                        "designation": "Chemist",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(quoted, response.json()["payment"]["amount_minor"])
        self.assertEqual(quoted, post.call_args.kwargs["json"]["amount"])

    def test_five_or_more_cannot_be_priced_online(self):
        body = self.quote("5 or more").json()

        self.assertFalse(body["payable_online"])
        self.assertEqual(30_000_00, body["unit_minor"])
        self.assertNotIn("total_minor", body)

    def test_switch_off_means_not_payable_online(self):
        self.registration.event.online_payment_enabled = False
        self.registration.event.save()

        self.assertFalse(self.quote("2").json()["payable_online"])

    def test_unknown_category_and_bad_delegates_are_rejected(self):
        bad_category = self.client.post(
            self.url,
            {"event": "conf-2027", "category": "nope", "delegates": "1"},
            format="json",
        )
        bad_delegates = self.quote("12")

        self.assertEqual(400, bad_category.status_code)
        self.assertEqual(400, bad_delegates.status_code)
