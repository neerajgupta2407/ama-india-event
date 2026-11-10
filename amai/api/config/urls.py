from django.urls import include, path

from core.admin_config import admin_site

urlpatterns = [
    path("admin/", admin_site.urls),
    path("api/", include("events.urls")),
    path("api/", include("enquiries.urls")),
    path("api/", include("registrations.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("qr.urls")),
    path("", include("core.urls")),
]
