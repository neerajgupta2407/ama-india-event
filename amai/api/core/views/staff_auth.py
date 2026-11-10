import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from audit.services import AuditService
from core.permissions import IsStaffRole
from core.roles import user_roles
from core.serializers import StaffLoginSerializer, StaffUserSerializer
from core.throttles import StaffLoginEmailThrottle, StaffLoginIpThrottle

logger = logging.getLogger(__name__)
User = get_user_model()


class CsrfEnforcingAuthentication(SessionAuthentication):
    """Enforces CSRF even though nobody is signed in yet, so login itself cannot be forged."""

    def authenticate(self, request):
        self.enforce_csrf(request)
        return None


@method_decorator(ensure_csrf_cookie, name="dispatch")
class StaffCsrfView(generics.GenericAPIView):
    """Sets the csrftoken cookie that the dashboard echoes back in X-CSRFToken."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        return Response({"detail": "ok"})


class StaffLoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfEnforcingAuthentication]
    throttle_classes = [StaffLoginIpThrottle, StaffLoginEmailThrottle]
    serializer_class = StaffLoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        authenticated = (
            authenticate(
                request,
                username=user.get_username(),
                password=serializer.validated_data["password"],
            )
            if user
            else None
        )
        # One answer for every failure, so the form cannot be used to find out which emails exist.
        if (
            authenticated is None
            or not authenticated.is_staff
            or not authenticated.is_active
        ):
            logger.warning("Failed staff login attempt")
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user_roles(authenticated):
            logger.warning("Staff login refused: no dashboard role assigned")
            return Response(
                {
                    "detail": "Your account has no dashboard role yet. Ask an administrator."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        login(request, authenticated)
        AuditService.record(actor=authenticated, action="staff.login")
        return Response(StaffUserSerializer(authenticated).data)


class StaffLogoutView(generics.GenericAPIView):
    permission_classes = [IsStaffRole]

    def post(self, request):
        AuditService.record(actor=request.user, action="staff.logout")
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffMeView(generics.GenericAPIView):
    permission_classes = [IsStaffRole]
    serializer_class = StaffUserSerializer

    def get(self, request):
        return Response(self.get_serializer(request.user).data)
