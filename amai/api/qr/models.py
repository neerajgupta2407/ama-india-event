from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import UUIDBaseModel
from registrations.models import Registration


class AttendeePass(UUIDBaseModel):
    """
    The entry pass for one confirmed registration. The secret token appears only in the
    link we email; the database holds its SHA-256 hash. `admits` is how many people the
    registration covers, so a company that paid for 3 delegates is admitted 3 times.
    """

    registration = models.OneToOneField(
        Registration, on_delete=models.PROTECT, related_name="attendee_pass"
    )
    token_hash = models.CharField(max_length=64, unique=True)
    admits = models.PositiveSmallIntegerField(default=1)
    issued_at = models.DateTimeField(default=timezone.now)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Pass for {self.registration.public_id}"


class CheckIn(UUIDBaseModel):
    """One person admitted. created_at is the moment they were scanned in."""

    attendee_pass = models.ForeignKey(
        AttendeePass, on_delete=models.PROTECT, related_name="check_ins"
    )
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    operator_label = models.CharField(max_length=254, blank=True)
    gate = models.CharField(max_length=40, blank=True)

    class Meta:
        ordering = ["-created_at"]
