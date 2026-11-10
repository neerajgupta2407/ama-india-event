import hmac

from rest_framework.permissions import BasePermission

from payments.models import hash_token


class HasValidOrderToken(BasePermission):
    """
    Order status is shown only to whoever created the order. The token is returned once,
    in the registration response, and sent back in the X-Order-Token header.
    """

    message = "A valid order token is required."

    def has_object_permission(self, request, view, obj):
        token = request.headers.get("X-Order-Token", "")
        return bool(token) and hmac.compare_digest(
            hash_token(token), obj.access_token_hash
        )
