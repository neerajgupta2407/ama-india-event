from django.db import models


class PaymentProviderCode(models.TextChoices):
    RAZORPAY = "razorpay", "Razorpay"


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    # The last attempt failed. The visitor can retry on the same order.
    FAILED = "failed", "Failed"
    # Amount, currency or order did not match. Blocked until staff review it.
    MISMATCH = "mismatch", "Mismatch"


class PaymentAttemptStatus(models.TextChoices):
    CREATED = "created", "Created"
    AUTHORIZED = "authorized", "Authorized"
    CAPTURED = "captured", "Captured"
    FAILED = "failed", "Failed"


class ReconciliationIssue(models.TextChoices):
    MISMATCH = "mismatch", "Amount, currency or order did not match"
    PAID_NOT_CAPTURED = (
        "paid_not_captured",
        "Marked paid here but the provider shows no matching capture",
    )
    DUPLICATE_CAPTURE = "duplicate_capture", "More than one capture for one order"
    STALE_PENDING = "stale_pending", "Pending for over an hour"
    PROVIDER_UNREACHABLE = "provider_unreachable", "The provider could not be asked"
