from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from core.permissions import CanCheckIn
from qr.models import CheckIn
from qr.serializers import (
    CheckInRequestSerializer,
    PublicPassSerializer,
    RecentCheckInSerializer,
    registration_summary,
)
from qr.services import CheckInService, PassService


class PassThrottle(AnonRateThrottle):
    scope = "pass"


class PublicPassView(generics.GenericAPIView):
    """The attendee's own pass. The secret token in the URL is the only credential."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [PassThrottle]
    serializer_class = PublicPassSerializer

    def get(self, request, token):
        attendee_pass = PassService.find_by_token(token)
        if attendee_pass is None:
            return Response({"detail": "Pass not found."}, status=404)
        return Response(self.get_serializer(attendee_pass).data)


class StaffCheckInView(generics.GenericAPIView):
    """
    Scan or type a code. Always answers 200 with a `result` the screen can show:
    OK, ALREADY_CHECKED_IN, NOT_PAID, REVOKED or INVALID.
    """

    permission_classes = [CanCheckIn]
    serializer_class = CheckInRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outcome = CheckInService.check_in(
            code=serializer.validated_data["code"],
            operator=request.user,
            gate=serializer.validated_data.get("gate", ""),
        )
        return Response(
            {
                "result": outcome.result,
                "registration": (
                    registration_summary(outcome.registration)
                    if outcome.registration
                    else None
                ),
                "admitted": outcome.admitted,
                "admits": outcome.admits,
                "last_checked_in_at": outcome.last_checked_in_at,
            }
        )


class StaffCheckInSearchView(generics.GenericAPIView):
    permission_classes = [CanCheckIn]

    def get(self, request):
        rows = CheckInService.search(request.query_params.get("q", ""))
        return Response(
            [
                {
                    **registration_summary(r),
                    "admits": (
                        r.attendee_pass.admits if hasattr(r, "attendee_pass") else None
                    ),
                    "admitted": r.admitted_count,
                }
                for r in rows
            ]
        )


class StaffCheckInRecentView(generics.ListAPIView):
    permission_classes = [CanCheckIn]
    serializer_class = RecentCheckInSerializer
    pagination_class = None
    queryset = CheckIn.objects.select_related(
        "attendee_pass__registration__ticket_category"
    )[:50]
