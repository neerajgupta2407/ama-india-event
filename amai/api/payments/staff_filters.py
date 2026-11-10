from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from django_filters import rest_framework as filters

from payments.choices import OrderStatus
from payments.models import Order


class OrderFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="exact")
    event = filters.CharFilter(
        field_name="registration__event__slug", lookup_expr="exact"
    )
    stale = filters.BooleanFilter(method="filter_stale")
    q = filters.CharFilter(method="filter_search")

    class Meta:
        model = Order
        fields = ["status"]

    def filter_stale(self, queryset, name, value):
        """Pending for over an hour: these need a look."""
        if not value:
            return queryset
        return queryset.filter(
            status=OrderStatus.PENDING,
            created_at__lt=timezone.now() - timedelta(hours=1),
        )

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(reference__icontains=value)
            | Q(registration__public_id__icontains=value)
            | Q(registration__full_name__icontains=value)
            | Q(registration__company_name__icontains=value)
            | Q(registration__email__icontains=value)
        )
