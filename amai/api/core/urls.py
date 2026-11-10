from django.urls import path

from core.views import HealthView

urlpatterns = [
    path("healthz/", HealthView.as_view(), name="healthz"),
]
