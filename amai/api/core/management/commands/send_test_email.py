from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from core.email import send_email


class Command(BaseCommand):
    help = (
        "Send one test email through the configured provider, to check Brevo is set up "
        "(API key, authorised server IP, verified sender). Outside production, messages are "
        "redirected to TEST_TO_EMAIL when that is set."
    )

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Where to send the test message")

    def handle(self, *args, **options):
        provider = (
            "Brevo"
            if settings.USE_BREVO_EMAIL
            else f"Django ({settings.EMAIL_BACKEND.rsplit('.', 1)[-1]})"
        )
        redirected = settings.ENVIRONMENT != "production" and bool(
            settings.TEST_TO_EMAIL
        )
        self.stdout.write(f"Provider: {provider}")
        self.stdout.write(
            f"From: {settings.BREVO_SENDER_NAME} <{settings.DEFAULT_FROM_EMAIL}>"
        )
        self.stdout.write(f"Reply-To: {settings.EMAIL_REPLY_TO or '(none)'}")
        if redirected:
            self.stdout.write(
                self.style.WARNING(
                    "TEST_TO_EMAIL is set: the message goes there instead."
                )
            )

        sent = send_email(
            subject="AMAI test email",
            body=(
                "This is a test message from the AMAI events system.\n\n"
                f"Environment: {settings.ENVIRONMENT}\nProvider: {provider}\n\n"
                "If you can read this, email sending works.\n"
            ),
            recipients=[options["recipient"]],
        )
        if not sent:
            raise CommandError(
                "The provider did not accept the message. Check the log above: the usual causes are an "
                "API key that is missing, a server IP that is not authorised in Brevo, or a sender "
                "address that is not verified."
            )
        self.stdout.write(
            self.style.SUCCESS(
                "Accepted by the provider. Now check the inbox (and spam)."
            )
        )
