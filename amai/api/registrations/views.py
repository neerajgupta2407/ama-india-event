from django.db import transaction

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.mixins import HoneypotMixin
from core.permissions import IsStaffRole
from core.throttles import QuoteRateThrottle, RegistrationRateThrottle
from events.services import PricingService
from payments.services import PaymentService
from registrations.choices import DELEGATE_NUMBERS
from registrations.filters import RegistrationFilter
from registrations.models import Registration
from registrations.serializers import (
    QuoteRequestSerializer,
    RegistrationReceiptSerializer,
    RegistrationRequestSerializer,
    RegistrationSerializer,
)
from registrations.services import RegistrationService


class RegistrationRequestCreateView(HoneypotMixin, generics.GenericAPIView):
    """Public registration request. Accepts anonymous POSTs; rate-limited per IP."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [RegistrationRateThrottle]
    serializer_class = RegistrationRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if self.is_bot(data):
            return Response({"status": "received"}, status=status.HTTP_201_CREATED)
        registration = RegistrationService.create_request(
            event=data["event_obj"],
            category=data["category_obj"],
            data=data,
            notify=False,
        )
        started = PaymentService.start_payment(registration)
        registration.refresh_from_db()
        # With online payment the visitor is sent to pay and gets receipts after paying,
        # so the "secretariat will contact you" acknowledgement is only for manual follow-up.
        transaction.on_commit(
            lambda: RegistrationService.send_notifications(
                registration, acknowledge=started is None
            )
        )
        body = dict(RegistrationReceiptSerializer(registration).data)
        body["payment"] = (
            {
                "order_ref": started.order.reference,
                "access_token": started.access_token,
                "amount_minor": started.order.amount_minor,
                "currency": started.order.currency,
                "checkout": started.checkout,
            }
            if started
            else None
        )
        return Response(body, status=status.HTTP_201_CREATED)


class RegistrationQuoteView(generics.GenericAPIView):
    """
    The exact amount the server will charge, so the form shows the same number
    Razorpay will. When online payment is not available the answer says so and
    the form falls back to the per-participant list price.
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [QuoteRateThrottle]
    serializer_class = QuoteRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category = data["category_obj"]
        count = DELEGATE_NUMBERS[data["delegates"]]
        online = (
            data["event_obj"].online_payment_enabled
            and count is not None
            and PaymentService.provider_ready()
        )
        if not online:
            return Response(
                {
                    "payable_online": False,
                    "currency": category.currency,
                    "unit_minor": category.base_amount_minor,
                    "gst_rate": str(category.gst_rate),
                }
            )
        quote = PricingService.quote_order(category=category, delegates=count)
        return Response({"payable_online": True, **quote.as_breakup()})


class StaffRegistrationQuerysetMixin:
    permission_classes = [IsStaffRole]
    serializer_class = RegistrationSerializer
    queryset = Registration.objects.select_related("event", "ticket_category")


class StaffRegistrationListView(StaffRegistrationQuerysetMixin, generics.ListAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = RegistrationFilter


class StaffRegistrationDetailView(
    StaffRegistrationQuerysetMixin, generics.RetrieveAPIView
):
    pass
