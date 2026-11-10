from django.contrib import admin

from core.admin_config import admin_site
from enquiries.models import Enquiry


class EnquiryAdmin(admin.ModelAdmin):
    list_display = ["name", "company_name", "email", "mobile", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["name", "company_name", "email", "mobile"]


admin_site.register(Enquiry, EnquiryAdmin)
