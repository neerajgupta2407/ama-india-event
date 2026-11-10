import hashlib

from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class EnquiryRateThrottle(AnonRateThrottle):
    scope = "enquiry"


class QuoteRateThrottle(AnonRateThrottle):
    scope = "quote"


class RegistrationRateThrottle(AnonRateThrottle):
    scope = "registration"


class StaffLoginIpThrottle(AnonRateThrottle):
    scope = "staff_login_ip"


class StaffLoginEmailThrottle(SimpleRateThrottle):
    """Limits guesses against one account no matter how many addresses they come from."""

    scope = "staff_login_email"

    def get_cache_key(self, request, view):
        email = str(request.data.get("email", "")).strip().lower()
        if not email:
            return None
        ident = hashlib.sha256(email.encode()).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": ident}
