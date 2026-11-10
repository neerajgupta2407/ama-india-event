from django.urls import path

from registrations import staff_views
from registrations.views import RegistrationQuoteView, RegistrationRequestCreateView

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
        "staff/overview/",
        staff_views.StaffOverviewView.as_view(),
        name="staff-overview",
    ),
    path(
        "staff/registrations/",
        staff_views.StaffRegistrationListView.as_view(),
        name="staff-registration-list",
    ),
    # "export/" must come before the <public_id> routes or it would be read as an ID.
    path(
        "staff/registrations/export/",
        staff_views.StaffRegistrationExportView.as_view(),
        name="staff-registration-export",
    ),
    path(
        "staff/registrations/<str:public_id>/",
        staff_views.StaffRegistrationDetailView.as_view(),
        name="staff-registration-detail",
    ),
    path(
        "staff/registrations/<str:public_id>/member-review/",
        staff_views.StaffMemberReviewView.as_view(),
        name="staff-registration-member-review",
    ),
    path(
        "staff/registrations/<str:public_id>/refresh-payment/",
        staff_views.StaffRefreshPaymentView.as_view(),
        name="staff-registration-refresh-payment",
    ),
    path(
        "staff/registrations/<str:public_id>/resend-confirmation/",
        staff_views.StaffResendConfirmationView.as_view(),
        name="staff-registration-resend",
    ),
    path(
        "staff/registrations/<str:public_id>/confirm/",
        staff_views.StaffConfirmManuallyView.as_view(),
        name="staff-registration-confirm",
    ),
    path(
        "staff/registrations/<str:public_id>/cancel/",
        staff_views.StaffCancelRegistrationView.as_view(),
        name="staff-registration-cancel",
    ),
]
