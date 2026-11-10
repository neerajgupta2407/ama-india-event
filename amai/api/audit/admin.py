from django.contrib import admin

from audit.models import AuditEvent
from core.admin_config import admin_site


class AuditEventAdmin(admin.ModelAdmin):
    list_display = ["created_at", "actor_label", "action", "object_type", "object_id"]
    list_filter = ["action", "object_type"]
    search_fields = ["actor_label", "object_id", "action"]
    readonly_fields = [f.name for f in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin_site.register(AuditEvent, AuditEventAdmin)
