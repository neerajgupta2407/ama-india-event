from django.db import models

from core.models import UUIDBaseModel
from events.choices import Currency
from events.models import Event, TicketCategory
from registrations.choices import (
    DELEGATE_NUMBERS,
    DelegateCount,
    MemberValidation,
    RegistrationStatus,
)


class Registration(UUIDBaseModel):
    """
    One registration request. Never soft-deleted: cancel it by status instead,
    because payments and invoices will reference it.
    """

    public_id = models.CharField(max_length=30, unique=True, editable=False)
    event = models.ForeignKey(
        Event, on_delete=models.PROTECT, related_name="registrations"
    )
    ticket_category = models.ForeignKey(
        TicketCategory, on_delete=models.PROTECT, related_name="registrations"
    )
    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.REQUESTED,
    )
    member_validation = models.CharField(
        max_length=20,
        choices=MemberValidation.choices,
        default=MemberValidation.NOT_REQUIRED,
    )

    full_name = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, blank=True)
    # The AMAI member organisation named by a member delegate. Staff check it against the member list.
    membership = models.CharField(max_length=200, blank=True)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()
    delegates = models.CharField(max_length=20, choices=DelegateCount.choices)
    message = models.TextField(blank=True)
    # The other delegates, beyond the person registering: [{"name", "email", "phone", "designation"}].
    additional_delegates = models.JSONField(default=list, blank=True)

    # Price per participant at the time of the request (minor units).
    currency = models.CharField(max_length=3, choices=Currency.choices)
    quoted_base_minor = models.PositiveIntegerField()
    quoted_gst_minor = models.PositiveIntegerField()
    quoted_total_minor = models.PositiveIntegerField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event", "status"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"{self.public_id} {self.full_name}"

    @property
    def delegate_count(self):
        """Exact number of delegates, or None for "5 or more"."""
        return DELEGATE_NUMBERS[self.delegates]
