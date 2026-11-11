from io import StringIO
from unittest.mock import MagicMock, patch

from django.core import mail
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from brevo_python.rest import ApiException

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


@override_settings(
    USE_BREVO_EMAIL=True,
    BREVO_API_KEY="test-key",
    BREVO_SENDER_NAME="AMAI Events",
    DEFAULT_FROM_EMAIL="events@example.test",
)
class BrevoSendingDetailsTests(TestCase):
    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_replies_go_to_the_secretariat_when_a_reply_to_is_configured(
        self, api_class
    ):
        api = api_class.return_value
        api.send_transac_email.return_value = MagicMock(message_id="m-1")

        with override_settings(EMAIL_REPLY_TO="desk@example.test"):
            send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        message = api.send_transac_email.call_args.args[0]
        self.assertEqual("desk@example.test", message.reply_to.email)
        self.assertEqual("events@example.test", message.sender.email)
        self.assertEqual("AMAI Events", message.sender.name)

    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_no_reply_to_is_sent_when_none_is_configured(self, api_class):
        api = api_class.return_value
        api.send_transac_email.return_value = MagicMock(message_id="m-1")

        send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        self.assertIsNone(api.send_transac_email.call_args.args[0].reply_to)

    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_every_call_has_a_timeout_so_a_slow_provider_cannot_hang_a_request(
        self, api_class
    ):
        api = api_class.return_value
        api.send_transac_email.return_value = MagicMock(message_id="m-1")

        send_email(subject="Hi", body="Body", recipients=["a@example.com"])
        with override_settings(BREVO_TIMEOUT_SECONDS=3):
            send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        timeouts = [
            call.kwargs["_request_timeout"]
            for call in api.send_transac_email.call_args_list
        ]
        self.assertEqual([10, 3], timeouts)

    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_one_failing_recipient_does_not_stop_the_others(self, api_class):
        api = api_class.return_value
        api.send_transac_email.side_effect = [
            TimeoutError("slow"),
            MagicMock(message_id="m-2"),
        ]

        with self.assertLogs("core.email", level="ERROR"):
            sent = send_email(
                subject="Hi", body="Body", recipients=["a@example.com", "b@example.com"]
            )

        self.assertTrue(sent)
        self.assertEqual(2, api.send_transac_email.call_count)
        self.assertEqual(
            "b@example.com",
            api.send_transac_email.call_args_list[1].args[0].to[0].email,
        )

    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_a_timeout_on_every_recipient_reports_failure_without_raising(
        self, api_class
    ):
        api_class.return_value.send_transac_email.side_effect = TimeoutError("slow")

        with self.assertLogs("core.email", level="ERROR"):
            sent = send_email(subject="Hi", body="Body", recipients=["a@example.com"])

        self.assertFalse(sent)


class SendTestEmailCommandTests(TestCase):
    def run_command(self, recipient="me@example.com"):
        out = StringIO()
        call_command("send_test_email", recipient, stdout=out)
        return out.getvalue()

    def test_reports_success_with_the_provider_and_sender_in_use(self):
        output = self.run_command()

        self.assertIn("Provider: Django", output)
        self.assertIn("Accepted by the provider", output)
        self.assertEqual(["me@example.com"], mail.outbox[0].to)
        self.assertEqual("AMAI test email", mail.outbox[0].subject)

    @override_settings(TEST_TO_EMAIL="qa@example.com", ENVIRONMENT="staging")
    def test_warns_when_staging_redirects_the_message(self):
        output = self.run_command("real.person@example.com")

        self.assertIn("TEST_TO_EMAIL is set", output)
        self.assertEqual(["qa@example.com"], mail.outbox[0].to)

    @override_settings(USE_BREVO_EMAIL=True, BREVO_API_KEY="test-key")
    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_uses_brevo_when_it_is_switched_on(self, api_class):
        api_class.return_value.send_transac_email.return_value = MagicMock(
            message_id="m-1"
        )

        output = self.run_command()

        self.assertIn("Provider: Brevo", output)
        self.assertEqual(1, api_class.return_value.send_transac_email.call_count)

    @override_settings(USE_BREVO_EMAIL=True, BREVO_API_KEY="test-key")
    @patch("core.brevo_service.brevo_python.TransactionalEmailsApi")
    def test_fails_loudly_when_the_provider_refuses(self, api_class):
        api_class.return_value.send_transac_email.side_effect = ApiException(
            status=401, reason="Unauthorized"
        )

        with self.assertLogs("core.brevo_service", level="ERROR"):
            with self.assertRaises(CommandError) as raised:
                self.run_command()

        self.assertIn("not authorised in Brevo", str(raised.exception))
