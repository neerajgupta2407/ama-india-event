import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import MagicMock

from model_bakery import baker

from events.choices import Audience, EventStatus
from events.models import Event, TicketCategory
from registrations.models import Registration

WEBHOOK_SECRET = "dummy"  # config.settings.testing


def make_registration(*, online=True, delegates="2", group_percent="10.00"):
    """A registration on an open event; 2 delegates of a 30,000 + 18% GST category."""
    event = baker.make(
        Event,
        slug="conf-2027",
        title="Conference 2027",
        status=EventStatus.OPEN,
        registration_prefix="AC27",
        registration_counter=1,
        online_payment_enabled=online,
        group_discount_percent=Decimal(group_percent),
        group_min_delegates=3,
    )
    category = baker.make(
        TicketCategory,
        event=event,
        code="non-member",
        audience=Audience.NON_MEMBER,
        base_amount_minor=30_000_00,
        gst_rate=Decimal("18.00"),
        currency="INR",
    )
    return baker.make(
        Registration,
        public_id="AMAI-AC27-000001",
        event=event,
        ticket_category=category,
        delegates=delegates,
        full_name="Asha Rao",
        company_name="Rao Chemicals",
        email="asha@example.com",
        mobile="9810012345",
        currency="INR",
        quoted_base_minor=30_000_00,
        quoted_gst_minor=5_400_00,
        quoted_total_minor=35_400_00,
    )


def razorpay_create_order_response(order_id="order_TEST1"):
    response = MagicMock(ok=True, status_code=200)
    response.json.return_value = {"id": order_id, "status": "created"}
    return response


def razorpay_payment(
    *,
    payment_id="pay_1",
    order_id="order_TEST1",
    amount=70_800_00,
    status="captured",
    **extra,
):
    entity = {
        "id": payment_id,
        "order_id": order_id,
        "amount": amount,
        "currency": "INR",
        "status": status,
        "method": "upi",
        "email": "asha@example.com",
        "contact": "+919810012345",
        "card": {"last4": "1111"},
        "error_code": None,
        "error_description": None,
    }
    entity.update(extra)
    return entity


def payments_response(*entities):
    response = MagicMock(ok=True, status_code=200)
    response.json.return_value = {
        "entity": "collection",
        "count": len(entities),
        "items": list(entities),
    }
    return response


def webhook_body(event_type, payment_entity):
    return json.dumps(
        {"event": event_type, "payload": {"payment": {"entity": payment_entity}}}
    ).encode()


def sign(body, secret=WEBHOOK_SECRET):
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
