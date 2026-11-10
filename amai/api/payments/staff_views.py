from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.response import Response

from core.pagination import StaffPagination
from core.permissions import CanManageFinance, CanViewDashboard
from payments.models import Order, ReconciliationRun
from payments.reconciliation import ReconciliationService
from payments.staff_filters import OrderFilter
from payments.staff_serializers import (
    ReconciliationRunSerializer,
    StaffOrderRowSerializer,
)


class StaffOrderListView(generics.ListAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = StaffOrderRowSerializer
    pagination_class = StaffPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_queryset(self):
        return Order.objects.select_related("registration__event").prefetch_related(
            "attempts"
        )


class StaffReconciliationView(generics.GenericAPIView):
    """The last few runs, newest first. The first one carries the live exception list."""

    permission_classes = [CanViewDashboard]

    def get(self, request):
        runs = ReconciliationRun.objects.all()[:10]
        return Response(ReconciliationRunSerializer(runs, many=True).data)


class StaffReconciliationRunView(generics.GenericAPIView):
    permission_classes = [CanManageFinance]

    def post(self, request):
        run = ReconciliationService.run(
            actor=request.user, event_slug=request.data.get("event") or None
        )
        return Response(
            ReconciliationRunSerializer(run).data, status=status.HTTP_201_CREATED
        )
