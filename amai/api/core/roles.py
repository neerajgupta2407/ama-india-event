"""Dashboard roles. Each role is a Django group; superusers hold every role."""

OPS = "ops"
FINANCE = "finance"
MEMBERSHIP = "membership"
EVENT_ADMIN = "event_admin"
CHECKIN_OPERATOR = "checkin_operator"
VIEWER = "viewer"

ALL_ROLES = (OPS, FINANCE, MEMBERSHIP, EVENT_ADMIN, CHECKIN_OPERATOR, VIEWER)


def user_roles(user):
    """The dashboard roles a user holds (empty for anonymous, inactive or non-staff users)."""
    if not (user and user.is_authenticated and user.is_staff and user.is_active):
        return set()
    if user.is_superuser:
        return set(ALL_ROLES)
    return set(user.groups.filter(name__in=ALL_ROLES).values_list("name", flat=True))
