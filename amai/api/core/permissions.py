"""DRF permission classes. Views declare these in permission_classes and never check permissions by hand."""

from rest_framework.permissions import BasePermission


class IsStaffRole(BasePermission):
    """Staff dashboard access. Role-specific classes (finance, ops, ...) extend this."""

    message = "Staff access required."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )
