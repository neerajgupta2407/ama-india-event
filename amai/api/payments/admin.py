from django.contrib import admin

from core.admin_config import admin_site
from payments.models import Order, PaymentAttempt, WebhookEvent


class PaymentAttemptInline(admin.TabularInline):
    model = PaymentAttempt
    extra = 0
    can_delete = False
    readonly_fields = [f.name for f in PaymentAttempt._meta.fields]


class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "reference",
        "registration",
        "amount_minor",
        "currency",
        "status",
        "paid_at",
    ]
    list_filter = ["status", "currency"]
    search_fields = ["reference", "registration__public_id", "provider_order_id"]
    readonly_fields = [f.name for f in Order._meta.fields]
    inlines = [PaymentAttemptInline]


class WebhookEventAdmin(admin.ModelAdmin):
    list_display = [
        "event_id",
        "event_type",
        "signature_valid",
        "processed_at",
        "created_at",
    ]
    readonly_fields = [f.name for f in WebhookEvent._meta.fields]


admin_site.register(Order, OrderAdmin)
admin_site.register(WebhookEvent, WebhookEventAdmin)
