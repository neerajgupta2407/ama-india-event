from django.db.models import Q

from django_filters import rest_framework as filters

from registrations.models import Registration


class RegistrationFilter(filters.FilterSet):
    event = filters.CharFilter(field_name="event__slug", lookup_expr="exact")
    category = filters.CharFilter(
        field_name="ticket_category__code", lookup_expr="exact"
    )
    status = filters.CharFilter(field_name="status", lookup_expr="exact")
    member_validation = filters.CharFilter(
        field_name="member_validation", lookup_expr="exact"
    )
    payment_status = filters.CharFilter(
        field_name="orders__status", lookup_expr="exact", distinct=True
    )
    q = filters.CharFilter(method="filter_search")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Registration
        fields = ["event", "category", "status", "member_validation"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(public_id__icontains=value)
            | Q(full_name__icontains=value)
            | Q(company_name__icontains=value)
            | Q(email__icontains=value)
            | Q(mobile__icontains=value)
            | Q(orders__reference__icontains=value)
        ).distinct()
