from django.contrib import admin

from core.admin_config import admin_site
from qr.models import AttendeePass, CheckIn


class AttendeePassAdmin(admin.ModelAdmin):
    list_display = ["registration", "admits", "issued_at", "revoked_at"]
    search_fields = ["registration__public_id", "registration__full_name"]
    readonly_fields = ["token_hash"]


class CheckInAdmin(admin.ModelAdmin):
    list_display = ["attendee_pass", "created_at", "operator_label", "gate"]
    readonly_fields = [f.name for f in CheckIn._meta.fields]


admin_site.register(AttendeePass, AttendeePassAdmin)
admin_site.register(CheckIn, CheckInAdmin)
