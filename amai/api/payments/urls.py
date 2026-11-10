from django.urls import path

from payments.views import OrderStatusView, RazorpayWebhookView

urlpatterns = [
    path(
        "orders/<str:reference>/status/", OrderStatusView.as_view(), name="order-status"
    ),
    path(
        "payments/webhooks/razorpay/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),
]
