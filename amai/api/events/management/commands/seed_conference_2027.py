from datetime import datetime
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.db import transaction

from events.choices import Audience, Currency, EventStatus
from events.models import Event, TicketCategory

IST = ZoneInfo("Asia/Kolkata")

CATEGORIES = [
    {
        "code": "member",
        "name": "Member Delegate",
        "description": "Employees of AMAI member companies. We verify your membership during registration.",
        "audience": Audience.MEMBER,
        "currency": Currency.INR,
        "base_amount_minor": 30_000_00,
        "gst_rate": "18.00",
        "requires_member_validation": True,
        "display_order": 1,
    },
    {
        "code": "non-member",
        "name": "Non-Member Delegate",
        "description": "Indian participants from non-member organisations.",
        "audience": Audience.NON_MEMBER,
        "currency": Currency.INR,
        "base_amount_minor": 35_000_00,
        "gst_rate": "18.00",
        "requires_member_validation": False,
        "display_order": 2,
    },
    {
        "code": "international",
        "name": "International Delegates",
        "description": "Participants from outside India. No GST applies.",
        "audience": Audience.INTERNATIONAL,
        "currency": Currency.USD,
        "base_amount_minor": 900_00,
        "gst_rate": "0.00",
        "requires_member_validation": False,
        "display_order": 3,
    },
]


class Command(BaseCommand):
    help = "Create or update the 12th AMAI Alkali Industry Conference 2027 and its fee categories."

    @transaction.atomic
    def handle(self, *args, **options):
        event, created = Event.objects.update_or_create(
            slug="alkali-industry-conference-2027",
            defaults={
                "title": "12th AMAI Alkali Industry Conference 2027",
                "starts_at": datetime(2027, 1, 28, 0, 0, tzinfo=IST),
                "ends_at": datetime(2027, 1, 29, 23, 59, tzinfo=IST),
                "venue": "Andaz by Hyatt, Aerocity",
                "city": "New Delhi",
                "status": EventStatus.OPEN,
                "registration_prefix": "AC27",
                # From the design: 10% early-bird and 10% for 3+ delegates. The early-bird
                # rule stays inactive until AMAI gives a cutoff date (early_bird_until).
                "early_bird_percent": "10.00",
                "group_discount_percent": "10.00",
                "group_min_delegates": 3,
            },
        )
        for category in CATEGORIES:
            TicketCategory.objects.update_or_create(
                event=event, code=category["code"], defaults=category
            )
        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} {event.title} with {len(CATEGORIES)} categories."
            )
        )
