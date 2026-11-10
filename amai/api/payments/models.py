import hashlib
import secrets

from django.conf import settings
from django.db import models

from core.models import UUIDBaseModel
from events.choices import Currency
from payments.choices import (
    OrderStatus,
    PaymentAttemptStatus,
    PaymentProviderCode,
)
from registrations.models import Registration


def new_order_reference():
    return f"ORD-{secrets.token_hex(4).upper()}"


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


class Order(UUIDBaseModel):
    """
    What a visitor pays for. Financial records are never soft-deleted.
    Money is integer minor units (paise / cents) computed on the server.
    """

    reference = models.CharField(
        max_length=20, unique=True, default=new_order_reference, editable=False
    )
    registration = models.ForeignKey(
        Registration, on_delete=models.PROTECT, related_name="orders"
    )
    amount_minor = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, choices=Currency.choices)
    tax_breakup = models.JSONField(default=dict)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    provider = models.CharField(
        max_length=20,
        choices=PaymentProviderCode.choices,
        default=PaymentProviderCode.RAZORPAY,
    )
    provider_order_id = models.CharField(max_length=64, unique=True)
    # SHA-256 of the token handed to the visitor. The plain token is never stored.
    access_token_hash = models.CharField(max_length=64)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} ({self.status})"


class PaymentAttempt(UUIDBaseModel):
    """One payment try on an order. Rows are only added or updated, never deleted."""

    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="attempts")
    provider_payment_id = models.CharField(max_length=64, unique=True)
    method = models.CharField(max_length=30, blank=True)
    status = models.CharField(
        max_length=20,
        choices=PaymentAttemptStatus.choices,
        default=PaymentAttemptStatus.CREATED,
    )
    amount_minor = models.PositiveIntegerField()
    currency = models.CharField(max_length=3)
    error_code = models.CharField(max_length=100, blank=True)
    error_description = models.TextField(blank=True)
    # Provider response with card and contact details removed.
    raw_response = models.JSONField(default=dict)

    class Meta:
        ordering = ["created_at"]


class WebhookEvent(UUIDBaseModel):
    """Raw provider webhooks. The unique event_id makes redelivery harmless."""

    provider = models.CharField(max_length=20, choices=PaymentProviderCode.choices)
    event_id = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=60)
    signature_valid = models.BooleanField(default=True)
    payload = models.JSONField(default=dict)
    processed_at = models.DateTimeField(null=True, blank=True)
    processing_error = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class ReconciliationRun(UUIDBaseModel):
    """One check of our orders against the payment provider. Kept so finance can see history."""

    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    triggered_by_label = models.CharField(max_length=254, blank=True)
    event_slug = models.CharField(max_length=100, blank=True)
    orders_checked = models.PositiveIntegerField(default=0)
    matched = models.PositiveIntegerField(default=0)
    recovered = models.PositiveIntegerField(default=0)
    # [{"order": "ORD-...", "registration": "AMAI-...", "issue": "mismatch", "detail": "..."}]
    exceptions = models.JSONField(default=list)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
