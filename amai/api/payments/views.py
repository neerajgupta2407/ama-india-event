import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from payments.models import Order
from payments.permissions import HasValidOrderToken
from payments.providers.base import InvalidSignature, ProviderError
from payments.serializers import OrderStatusSerializer
from payments.services import OPEN_STATUSES, PaymentService

logger = logging.getLogger(__name__)


class OrderStatusThrottle(AnonRateThrottle):
    scope = "order_status"


class OrderStatusView(generics.RetrieveAPIView):
    """
    Polled by the payment status page. While the order is still open it asks the
    provider directly, so a webhook that never arrives cannot leave anyone waiting.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny, HasValidOrderToken]
    throttle_classes = [OrderStatusThrottle]
    serializer_class = OrderStatusSerializer
    queryset = Order.objects.select_related("registration__event")
    lookup_field = "reference"

    def get_object(self):
        order = super().get_object()
        if order.status in OPEN_STATUSES:
            try:
                order = PaymentService.refresh_from_provider(order)
            except ProviderError:
                logger.exception("Status check failed for %s", order.reference)
        return order

    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()
        data = dict(self.get_serializer(order).data)
        if order.status in OPEN_STATUSES:
            data["checkout"] = PaymentService.checkout_params(order)
        return Response(data)


class RazorpayWebhookView(generics.GenericAPIView):
    """Razorpay calls this. Trust comes from the signature, never from the caller."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        # Read the raw bytes first: the signature covers them exactly.
        raw_body = request.body
        try:
            result = PaymentService.process_webhook(
                raw_body=raw_body, headers=request.headers
            )
        except InvalidSignature:
            logger.warning("Rejected a webhook with an invalid signature")
            return Response(
                {"detail": "invalid signature"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response({"status": result})
