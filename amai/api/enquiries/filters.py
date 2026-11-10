from django.db.models import Q

from django_filters import rest_framework as filters

from enquiries.models import Enquiry


class EnquiryFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="exact")
    q = filters.CharFilter(method="filter_search")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Enquiry
        fields = ["status"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(company_name__icontains=value)
            | Q(email__icontains=value)
            | Q(mobile__icontains=value)
        )
