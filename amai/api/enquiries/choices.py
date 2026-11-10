from django.db import models


class EnquiryStatus(models.TextChoices):
    NEW = "new", "New"
    CONTACTED = "contacted", "Contacted"
    CLOSED = "closed", "Closed"
