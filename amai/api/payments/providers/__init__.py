from payments.choices import PaymentProviderCode
from payments.providers.razorpay import RazorpayProvider


def get_provider(code=PaymentProviderCode.RAZORPAY):
    if code == PaymentProviderCode.RAZORPAY:
        return RazorpayProvider()
    raise ValueError(f"Unknown payment provider {code!r}")
