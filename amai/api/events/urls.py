from django.urls import path

from events.views import EventDetailView

urlpatterns = [
    path("events/<slug:slug>/", EventDetailView.as_view(), name="event-detail"),
]
