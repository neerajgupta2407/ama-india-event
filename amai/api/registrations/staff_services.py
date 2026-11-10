import csv
from io import StringIO

from django.db import transaction
from django.utils import timezone

from audit.services import AuditService
from core.email import send_email
from core.exceptions import Conflict, UpstreamUnavailable
from payments.choices import OrderStatus
from payments.providers.base import ProviderError
from payments.services import OPEN_STATUSES, PaymentService
from qr.services import PassService
from registrations.choices import MemberValidation, RegistrationStatus
from registrations.services import RegistrationService

MEMBER_DECISIONS = {
    "verified": MemberValidation.VERIFIED,
    "rejected": MemberValidation.REJECTED,
}


class StaffRegistrationService:
    @staticmethod
    @transaction.atomic
    def review_member(registration, decision, actor):
        if registration.member_validation != MemberValidation.PENDING_REVIEW:
            raise Conflict(
                "Only registrations waiting for a membership check can be reviewed."
            )
        before = registration.member_validation
        registration.member_validation = MEMBER_DECISIONS[decision]
        registration.save(update_fields=["member_validation", "updated_at"])
        AuditService.record(
            actor=actor,
            action="registration.member_review",
            obj=registration,
            data={"before": before, "after": registration.member_validation},
        )
        return registration

    @staticmethod
    def refresh_payment(registration, actor):
        """Ask the payment provider about the latest order and apply what it says."""
        order = registration.orders.order_by("-created_at").first()
        if order is None:
            raise Conflict("This registration has no online payment to check.")
        before = order.status
        if order.status in OPEN_STATUSES:
            try:
                order = PaymentService.refresh_from_provider(order)
            except ProviderError as error:
                raise UpstreamUnavailable() from error
        AuditService.record(
            actor=actor,
            action="payment.refresh",
            obj=registration,
            data={"order": order.reference, "before": before, "after": order.status},
        )
        return order

    @staticmethod
    @transaction.atomic
    def resend_confirmation(registration, actor):
        """Confirmed: a fresh pass link (the old one stops working). Otherwise: the acknowledgement."""
        if registration.status == RegistrationStatus.CANCELLED:
            raise Conflict("This registration is cancelled.")
        if registration.status == RegistrationStatus.CONFIRMED:
            _, token = PassService.issue(registration, admits=None)
            transaction.on_commit(
                lambda: StaffRegistrationService._send_confirmation(registration, token)
            )
            kind = "confirmation"
        else:
            transaction.on_commit(
                lambda: RegistrationService._acknowledge(registration)
            )
            kind = "acknowledgement"
        AuditService.record(
            actor=actor,
            action="registration.resend",
            obj=registration,
            data={"kind": kind},
        )
        return kind

    @staticmethod
    @transaction.atomic
    def confirm_manually(registration, actor, note, admits=None):
        """For payments taken outside the website (bank transfer, "5 or more" delegates)."""
        if registration.status not in (
            RegistrationStatus.REQUESTED,
            RegistrationStatus.PENDING_PAYMENT,
        ):
            raise Conflict(
                "Only requested or pending registrations can be confirmed by hand."
            )
        if registration.orders.filter(status=OrderStatus.PAID).exists():
            raise Conflict("This registration is already paid online.")
        admits = admits or registration.delegate_count
        if not admits:
            raise Conflict("Say how many people this registration admits.")
        registration.status = RegistrationStatus.CONFIRMED
        registration.save(update_fields=["status", "updated_at"])
        _, token = PassService.issue(registration, admits=admits)
        transaction.on_commit(
            lambda: StaffRegistrationService._send_confirmation(registration, token)
        )
        AuditService.record(
            actor=actor,
            action="registration.confirm_manually",
            obj=registration,
            data={"note": note, "admits": admits},
        )
        return registration

    @staticmethod
    @transaction.atomic
    def cancel(registration, actor, reason):
        if registration.status == RegistrationStatus.CANCELLED:
            raise Conflict("This registration is already cancelled.")
        if registration.orders.filter(status=OrderStatus.PAID).exists():
            raise Conflict(
                "This registration has been paid online. Refund it with the payment provider first."
            )
        registration.status = RegistrationStatus.CANCELLED
        registration.save(update_fields=["status", "updated_at"])
        attendee_pass = getattr(registration, "attendee_pass", None)
        if attendee_pass is not None and attendee_pass.revoked_at is None:
            attendee_pass.revoked_at = timezone.now()
            attendee_pass.save(update_fields=["revoked_at", "updated_at"])
        AuditService.record(
            actor=actor,
            action="registration.cancel",
            obj=registration,
            data={"reason": reason},
        )
        return registration

    @staticmethod
    def _send_confirmation(registration, token):
        return send_email(
            subject=f"Your registration {registration.public_id} is confirmed",
            body=(
                f"Dear {registration.full_name},\n\n"
                f"Your registration {registration.public_id} for the {registration.event.title} is confirmed.\n\n"
                f"Your entry pass (show it at the venue): {PassService.pass_url(token)}\n\n"
                "Alkali Manufacturers Association of India\n"
            ),
            recipients=[registration.email],
        )


def _safe_cell(value):
    """Spreadsheet formula injection: a cell that starts with = + - @ is read as a formula."""
    text = "" if value is None else str(value)
    return f"'{text}" if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


def build_registrations_csv(registrations):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Registration",
            "Event",
            "Category",
            "Status",
            "Membership check",
            "Name",
            "Company",
            "Mobile",
            "Email",
            "Delegates",
            "Currency",
            "Order",
            "Payment status",
            "Amount (order total)",
            "Created",
        ]
    )
    for r in registrations:
        order = next(iter(r.orders.all()), None)
        writer.writerow(
            [
                _safe_cell(v)
                for v in (
                    r.public_id,
                    r.event.slug,
                    r.ticket_category.code,
                    r.status,
                    r.member_validation,
                    r.full_name,
                    r.company_name,
                    r.mobile,
                    r.email,
                    r.delegates,
                    r.currency,
                    order.reference if order else "",
                    order.status if order else "",
                    f"{order.amount_minor / 100:.2f}" if order else "",
                    r.created_at.isoformat(timespec="seconds"),
                )
            ]
        )
    return buffer.getvalue()
