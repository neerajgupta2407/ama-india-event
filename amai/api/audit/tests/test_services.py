from django.test import TestCase

from model_bakery import baker

from audit.models import AuditEvent
from audit.services import AuditService
from core.tests.helpers import make_staff
from enquiries.models import Enquiry


class AuditServiceTests(TestCase):
    def test_records_who_what_and_which_object(self):
        actor = make_staff("ops")
        enquiry = baker.make(Enquiry)

        AuditService.record(
            actor=actor, action="enquiry.status", obj=enquiry, data={"after": "closed"}
        )

        event = AuditEvent.objects.get()
        self.assertEqual(actor, event.actor)
        self.assertEqual(actor.email, event.actor_label)
        self.assertEqual("Enquiry", event.object_type)
        self.assertEqual(str(enquiry.pk), event.object_id)
        self.assertEqual({"after": "closed"}, event.data)

    def test_the_actor_label_survives_deleting_the_account(self):
        actor = make_staff("ops")
        email = actor.email
        AuditService.record(actor=actor, action="x")

        actor.delete()

        event = AuditEvent.objects.get()
        self.assertIsNone(event.actor)
        self.assertEqual(email, event.actor_label)

    def test_a_system_action_has_no_actor(self):
        AuditService.record(actor=None, action="system.job")

        self.assertEqual("", AuditEvent.objects.get().actor_label)

    def test_for_object_returns_only_that_objects_events_newest_first(self):
        mine, other = baker.make(Enquiry), baker.make(Enquiry)
        AuditService.record(actor=None, action="first", obj=mine)
        AuditService.record(actor=None, action="second", obj=mine)
        AuditService.record(actor=None, action="elsewhere", obj=other)

        self.assertEqual(
            ["second", "first"], [e.action for e in AuditService.for_object(mine)]
        )
