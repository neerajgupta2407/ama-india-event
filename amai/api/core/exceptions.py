from rest_framework import status
from rest_framework.exceptions import APIException


class Conflict(APIException):
    """The request is fine but the record is not in a state where it can be done (HTTP 409)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "This action is not available for the record in its current state."
    default_code = "conflict"


class UpstreamUnavailable(APIException):
    """A service we depend on (the payment provider) did not answer (HTTP 502)."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "The payment provider could not be reached. Try again in a moment."
    default_code = "upstream_unavailable"
