from django.urls import path

from core.views import (
    HealthView,
    StaffCsrfView,
    StaffLoginView,
    StaffLogoutView,
    StaffMeView,
)

urlpatterns = [
    path("healthz/", HealthView.as_view(), name="healthz"),
    path("api/staff/auth/csrf/", StaffCsrfView.as_view(), name="staff-csrf"),
    path("api/staff/auth/login/", StaffLoginView.as_view(), name="staff-login"),
    path("api/staff/auth/logout/", StaffLogoutView.as_view(), name="staff-logout"),
    path("api/staff/auth/me/", StaffMeView.as_view(), name="staff-me"),
]
