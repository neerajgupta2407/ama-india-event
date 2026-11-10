from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from model_bakery import baker

User = get_user_model()


def make_staff(*role_names, superuser=False):
    """A dashboard user holding the given roles."""
    user = baker.make(
        User,
        username=f"staff-{User.objects.count()}@example.com",
        email=f"staff-{User.objects.count()}@example.com",
        is_staff=True,
        is_superuser=superuser,
    )
    for name in role_names:
        group, _ = Group.objects.get_or_create(name=name)
        user.groups.add(group)
    return user
