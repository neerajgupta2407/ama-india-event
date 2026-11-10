import hashlib
import re
import secrets
from dataclasses import dataclass
from urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from qr.choices import CheckInResult
from qr.models import AttendeePass, CheckIn
from registrations.choices import RegistrationStatus
from registrations.models import Registration


def hash_pass_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


class PassService:
    @staticmethod
    def pass_url(token):
        return f"{settings.SITE_URL}/c/?t={token}"

    @staticmethod
    @transaction.atomic
    def issue(registration, admits=None):
        """
        Create the pass, or give an existing one a fresh secret (the old link stops working).
        Returns (pass, plain_token); the token cannot be recovered later.
        """
        token = secrets.token_urlsafe(24)
        admits = admits or registration.delegate_count or 1
        attendee_pass, created = AttendeePass.objects.get_or_create(
            registration=registration,
            defaults={"token_hash": hash_pass_token(token), "admits": admits},
        )
        if not created:
            attendee_pass.token_hash = hash_pass_token(token)
            attendee_pass.revoked_at = None
            if admits:
                attendee_pass.admits = admits
            attendee_pass.save(
                update_fields=["token_hash", "revoked_at", "admits", "updated_at"]
            )
        return attendee_pass, token

    @staticmethod
    def find_by_token(token):
        return (
            AttendeePass.objects.select_related(
                "registration__event", "registration__ticket_category"
            )
            .filter(token_hash=hash_pass_token(token))
            .first()
        )


@dataclass
class CheckInOutcome:
    result: str
    registration: Registration | None = None
    attendee_pass: AttendeePass | None = None
    admitted: int = 0
    admits: int = 0
    last_checked_in_at: object = None


PUBLIC_ID = re.compile(r"^AMAI-[A-Z0-9]+-\d{3,}$", re.IGNORECASE)


def extract_code(raw):
    """A scanned QR holds the pass link; a hand-typed code is a token or a registration ID."""
    raw = (raw or "").strip()
    if raw.lower().startswith(("http://", "https://")):
        query = parse_qs(urlparse(raw).query)
        return (query.get("t") or [""])[0]
    return raw


class CheckInService:
    @staticmethod
    @transaction.atomic
    def check_in(*, code, operator, gate=""):
        code = extract_code(code)
        if not code:
            return CheckInOutcome(CheckInResult.INVALID)

        if PUBLIC_ID.match(code):
            registration = (
                Registration.objects.select_related(
                    "event", "ticket_category", "attendee_pass"
                )
                .filter(public_id=code.upper())
                .first()
            )
            attendee_pass = (
                getattr(registration, "attendee_pass", None) if registration else None
            )
            if registration is None:
                return CheckInOutcome(CheckInResult.INVALID)
        else:
            attendee_pass = PassService.find_by_token(code)
            if attendee_pass is None:
                return CheckInOutcome(CheckInResult.INVALID)
            registration = attendee_pass.registration

        if registration.status != RegistrationStatus.CONFIRMED or attendee_pass is None:
            return CheckInOutcome(CheckInResult.NOT_PAID, registration=registration)
        if attendee_pass.revoked_at:
            return CheckInOutcome(
                CheckInResult.REVOKED,
                registration=registration,
                attendee_pass=attendee_pass,
            )

        # Lock the pass so two gates scanning the same pass cannot both get the last entry.
        attendee_pass = AttendeePass.objects.select_for_update().get(
            pk=attendee_pass.pk
        )
        admitted = attendee_pass.check_ins.count()
        last = attendee_pass.check_ins.first()
        if admitted >= attendee_pass.admits:
            return CheckInOutcome(
                CheckInResult.ALREADY_CHECKED_IN,
                registration=registration,
                attendee_pass=attendee_pass,
                admitted=admitted,
                admits=attendee_pass.admits,
                last_checked_in_at=last.created_at if last else None,
            )
        CheckIn.objects.create(
            attendee_pass=attendee_pass,
            checked_in_by=operator if getattr(operator, "pk", None) else None,
            operator_label=getattr(operator, "email", "")
            or getattr(operator, "username", ""),
            gate=gate,
        )
        return CheckInOutcome(
            CheckInResult.OK,
            registration=registration,
            attendee_pass=attendee_pass,
            admitted=admitted + 1,
            admits=attendee_pass.admits,
            last_checked_in_at=timezone.now(),
        )

    @staticmethod
    def search(query, limit=20):
        """Manual lookup when a phone will not scan. Confirmed registrations only."""
        query = (query or "").strip()
        if len(query) < 2:
            return Registration.objects.none()
        return (
            Registration.objects.filter(status=RegistrationStatus.CONFIRMED)
            .filter(
                Q(public_id__icontains=query)
                | Q(full_name__icontains=query)
                | Q(company_name__icontains=query)
                | Q(mobile__icontains=query)
            )
            .select_related("ticket_category", "attendee_pass")
            .annotate(admitted_count=Count("attendee_pass__check_ins"))[:limit]
        )
