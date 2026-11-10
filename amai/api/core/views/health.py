from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


class HealthView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        return Response({"status": "ok"})
