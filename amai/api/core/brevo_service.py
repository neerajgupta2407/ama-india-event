import logging

from django.conf import settings

import brevo_python
from brevo_python.models import (
    SendSmtpEmail,
    SendSmtpEmailReplyTo,
    SendSmtpEmailSender,
    SendSmtpEmailTo,
)
from brevo_python.rest import ApiException

logger = logging.getLogger(__name__)


class BrevoService:
    """Thin wrapper around Brevo's transactional email API."""

    def __init__(self):
        api_key = getattr(settings, "BREVO_API_KEY", "")
        if not api_key:
            raise ValueError("BREVO_API_KEY not configured in settings")
        configuration = brevo_python.Configuration()
        configuration.api_key["api-key"] = api_key
        self.email_api = brevo_python.TransactionalEmailsApi(
            brevo_python.ApiClient(configuration)
        )

    def send_email(
        self, *, subject, recipient_email, text_content=None, html_content=None
    ):
        """Returns True when Brevo accepted the message."""
        if not text_content and not html_content:
            raise ValueError("Either text_content or html_content must be provided")
        params = {
            "sender": SendSmtpEmailSender(
                name=settings.BREVO_SENDER_NAME, email=settings.DEFAULT_FROM_EMAIL
            ),
            "to": [SendSmtpEmailTo(email=recipient_email)],
            "subject": subject,
        }
        if getattr(settings, "EMAIL_REPLY_TO", ""):
            params["reply_to"] = SendSmtpEmailReplyTo(email=settings.EMAIL_REPLY_TO)
        if text_content:
            params["text_content"] = text_content
        if html_content:
            params["html_content"] = html_content
        try:
            response = self.email_api.send_transac_email(
                SendSmtpEmail(**params), _request_timeout=settings.BREVO_TIMEOUT_SECONDS
            )
        except ApiException as error:
            # The body can echo personal data, so only the status is logged.
            logger.error("Brevo API error %s %s", error.status, error.reason)
            return False
        logger.info("Email accepted by Brevo (message_id: %s)", response.message_id)
        return True
