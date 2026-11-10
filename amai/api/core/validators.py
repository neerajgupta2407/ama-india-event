import re

from django.core.validators import RegexValidator

mobile_validator = RegexValidator(
    regex=re.compile(r"^[0-9+\-\s]{8,15}$"),
    message="Enter a valid mobile number (8-15 digits).",
)
