from unittest.mock import MagicMock, patch

from django.core import mail
from django.test import TestCase, override_settings

from core.email import send_email


class SendEmailDjangoBackendTests(TestCase):
    def test_sends_through_django_backend_by_default(self):
        sent = send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        self.assertTrue(sent)
        self.assertEqual(["a@example.com"], mail.outbox[0].to)

    def test_returns_false_without_recipients(self):
        self.assertFalse(send_email(subject="Hi", body="Body", recipients=["", None]))
        self.assertEqual(0, len(mail.outbox))

    @override_settings(TEST_TO_EMAIL="qa@example.com", ENVIRONMENT="staging")
    def test_non_production_redirects_to_test_inbox(self):
        send_email(subject="Hello", body="Body", recipients=["real@example.com"])

        self.assertEqual(["qa@example.com"], mail.outbox[0].to)
        self.assertEqual("[To: real@example.com] Hello", mail.outbox[0].subject)

    @override_settings(TEST_TO_EMAIL="qa@example.com", ENVIRONMENT="production")
    def test_production_never_redirects(self):
        send_email(subject="Hello", body="Body", recipients=["real@example.com"])

        self.assertEqual(["real@example.com"], mail.outbox[0].to)


@override_settings(
    USE_BREVO_EMAIL=True, BREVO_API_KEY="test-key", BREVO_SENDER_NAME="AMAI"
)
class SendEmailBrevoTests(TestCase):
    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_sends_one_message_per_recipient_through_brevo(self, api_class):
        api = api_class.return_value
        api.send_transac_email.return_value = MagicMock(message_id="m-1")

        sent = send_email(
            subject="Hi", body="Body", recipients=["a@example.com", "b@example.com"]
        )

        self.assertTrue(sent)
        self.assertEqual(2, api.send_transac_email.call_count)
        message = api.send_transac_email.call_args_list[0].args[0]
        self.assertEqual("Hi", message.subject)
        self.assertEqual("Body", message.text_content)
        self.assertEqual("a@example.com", message.to[0].email)
        self.assertEqual("AMAI", message.sender.name)
        self.assertEqual(0, len(mail.outbox))

    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_brevo_api_error_returns_false_without_raising(self, api_class):
        from brevo_python.rest import ApiException

        api_class.return_value.send_transac_email.side_effect = ApiException(
            status=401, reason="Unauthorized"
        )

        with self.assertLogs("core.brevo_service", level="ERROR"):
            sent = send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        self.assertFalse(sent)

    @override_settings(BREVO_API_KEY="")
    def test_missing_api_key_is_logged_and_does_not_raise(self):
        with self.assertLogs("core.email", level="ERROR"):
            sent = send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        self.assertFalse(sent)
