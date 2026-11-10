"""DRF permission classes. Views declare these in permission_classes and never check roles by hand."""

from rest_framework.permissions import BasePermission

from core import roles


class RolePermission(BasePermission):
    """Allows staff who hold at least one of `allowed_roles` (superusers hold all)."""

    allowed_roles: tuple = ()
    message = "You do not have permission to do this."

    def has_permission(self, request, view):
        return bool(roles.user_roles(request.user) & set(self.allowed_roles))


class IsStaffRole(RolePermission):
    """Any dashboard role, including check-in operators. Use for 'who am I' style endpoints."""

    allowed_roles = roles.ALL_ROLES


class CanViewDashboard(RolePermission):
    """Reading registrations, payments and enquiries. Check-in operators are excluded on purpose."""

    allowed_roles = (
        roles.OPS,
        roles.FINANCE,
        roles.MEMBERSHIP,
        roles.EVENT_ADMIN,
        roles.VIEWER,
    )


class CanManageRegistrations(RolePermission):
    allowed_roles = (roles.OPS,)


class CanReviewMembers(RolePermission):
    allowed_roles = (roles.MEMBERSHIP, roles.OPS)


class CanManageFinance(RolePermission):
    allowed_roles = (roles.FINANCE,)


class CanExport(RolePermission):
    allowed_roles = (roles.OPS, roles.FINANCE)


class CanCheckIn(RolePermission):
    allowed_roles = (roles.CHECKIN_OPERATOR, roles.OPS)


class CanManageEvents(RolePermission):
    allowed_roles = (roles.EVENT_ADMIN,)
