from django.urls import path

from enquiries.views import (
    EnquiryCreateView,
    StaffEnquiryDetailView,
    StaffEnquiryListView,
    StaffEnquiryStatusView,
)

urlpatterns = [
    path("enquiries/", EnquiryCreateView.as_view(), name="enquiry-create"),
    path("staff/enquiries/", StaffEnquiryListView.as_view(), name="staff-enquiry-list"),
    path(
        "staff/enquiries/<uuid:pk>/",
        StaffEnquiryDetailView.as_view(),
        name="staff-enquiry-detail",
    ),
    path(
        "staff/enquiries/<uuid:pk>/status/",
        StaffEnquiryStatusView.as_view(),
        name="staff-enquiry-status",
    ),
]
