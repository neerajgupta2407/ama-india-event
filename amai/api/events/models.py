from django.db import models
from django.utils import timezone

from core.models import UUIDBaseModel
from events.choices import Audience, Currency, EventStatus


class Event(UUIDBaseModel):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    venue = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20, choices=EventStatus.choices, default=EventStatus.DRAFT
    )
    registration_opens_at = models.DateTimeField(null=True, blank=True)
    registration_closes_at = models.DateTimeField(null=True, blank=True)
    # Registration IDs look like AMAI-{prefix}-{000123}.
    registration_prefix = models.CharField(max_length=10)
    registration_counter = models.PositiveIntegerField(default=0)

    # Online payment stays off until AMAI confirms the discount rules below.
    online_payment_enabled = models.BooleanField(default=False)
    # Percent off the base fee. Zero disables the rule.
    early_bird_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    early_bird_until = models.DateTimeField(null=True, blank=True)
    group_discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    group_min_delegates = models.PositiveSmallIntegerField(default=3)

    class Meta:
        ordering = ["-starts_at"]

    def __str__(self):
        return self.title

    def is_registration_open(self, at=None):
        at = at or timezone.now()
        if self.status != EventStatus.OPEN:
            return False
        if self.registration_opens_at and at < self.registration_opens_at:
            return False
        if self.registration_closes_at and at > self.registration_closes_at:
            return False
        return True


class TicketCategory(UUIDBaseModel):
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="categories"
    )
    code = models.SlugField()
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    audience = models.CharField(max_length=20, choices=Audience.choices)
    currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.INR
    )
    # Minor units: paise for INR, cents for USD. Money is never stored as a float.
    base_amount_minor = models.PositiveIntegerField()
    # Percent, e.g. 18.00. Zero for categories without GST.
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    requires_member_validation = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "ticket categories"
        constraints = [
            models.UniqueConstraint(
                fields=["event", "code"], name="unique_category_code_per_event"
            )
        ]

    def __str__(self):
        return f"{self.event.slug}: {self.name}"
