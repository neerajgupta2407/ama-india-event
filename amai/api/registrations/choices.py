from django.db import models


class RegistrationStatus(models.TextChoices):
    # The current design takes a request that the secretariat follows up on.
    # PENDING_PAYMENT / PAID states arrive with the payments app.
    REQUESTED = "requested", "Requested"
    PENDING_PAYMENT = "pending_payment", "Pending payment"
    CONFIRMED = "confirmed", "Confirmed"
    CANCELLED = "cancelled", "Cancelled"


class MemberValidation(models.TextChoices):
    NOT_REQUIRED = "not_required", "Not required"
    PENDING_REVIEW = "pending_review", "Pending review"
    VERIFIED = "verified", "Verified"
    REJECTED = "rejected", "Rejected"


class DelegateCount(models.TextChoices):
    ONE = "1", "1"
    TWO = "2", "2"
    THREE = "3", "3"
    FOUR = "4", "4"
    FIVE_OR_MORE = "5 or more", "5 or more"


# "5 or more" has no exact number, so it cannot be priced online.
DELEGATE_NUMBERS = {
    DelegateCount.ONE: 1,
    DelegateCount.TWO: 2,
    DelegateCount.THREE: 3,
    DelegateCount.FOUR: 4,
    DelegateCount.FIVE_OR_MORE: None,
}
