from django.http import HttpResponse
from django.utils import timezone

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.response import Response

from audit.services import AuditService
from core.pagination import StaffPagination
from core.permissions import (
    CanExport,
    CanManageRegistrations,
    CanReviewMembers,
    CanViewDashboard,
)
from registrations.filters import RegistrationFilter
from registrations.models import Registration
from registrations.serializers import (
    CancelRegistrationSerializer,
    ConfirmManuallySerializer,
    MemberReviewSerializer,
    RegistrationSerializer,
    StaffRegistrationDetailSerializer,
)
from registrations.staff_services import (
    StaffRegistrationService,
    build_registrations_csv,
)
from registrations.stats import OverviewService

EXPORT_ROW_LIMIT = 10_000


def staff_registrations():
    return Registration.objects.select_related(
        "event", "ticket_category"
    ).prefetch_related("orders")


class StaffOverviewView(generics.GenericAPIView):
    permission_classes = [CanViewDashboard]

    def get(self, request):
        return Response(
            OverviewService.build(request.query_params.get("event") or None)
        )


class StaffRegistrationListView(generics.ListAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = RegistrationSerializer
    pagination_class = StaffPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = RegistrationFilter

    def get_queryset(self):
        return staff_registrations()


class StaffRegistrationDetailView(generics.RetrieveAPIView):
    permission_classes = [CanViewDashboard]
    serializer_class = StaffRegistrationDetailSerializer
    lookup_field = "public_id"

    def get_queryset(self):
        return staff_registrations().prefetch_related(
            "orders__attempts", "attendee_pass__check_ins"
        )


class StaffRegistrationExportView(generics.GenericAPIView):
    """CSV of the current filters. Every export is audited, as it carries personal data."""

    permission_classes = [CanExport]
    filter_backends = [DjangoFilterBackend]
    filterset_class = RegistrationFilter

    def get_queryset(self):
        return staff_registrations()

    def get(self, request):
        rows = list(self.filter_queryset(self.get_queryset())[:EXPORT_ROW_LIMIT])
        AuditService.record(
            actor=request.user,
            action="registrations.export",
            data={"rows": len(rows), "filters": request.query_params.dict()},
        )
        stamp = timezone.now().strftime("%Y%m%d-%H%M")
        response = HttpResponse(
            build_registrations_csv(rows), content_type="text/csv; charset=utf-8"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="amai-registrations-{stamp}.csv"'
        )
        return response


class RegistrationActionView(generics.GenericAPIView):
    """Base for the buttons in the record drawer: each acts on one registration and returns it fresh."""

    lookup_field = "public_id"

    def get_queryset(self):
        return staff_registrations().prefetch_related(
            "orders__attempts", "attendee_pass__check_ins"
        )

    def respond(self, registration, **extra):
        registration = self.get_queryset().get(pk=registration.pk)
        return Response(
            {**StaffRegistrationDetailSerializer(registration).data, **extra}
        )


class StaffMemberReviewView(RegistrationActionView):
    permission_classes = [CanReviewMembers]
    serializer_class = MemberReviewSerializer

    def post(self, request, public_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = self.get_object()
        StaffRegistrationService.review_member(
            registration, serializer.validated_data["decision"], request.user
        )
        return self.respond(registration)


class StaffRefreshPaymentView(RegistrationActionView):
    permission_classes = [CanViewDashboard]

    def post(self, request, public_id):
        registration = self.get_object()
        StaffRegistrationService.refresh_payment(registration, request.user)
        return self.respond(registration)


class StaffResendConfirmationView(RegistrationActionView):
    permission_classes = [CanManageRegistrations]

    def post(self, request, public_id):
        registration = self.get_object()
        kind = StaffRegistrationService.resend_confirmation(registration, request.user)
        return self.respond(registration, sent=kind)


class StaffConfirmManuallyView(RegistrationActionView):
    permission_classes = [CanManageRegistrations]
    serializer_class = ConfirmManuallySerializer

    def post(self, request, public_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = self.get_object()
        StaffRegistrationService.confirm_manually(
            registration,
            request.user,
            note=serializer.validated_data["note"],
            admits=serializer.validated_data.get("admits"),
        )
        return self.respond(registration)


class StaffCancelRegistrationView(RegistrationActionView):
    permission_classes = [CanManageRegistrations]
    serializer_class = CancelRegistrationSerializer

    def post(self, request, public_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = self.get_object()
        StaffRegistrationService.cancel(
            registration, request.user, serializer.validated_data["reason"]
        )
        return self.respond(registration)
