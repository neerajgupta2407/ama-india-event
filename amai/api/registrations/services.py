from django.conf import settings
from django.db import transaction

from core.email import send_email
from events.models import Event
from events.services import PricingService
from registrations.choices import MemberValidation
from registrations.models import Registration


class RegistrationService:
    @staticmethod
    @transaction.atomic
    def create_request(*, event, category, data, notify=True):
        """
        Create a registration request. The price is taken from the category on
        the server, and the next registration number is allocated under a row
        lock so two simultaneous requests can never share an ID.
        """
        locked = Event.objects.select_for_update().get(pk=event.pk)
        number = locked.registration_counter + 1
        Event.objects.filter(pk=locked.pk).update(registration_counter=number)

        quote = PricingService.quote(category)
        registration = Registration.objects.create(
            public_id=f"AMAI-{locked.registration_prefix}-{number:06d}",
            event=locked,
            ticket_category=category,
            member_validation=(
                MemberValidation.PENDING_REVIEW
                if category.requires_member_validation
                else MemberValidation.NOT_REQUIRED
            ),
            full_name=data["name"],
            company_name=data.get("company_name", ""),
            mobile=data["mobile"],
            email=data["email"],
            delegates=data["delegates"],
            message=data.get("message", ""),
            additional_delegates=data.get("additional_delegates", []),
            currency=quote.currency,
            quoted_base_minor=quote.base_minor,
            quoted_gst_minor=quote.gst_minor,
            quoted_total_minor=quote.total_minor,
        )
        if notify:
            transaction.on_commit(
                lambda: RegistrationService.send_notifications(registration)
            )
        return registration

    @staticmethod
    def send_notifications(registration, acknowledge=True):
        RegistrationService._alert_staff(registration)
        if acknowledge:
            RegistrationService._acknowledge(registration)

    @staticmethod
    def _alert_staff(registration):
        body = (
            f"New registration request {registration.public_id}.\n\n"
            f"Event: {registration.event.title}\n"
            f"Category: {registration.ticket_category.name}\n"
            f"Delegates: {registration.delegates}\n"
            f"Name: {registration.full_name}\n"
            f"Company: {registration.company_name}\n"
            f"Mobile: {registration.mobile}\n"
            f"Email: {registration.email}\n"
            f"Membership check: {registration.get_member_validation_display()}\n"
            f"{RegistrationService._delegate_lines(registration)}\n"
            f"Message:\n{registration.message}\n"
        )
        return send_email(
            subject=f"New registration request {registration.public_id}",
            body=body,
            recipients=settings.STAFF_ALERT_EMAILS,
        )

    @staticmethod
    def _delegate_lines(registration):
        if not registration.additional_delegates:
            return ""
        lines = "\nAdditional delegates:\n"
        for number, delegate in enumerate(registration.additional_delegates, start=2):
            lines += (
                f"{number}. {delegate['name']} | {delegate['email']} | "
                f"{delegate['designation']}\n"
            )
        return lines

    @staticmethod
    def _acknowledge(registration):
        body = (
            f"Dear {registration.full_name},\n\n"
            f"Thank you for your interest in the {registration.event.title}. "
            f"We have received your registration request, reference {registration.public_id}.\n\n"
            "The AMAI secretariat will contact you shortly to confirm your registration "
            "and share the payment details.\n\n"
            "Alkali Manufacturers Association of India\n"
        )
        return send_email(
            subject=f"We received your registration request {registration.public_id}",
            body=body,
            recipients=[registration.email],
        )
