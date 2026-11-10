from django.contrib import admin

from core.admin_config import admin_site
from registrations.models import Registration


class RegistrationAdmin(admin.ModelAdmin):
    list_display = [
        "public_id",
        "full_name",
        "company_name",
        "ticket_category",
        "delegates",
        "status",
        "member_validation",
        "created_at",
    ]
    list_filter = ["event", "ticket_category", "status", "member_validation"]
    search_fields = ["public_id", "full_name", "company_name", "email", "mobile"]
    readonly_fields = [
        "public_id",
        "currency",
        "quoted_base_minor",
        "quoted_gst_minor",
        "quoted_total_minor",
    ]


admin_site.register(Registration, RegistrationAdmin)
