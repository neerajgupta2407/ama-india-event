from unittest.mock import patch

from django.core import mail
from django.test import TestCase

from payments.choices import OrderStatus
from payments.models import Order, PaymentAttempt, WebhookEvent, hash_token
from payments.providers import get_provider
from payments.providers.base import InvalidSignature
from payments.providers.razorpay import RazorpayProvider
from payments.services import PaymentService
from payments.tests.helpers import (
    make_registration,
    razorpay_create_order_response,
    razorpay_payment,
    sign,
    webhook_body,
)
from registrations.choices import RegistrationStatus


def parse(*entities):
    return [RazorpayProvider.parse_payment(e) for e in entities]


class StartPaymentTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def test_creates_order_with_server_side_price_and_token(self, post):
        post.return_value = razorpay_create_order_response("order_X")
        registration = make_registration(delegates="3")

        started = PaymentService.start_payment(registration)

        order = Order.objects.get()
        # 3 x 30,000 = 90,000; 10% group discount = 9,000; GST 18% of 81,000 = 14,580
        self.assertEqual(95_580_00, order.amount_minor)
        self.assertEqual(95_580_00, post.call_args.kwargs["json"]["amount"])
        self.assertEqual("order_X", order.provider_order_id)
        self.assertEqual(OrderStatus.PENDING, order.status)
        self.assertEqual(9_000_00, order.tax_breakup["discount_minor"])
        self.assertEqual(hash_token(started.access_token), order.access_token_hash)
        self.assertNotIn(started.access_token, order.access_token_hash)
        self.assertEqual("order_X", started.checkout["order_id"])
        self.assertEqual("rzp_test_dummy", started.checkout["key"])
        self.assertNotIn(
            "dummy", [v for k, v in started.checkout.items() if k != "key"]
        )
        registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.PENDING_PAYMENT, registration.status)

    @patch("payments.providers.razorpay.requests.post")
    def test_switch_off_means_no_online_payment(self, post):
        registration = make_registration(online=False)

        self.assertIsNone(PaymentService.start_payment(registration))

        post.assert_not_called()
        self.assertEqual(0, Order.objects.count())
        registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.REQUESTED, registration.status)

    @patch("payments.providers.razorpay.requests.post")
    def test_five_or_more_delegates_are_followed_up_manually(self, post):
        registration = make_registration(delegates="5 or more")

        self.assertIsNone(PaymentService.start_payment(registration))

        post.assert_not_called()

    @patch("payments.providers.razorpay.requests.post")
    def test_provider_down_keeps_registration_and_creates_no_order(self, post):
        import requests

        post.side_effect = requests.ConnectTimeout()
        registration = make_registration()

        with self.assertLogs("payments.services", level="ERROR"):
            result = PaymentService.start_payment(registration)

        self.assertIsNone(result)
        self.assertEqual(0, Order.objects.count())
        registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.REQUESTED, registration.status)

    @patch("payments.providers.razorpay.requests.post")
    def test_missing_keys_mean_no_online_payment(self, post):
        registration = make_registration()

        with self.settings(RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET=""):
            self.assertIsNone(PaymentService.start_payment(registration))

        post.assert_not_called()


class ApplyPaymentsTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def setUp(self, post):
        post.return_value = razorpay_create_order_response("order_TEST1")
        self.registration = make_registration()
        self.started = PaymentService.start_payment(self.registration)
        self.order = self.started.order  # 2 x 30,000 + 18% GST = 70,800.00

    def apply(self, *entities):
        with self.captureOnCommitCallbacks(execute=True):
            return PaymentService.apply_payments(self.order.pk, parse(*entities))

    def test_captured_payment_marks_paid_confirms_registration_and_emails(self):
        order = self.apply(razorpay_payment())

        self.assertEqual(OrderStatus.PAID, order.status)
        self.assertIsNotNone(order.paid_at)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.CONFIRMED, self.registration.status)
        self.assertEqual(1, PaymentAttempt.objects.count())
        self.assertEqual(
            ["asha@example.com", "staff@example.com"],
            sorted(m.to[0] for m in mail.outbox),
        )
        self.assertIn("₹70,800.00", mail.outbox[0].body)

    def test_attempt_stores_no_card_or_contact_details(self):
        self.apply(razorpay_payment())

        raw = PaymentAttempt.objects.get().raw_response
        for key in ("card", "email", "contact"):
            self.assertNotIn(key, raw)

    def test_replaying_the_same_capture_changes_nothing(self):
        self.apply(razorpay_payment())
        mail.outbox.clear()

        order = self.apply(razorpay_payment())

        self.assertEqual(OrderStatus.PAID, order.status)
        self.assertEqual(1, PaymentAttempt.objects.count())
        self.assertEqual(0, len(mail.outbox))

    def test_failed_attempt_then_successful_retry_ends_paid(self):
        failed = self.apply(
            razorpay_payment(
                payment_id="pay_f",
                status="failed",
                error_code="E",
                error_description="Declined",
            )
        )
        self.assertEqual(OrderStatus.FAILED, failed.status)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.PENDING_PAYMENT, self.registration.status)

        paid = self.apply(
            razorpay_payment(payment_id="pay_f", status="failed"),
            razorpay_payment(payment_id="pay_ok"),
        )

        self.assertEqual(OrderStatus.PAID, paid.status)
        self.assertEqual(2, PaymentAttempt.objects.count())

    def test_authorized_but_not_captured_stays_pending(self):
        order = self.apply(razorpay_payment(status="authorized"))

        self.assertEqual(OrderStatus.PENDING, order.status)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.PENDING_PAYMENT, self.registration.status)

    def test_wrong_amount_is_a_mismatch_and_does_not_confirm(self):
        order = self.apply(razorpay_payment(amount=1_00))

        self.assertEqual(OrderStatus.MISMATCH, order.status)
        self.assertIsNone(order.paid_at)
        self.registration.refresh_from_db()
        self.assertEqual(RegistrationStatus.PENDING_PAYMENT, self.registration.status)
        self.assertEqual(["staff@example.com"], [m.to[0] for m in mail.outbox])
        self.assertIn("PAYMENT MISMATCH", mail.outbox[0].subject)

    def test_wrong_currency_is_a_mismatch(self):
        order = self.apply(razorpay_payment(currency="USD"))

        self.assertEqual(OrderStatus.MISMATCH, order.status)

    def test_payment_for_another_provider_order_is_a_mismatch(self):
        order = self.apply(razorpay_payment(order_id="order_SOMEONE_ELSE"))

        self.assertEqual(OrderStatus.MISMATCH, order.status)

    def test_mismatch_is_final_even_if_a_correct_payment_follows(self):
        self.apply(razorpay_payment(payment_id="pay_bad", amount=1_00))

        order = self.apply(razorpay_payment(payment_id="pay_good"))

        self.assertEqual(OrderStatus.MISMATCH, order.status)

    def test_second_capture_on_a_paid_order_is_recorded_and_flagged(self):
        self.apply(razorpay_payment(payment_id="pay_1"))
        mail.outbox.clear()

        order = self.apply(razorpay_payment(payment_id="pay_2"))

        self.assertEqual(OrderStatus.PAID, order.status)
        self.assertEqual(2, PaymentAttempt.objects.count())
        self.assertEqual(1, len(mail.outbox))
        self.assertIn("Duplicate payment", mail.outbox[0].subject)


class ProcessWebhookTests(TestCase):
    @patch("payments.providers.razorpay.requests.post")
    def setUp(self, post):
        post.return_value = razorpay_create_order_response("order_TEST1")
        self.order = PaymentService.start_payment(make_registration()).order

    def deliver(self, event_id="evt_1", **payment):
        body = webhook_body("payment.captured", razorpay_payment(**payment))
        headers = {"X-Razorpay-Signature": sign(body), "X-Razorpay-Event-Id": event_id}
        with self.captureOnCommitCallbacks(execute=True):
            return PaymentService.process_webhook(raw_body=body, headers=headers)

    def test_valid_webhook_marks_the_order_paid(self):
        self.assertEqual("processed", self.deliver())

        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PAID, self.order.status)
        event = WebhookEvent.objects.get()
        self.assertIsNotNone(event.processed_at)
        self.assertEqual("payment.captured", event.event_type)

    def test_redelivered_event_is_ignored(self):
        self.deliver()
        mail.outbox.clear()

        self.assertEqual("duplicate", self.deliver())

        self.assertEqual(1, WebhookEvent.objects.count())
        self.assertEqual(0, len(mail.outbox))

    def test_event_for_an_unknown_order_is_recorded_with_an_error(self):
        self.deliver(order_id="order_UNKNOWN")

        event = WebhookEvent.objects.get()
        self.assertIn("order_UNKNOWN", event.processing_error)
        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PENDING, self.order.status)

    def test_bad_signature_is_rejected_and_nothing_is_stored(self):
        body = webhook_body("payment.captured", razorpay_payment())

        with self.assertRaises(InvalidSignature):
            PaymentService.process_webhook(
                raw_body=body, headers={"X-Razorpay-Signature": "nope"}
            )

        self.assertEqual(0, WebhookEvent.objects.count())
        self.order.refresh_from_db()
        self.assertEqual(OrderStatus.PENDING, self.order.status)


class ProviderRegistryTests(TestCase):
    def test_default_provider_is_razorpay(self):
        self.assertIsInstance(get_provider(), RazorpayProvider)

    def test_unknown_provider_raises(self):
        with self.assertRaises(ValueError):
            get_provider("nope")
