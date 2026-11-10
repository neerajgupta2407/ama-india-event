from django.urls import path

from events import staff_views
from events.views import EventDetailView

urlpatterns = [
    path("events/<slug:slug>/", EventDetailView.as_view(), name="event-detail"),
    path(
        "staff/events/",
        staff_views.StaffEventListView.as_view(),
        name="staff-event-list",
    ),
    path(
        "staff/events/<slug:slug>/",
        staff_views.StaffEventDetailView.as_view(),
        name="staff-event-detail",
    ),
    path(
        "staff/events/<slug:slug>/settings/",
        staff_views.StaffEventSettingsView.as_view(),
        name="staff-event-settings",
    ),
    path(
        "staff/ticket-categories/<uuid:pk>/",
        staff_views.StaffCategoryUpdateView.as_view(),
        name="staff-category-update",
    ),
]
