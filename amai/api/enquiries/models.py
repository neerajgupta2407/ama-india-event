from django.db import models

from core.models import SoftDeleteUUIDBaseModel
from enquiries.choices import EnquiryStatus


class Enquiry(SoftDeleteUUIDBaseModel):
    name = models.CharField(max_length=200, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=EnquiryStatus.choices, default=EnquiryStatus.NEW
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "enquiries"

    def __str__(self):
        return f"{self.name or self.email} ({self.created_at:%Y-%m-%d})"
