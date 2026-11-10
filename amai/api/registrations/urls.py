from django.urls import path

from registrations.views import (
    RegistrationQuoteView,
    RegistrationRequestCreateView,
    StaffRegistrationDetailView,
    StaffRegistrationListView,
)

urlpatterns = [
    path(
        "registrations/requests/",
        RegistrationRequestCreateView.as_view(),
        name="registration-request-create",
    ),
    path(
        "registrations/quote/",
        RegistrationQuoteView.as_view(),
        name="registration-quote",
    ),
    path(
        "staff/registrations/",
        StaffRegistrationListView.as_view(),
        name="staff-registration-list",
    ),
    path(
        "staff/registrations/<uuid:pk>/",
        StaffRegistrationDetailView.as_view(),
        name="staff-registration-detail",
    ),
]
