from django.urls import path

from payments import staff_views
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
    path(
        "staff/orders/",
        staff_views.StaffOrderListView.as_view(),
        name="staff-order-list",
    ),
    path(
        "staff/reconciliation/",
        staff_views.StaffReconciliationView.as_view(),
        name="staff-reconciliation",
    ),
    path(
        "staff/reconciliation/run/",
        staff_views.StaffReconciliationRunView.as_view(),
        name="staff-reconciliation-run",
    ),
]
