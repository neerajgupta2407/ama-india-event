from django.db import models


class CheckInResult(models.TextChoices):
    OK = "OK", "Checked in"
    ALREADY_CHECKED_IN = "ALREADY_CHECKED_IN", "Already checked in"
    NOT_PAID = "NOT_PAID", "Not a confirmed registration"
    REVOKED = "REVOKED", "Pass revoked"
    INVALID = "INVALID", "Invalid pass"
