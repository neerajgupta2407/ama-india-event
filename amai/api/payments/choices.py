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
