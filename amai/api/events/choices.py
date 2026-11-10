from django.db import models


class EventStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    OPEN = "open", "Open for registration"
    CLOSED = "closed", "Closed"
    ARCHIVED = "archived", "Archived"


class Audience(models.TextChoices):
    MEMBER = "member", "Member"
    NON_MEMBER = "non_member", "Non-member"
    INTERNATIONAL = "international", "International"


class Currency(models.TextChoices):
    INR = "INR", "Indian rupee"
    USD = "USD", "US dollar"
