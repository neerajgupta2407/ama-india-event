import logging

from django.conf import settings
from django.core.mail import send_mail

from core.brevo_service import BrevoService

logger = logging.getLogger(__name__)


def send_email(*, subject, body, recipients):
    """
    Best-effort plain-text email. A mail failure must never fail the request that
    triggered it, so errors are logged (without the body, which holds personal data).
    Sends through Brevo when USE_BREVO_EMAIL is on, otherwise through Django's
    configured backend (console in development).
    Returns True when at least one message was handed to the provider.
    """
    recipients = [r for r in recipients if r]
    if not recipients:
        return False

    # Outside production, redirect everything to one inbox so test data never
    # reaches real people.
    if settings.ENVIRONMENT != "production" and settings.TEST_TO_EMAIL:
        original = ", ".join(recipients)
        subject = f"[To: {original}] {subject}"
        recipients = [settings.TEST_TO_EMAIL]

    try:
        if settings.USE_BREVO_EMAIL:
            service = BrevoService()
            results = [
                service.send_email(
                    subject=subject, recipient_email=recipient, text_content=body
                )
                for recipient in recipients
            ]
            return any(results)
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipients)
    except Exception:
        logger.exception("Could not send email %r", subject)
        return False
    return True
