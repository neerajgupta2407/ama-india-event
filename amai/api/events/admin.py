from django.contrib import admin

from core.admin_config import admin_site
from events.models import Event, TicketCategory


class TicketCategoryInline(admin.TabularInline):
    model = TicketCategory
    extra = 0


class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "status", "starts_at", "registration_prefix"]
    list_filter = ["status"]
    inlines = [TicketCategoryInline]


class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "event",
        "audience",
        "currency",
        "base_amount_minor",
        "gst_rate",
        "is_active",
    ]
    list_filter = ["event", "audience", "is_active"]


admin_site.register(Event, EventAdmin)
admin_site.register(TicketCategory, TicketCategoryAdmin)
