from django.core.management import call_command
from django.test import TestCase

from events.choices import EventStatus
from events.models import Event


class SeedConference2027Tests(TestCase):
    def test_creates_event_with_three_categories(self):
        call_command("seed_conference_2027")

        event = Event.objects.get(slug="alkali-industry-conference-2027")
        self.assertEqual(EventStatus.OPEN, event.status)
        self.assertEqual(
            {"member": 30_000_00, "non-member": 35_000_00, "international": 900_00},
            {c.code: c.base_amount_minor for c in event.categories.all()},
        )

    def test_is_idempotent_and_keeps_the_registration_counter(self):
        call_command("seed_conference_2027")
        Event.objects.filter(slug="alkali-industry-conference-2027").update(
            registration_counter=7
        )

        call_command("seed_conference_2027")

        event = Event.objects.get(slug="alkali-industry-conference-2027")
        self.assertEqual(7, event.registration_counter)
        self.assertEqual(3, event.categories.count())
