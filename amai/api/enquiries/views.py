from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.mixins import HoneypotMixin
from core.permissions import IsStaffRole
from core.throttles import EnquiryRateThrottle
from enquiries.filters import EnquiryFilter
from enquiries.models import Enquiry
from enquiries.serializers import EnquiryCreateSerializer, EnquirySerializer
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
    permission_classes = [IsStaffRole]
    serializer_class = EnquirySerializer
    queryset = Enquiry.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_class = EnquiryFilter


class StaffEnquiryDetailView(generics.RetrieveAPIView):
    permission_classes = [IsStaffRole]
    serializer_class = EnquirySerializer
    queryset = Enquiry.objects.all()
