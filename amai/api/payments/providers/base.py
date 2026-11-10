from dataclasses import dataclass, field


class ProviderError(Exception):
    """The payment provider could not be reached or rejected the request."""


class InvalidSignature(Exception):
    """A webhook did not carry a valid signature."""


@dataclass(frozen=True)
class ProviderOrder:
    id: str


@dataclass(frozen=True)
class ProviderPayment:
    id: str
    order_id: str
    status: str
    amount_minor: int
    currency: str
    method: str = ""
    error_code: str = ""
    error_description: str = ""
    raw: dict = field(default_factory=dict)


@dataclass(frozen=True)
class VerifiedEvent:
    event_id: str
    event_type: str
    payload: dict
    payments: list
