from django.test import TestCase
from django.urls import reverse

from model_bakery import baker
from rest_framework.test import APIClient

from events.choices import EventStatus
from events.models import Event, TicketCategory


class EventDetailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.event = baker.make(Event, slug="conf-2027", status=EventStatus.OPEN)
        baker.make(
            TicketCategory,
            event=self.event,
            code="member",
            base_amount_minor=30_000_00,
            display_order=1,
        )

    def test_returns_event_with_active_categories_only(self):
        baker.make(TicketCategory, event=self.event, code="hidden", is_active=False)

        response = self.client.get(
            reverse("event-detail", kwargs={"slug": "conf-2027"})
        )

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual("conf-2027", body["slug"])
        self.assertTrue(body["registration_open"])
        self.assertEqual(["member"], [c["code"] for c in body["categories"]])
        self.assertEqual(30_000_00, body["categories"][0]["base_amount_minor"])

    def test_draft_event_is_not_found(self):
        baker.make(Event, slug="draft-event", status=EventStatus.DRAFT)

        response = self.client.get(
            reverse("event-detail", kwargs={"slug": "draft-event"})
        )

        self.assertEqual(404, response.status_code)

    def test_closed_event_is_visible_but_not_open(self):
        baker.make(Event, slug="old-event", status=EventStatus.CLOSED)

        response = self.client.get(
            reverse("event-detail", kwargs={"slug": "old-event"})
        )

        self.assertEqual(200, response.status_code)
        self.assertFalse(response.json()["registration_open"])
