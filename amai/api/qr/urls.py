from django.urls import path

from qr.views import (
    PublicPassView,
    StaffCheckInRecentView,
    StaffCheckInSearchView,
    StaffCheckInView,
)

urlpatterns = [
    path("passes/<str:token>/", PublicPassView.as_view(), name="public-pass"),
    path("staff/checkin/", StaffCheckInView.as_view(), name="staff-checkin"),
    path(
        "staff/checkin/search/",
        StaffCheckInSearchView.as_view(),
        name="staff-checkin-search",
    ),
    path(
        "staff/checkin/recent/",
        StaffCheckInRecentView.as_view(),
        name="staff-checkin-recent",
    ),
]
