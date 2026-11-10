from django.conf import settings
from django.db import transaction

from core.email import send_email
from enquiries.models import Enquiry


class EnquiryService:
    @staticmethod
    @transaction.atomic
    def create_enquiry(*, data):
        enquiry = Enquiry.objects.create(**data)
        transaction.on_commit(lambda: EnquiryService.alert_staff(enquiry))
        return enquiry

    @staticmethod
    def alert_staff(enquiry):
        body = (
            "A new enquiry was received through the conference website.\n\n"
            f"Name: {enquiry.name}\n"
            f"Company: {enquiry.company_name}\n"
            f"Mobile: {enquiry.mobile}\n"
            f"Email: {enquiry.email}\n\n"
            f"Message:\n{enquiry.message}\n"
        )
        return send_email(
            subject="New website enquiry",
            body=body,
            recipients=settings.STAFF_ALERT_EMAILS,
        )
