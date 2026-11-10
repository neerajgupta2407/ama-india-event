from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from audit.services import AuditService
from core.mixins import HoneypotMixin
from core.pagination import StaffPagination
from core.permissions import CanManageRegistrations, CanViewDashboard
from core.throttles import EnquiryRateThrottle
from enquiries.filters import EnquiryFilter
from enquiries.models import Enquiry
from enquiries.serializers import (
    EnquiryCreateSerializer,
    EnquirySerializer,
    EnquiryStatusSerializer,
)
from enquiries.services import EnquiryService


class EnquiryCreateView(HoneypotMixin, generics.GenericAPIView):
    """Public contact form. Accepts anonymous POSTs; rate-limited per IP."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [EnquiryRateThrottle]
    serializer_class = EnquiryCreateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if self.is_bot(serializer.validated_data):
            return Response({"status": "received"}, status=status.HTTP_201_CREATED)
        data = {k: v for k, v in serializer.validated_data.items() if k != "website"}
        enquiry = EnquiryService.create_enquiry(data=data)
        return Response(
            {"id": str(enquiry.id), "status": "received"},
            status=status.HTTP_201_CREATED,
        )


class StaffEnquiryListView(generics.ListAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = EnquirySerializer
    queryset = Enquiry.objects.all()
    pagination_class = StaffPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = EnquiryFilter


class StaffEnquiryDetailView(generics.RetrieveAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = EnquirySerializer
    queryset = Enquiry.objects.all()


class StaffEnquiryStatusView(generics.GenericAPIView):
    """Move an enquiry along: new, contacted, closed."""

    permission_classes = [CanManageRegistrations]
    serializer_class = EnquiryStatusSerializer
    queryset = Enquiry.objects.all()

    def patch(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enquiry = self.get_object()
        before = enquiry.status
        enquiry.status = serializer.validated_data["status"]
        enquiry.save(update_fields=["status", "updated_at"])
        AuditService.record(
            actor=request.user,
            action="enquiry.status",
            obj=enquiry,
            data={"before": before, "after": enquiry.status},
        )
        return Response(EnquirySerializer(enquiry).data)
