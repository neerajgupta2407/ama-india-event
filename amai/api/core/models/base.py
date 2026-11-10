import uuid

from django.db import models

from django_softdelete.models import SoftDeleteModel


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class UUIDBaseModel(BaseModel):
    """Base model with UUID primary key and common fields."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SoftDeleteBaseModel(SoftDeleteModel):
    """
    Soft delete + common timestamp fields.

    NEVER use for financial records (Order, PaymentAttempt, WebhookEvent,
    Refund, AuditEvent): those must be permanent.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class SoftDeleteUUIDBaseModel(SoftDeleteModel):
    """UUID primary key + soft delete + common fields."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
