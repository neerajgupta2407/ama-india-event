from rest_framework.throttling import AnonRateThrottle


class EnquiryRateThrottle(AnonRateThrottle):
    scope = "enquiry"


class QuoteRateThrottle(AnonRateThrottle):
    scope = "quote"


class RegistrationRateThrottle(AnonRateThrottle):
    scope = "registration"
