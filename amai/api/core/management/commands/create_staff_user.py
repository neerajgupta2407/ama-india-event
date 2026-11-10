from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from core.roles import ALL_ROLES

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Create or update a dashboard staff user and give them roles. The password is never "
        "taken on the command line; set it afterwards with `manage.py changepassword <email>`."
    )

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("--name", default="")
        parser.add_argument(
            "--roles", default="viewer", help=f"Comma separated: {', '.join(ALL_ROLES)}"
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        wanted = [r.strip() for r in options["roles"].split(",") if r.strip()]
        unknown = set(wanted) - set(ALL_ROLES)
        if unknown:
            raise CommandError(f"Unknown roles: {', '.join(sorted(unknown))}")
        user, created = User.objects.get_or_create(
            username=email, defaults={"email": email, "is_staff": True}
        )
        user.email = email
        user.is_staff = True
        user.is_active = True
        if options["name"]:
            first, _, last = options["name"].partition(" ")
            user.first_name, user.last_name = first, last
        if created:
            user.set_unusable_password()
        user.save()
        user.groups.set(Group.objects.filter(name__in=wanted))
        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} {email} with roles: {', '.join(wanted)}")
        )
        if created:
            self.stdout.write(f"Now set a password: manage.py changepassword {email}")
