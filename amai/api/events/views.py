from django.db.models import Prefetch

from rest_framework import generics
from rest_framework.permissions import AllowAny

from events.choices import EventStatus
from events.models import Event, TicketCategory
from events.serializers import EventSerializer


class EventDetailView(generics.RetrieveAPIView):
    """Public event detail with live prices. Drafts and archived events are hidden."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = EventSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Event.objects.filter(
            status__in=[EventStatus.OPEN, EventStatus.CLOSED]
        ).prefetch_related(
            Prefetch(
                "categories",
                queryset=TicketCategory.objects.filter(is_active=True),
                to_attr="active_categories",
            )
        )
