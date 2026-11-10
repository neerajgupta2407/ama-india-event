import hashlib
import hmac
import json

from django.conf import settings

import requests

from payments.choices import PaymentAttemptStatus, PaymentProviderCode
from payments.providers.base import (
    InvalidSignature,
    ProviderError,
    ProviderOrder,
    ProviderPayment,
    VerifiedEvent,
)

API_BASE = "https://api.razorpay.com/v1"
TIMEOUT_SECONDS = 20
# Never stored: card and contact details that Razorpay may echo back.
SENSITIVE_KEYS = ("card", "vpa", "email", "contact")

STATUS_MAP = {
    "captured": PaymentAttemptStatus.CAPTURED,
    "authorized": PaymentAttemptStatus.AUTHORIZED,
    "failed": PaymentAttemptStatus.FAILED,
}


def strip_sensitive(entity):
    return {k: v for k, v in entity.items() if k not in SENSITIVE_KEYS}


class RazorpayProvider:
    code = PaymentProviderCode.RAZORPAY

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    def is_configured(self):
        return bool(self.key_id and self.key_secret)

    def create_order(self, order):
        """`order` is not saved yet, so only the fields below are read from it."""
        registration = order.registration
        try:
            response = requests.post(
                f"{API_BASE}/orders",
                auth=(self.key_id, self.key_secret),
                json={
                    "amount": order.amount_minor,
                    "currency": order.currency,
                    "receipt": order.reference,
                    "notes": {
                        "registration": registration.public_id,
                        "event": registration.event.slug,
                        "order": order.reference,
                    },
                },
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise ProviderError("Razorpay is unreachable") from error
        if not response.ok:
            raise ProviderError(f"Razorpay rejected the order ({response.status_code})")
        return ProviderOrder(id=response.json()["id"])

    def checkout_params(self, order):
        """What the browser needs to open Razorpay Checkout. Never contains the secret."""
        registration = order.registration
        return {
            "key": self.key_id,
            "order_id": order.provider_order_id,
            "amount": order.amount_minor,
            "currency": order.currency,
            "name": "AMAI",
            "description": registration.event.title,
            "prefill": {
                "name": registration.full_name,
                "email": registration.email,
                "contact": registration.mobile,
            },
        }

    def fetch_payments(self, order):
        """Ask Razorpay directly which payments exist for the order."""
        try:
            response = requests.get(
                f"{API_BASE}/orders/{order.provider_order_id}/payments",
                auth=(self.key_id, self.key_secret),
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as error:
            raise ProviderError("Razorpay is unreachable") from error
        if not response.ok:
            raise ProviderError(
                f"Razorpay status check failed ({response.status_code})"
            )
        return [self.parse_payment(item) for item in response.json().get("items", [])]

    @staticmethod
    def parse_payment(entity):
        return ProviderPayment(
            id=entity["id"],
            order_id=entity.get("order_id") or "",
            status=STATUS_MAP.get(entity.get("status"), PaymentAttemptStatus.CREATED),
            amount_minor=int(entity.get("amount", 0)),
            currency=entity.get("currency", ""),
            method=entity.get("method") or "",
            error_code=entity.get("error_code") or "",
            error_description=entity.get("error_description") or "",
            raw=strip_sensitive(entity),
        )

    def verify_webhook(self, raw_body, headers):
        """HMAC-SHA256 of the raw body with the webhook secret. Rejects when no secret is set."""
        if not self.webhook_secret:
            raise InvalidSignature("Webhook secret is not configured")
        signature = headers.get("X-Razorpay-Signature", "")
        expected = hmac.new(
            self.webhook_secret.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise InvalidSignature("Bad webhook signature")
        try:
            payload = json.loads(raw_body)
        except ValueError as error:
            raise InvalidSignature("Webhook body is not JSON") from error
        entity = payload.get("payload", {}).get("payment", {}).get("entity")
        return VerifiedEvent(
            event_id=headers.get("X-Razorpay-Event-Id")
            or hashlib.sha256(raw_body).hexdigest(),
            event_type=payload.get("event", ""),
            payload=payload,
            payments=[self.parse_payment(entity)] if entity else [],
        )
