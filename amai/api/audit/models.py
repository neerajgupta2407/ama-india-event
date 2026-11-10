from django.conf import settings
from django.db import models

from core.models import UUIDBaseModel


class AuditEvent(UUIDBaseModel):
    """
    Who did what, and when, for staff actions. Append-only: never edited or soft-deleted.
    The actor's email is copied in, so the record stays readable if the account is removed.
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    actor_label = models.CharField(max_length=254, blank=True)
    action = models.CharField(max_length=60)
    object_type = models.CharField(max_length=60, blank=True)
    object_id = models.CharField(max_length=64, blank=True)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["object_type", "object_id"])]

    def __str__(self):
        return f"{self.action} by {self.actor_label or 'system'}"
