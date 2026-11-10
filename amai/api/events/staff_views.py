from rest_framework import generics
from rest_framework.response import Response

from audit.services import AuditService
from core.permissions import CanManageEvents, CanViewDashboard
from events.models import Event, TicketCategory
from events.staff_serializers import (
    StaffCategorySerializer,
    StaffEventSerializer,
    StaffEventSettingsSerializer,
)


def changed_fields(instance, validated_data):
    """{"field": {"before": ..., "after": ...}} for the values that actually change."""
    changes = {}
    for field, new in validated_data.items():
        old = getattr(instance, field)
        if old != new:
            changes[field] = {"before": str(old), "after": str(new)}
    return changes


class StaffEventListView(generics.ListAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = StaffEventSerializer
    pagination_class = None
    queryset = Event.objects.prefetch_related("categories", "registrations")


class StaffEventDetailView(generics.RetrieveAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = StaffEventSerializer
    lookup_field = "slug"
    queryset = Event.objects.prefetch_related("categories", "registrations")


class StaffEventSettingsView(generics.GenericAPIView):
    permission_classes = [CanManageEvents]
    serializer_class = StaffEventSettingsSerializer
    lookup_field = "slug"
    queryset = Event.objects.all()

    def patch(self, request, slug):
        event = self.get_object()
        serializer = self.get_serializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changes = changed_fields(event, serializer.validated_data)
        serializer.save()
        if changes:
            AuditService.record(
                actor=request.user, action="event.settings", obj=event, data=changes
            )
        return Response(StaffEventSerializer(self.get_queryset().get(pk=event.pk)).data)


class StaffCategoryUpdateView(generics.GenericAPIView):
    """Change a fee. Orders already created keep the amount they were created with."""

    permission_classes = [CanManageEvents]
    serializer_class = StaffCategorySerializer
    queryset = TicketCategory.objects.select_related("event")

    def patch(self, request, pk):
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        changes = changed_fields(category, serializer.validated_data)
        serializer.save()
        if changes:
            AuditService.record(
                actor=request.user,
                action="category.update",
                obj=category,
                data={
                    "event": category.event.slug,
                    "category": category.code,
                    **changes,
                },
            )
        return Response(StaffCategorySerializer(category).data)
