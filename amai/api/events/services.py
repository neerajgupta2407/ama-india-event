from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

from events.choices import Audience


@dataclass(frozen=True)
class Quote:
    currency: str
    base_minor: int
    gst_minor: int
    total_minor: int


@dataclass(frozen=True)
class OrderQuote:
    currency: str
    delegates: int
    unit_minor: int
    subtotal_minor: int
    discount_percent: Decimal
    discount_minor: int
    taxable_minor: int
    gst_rate: Decimal
    gst_minor: int
    total_minor: int

    def as_breakup(self):
        return {
            "currency": self.currency,
            "delegates": self.delegates,
            "unit_minor": self.unit_minor,
            "subtotal_minor": self.subtotal_minor,
            "discount_percent": str(self.discount_percent),
            "discount_minor": self.discount_minor,
            "taxable_minor": self.taxable_minor,
            "gst_rate": str(self.gst_rate),
            "gst_minor": self.gst_minor,
            "total_minor": self.total_minor,
        }


def _round_minor(value):
    return int(Decimal(value).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class PricingService:
    """Prices are computed on the server. The browser never sends an amount."""

    @staticmethod
    def quote(category):
        gst = (Decimal(category.base_amount_minor) * category.gst_rate / 100).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
        gst_minor = int(gst)
        return Quote(
            currency=category.currency,
            base_minor=category.base_amount_minor,
            gst_minor=gst_minor,
            total_minor=category.base_amount_minor + gst_minor,
        )

    @staticmethod
    def quote_order(*, category, delegates, at=None):
        """
        Total for a group of delegates. Discounts come from the event's rules and
        are added together; GST is charged on the discounted amount. The group
        discount is for Indian delegates only; early bird applies to every category.
        """
        at = at or timezone.now()
        event = category.event
        percent = Decimal(0)
        if (
            event.early_bird_percent > 0
            and event.early_bird_until is not None
            and at <= event.early_bird_until
        ):
            percent += event.early_bird_percent
        if (
            event.group_discount_percent > 0
            and delegates >= event.group_min_delegates
            and category.audience != Audience.INTERNATIONAL
        ):
            percent += event.group_discount_percent
        percent = min(percent, Decimal(100))

        subtotal = category.base_amount_minor * delegates
        discount = _round_minor(Decimal(subtotal) * percent / 100)
        taxable = subtotal - discount
        gst = _round_minor(Decimal(taxable) * category.gst_rate / 100)
        return OrderQuote(
            currency=category.currency,
            delegates=delegates,
            unit_minor=category.base_amount_minor,
            subtotal_minor=subtotal,
            discount_percent=percent,
            discount_minor=discount,
            taxable_minor=taxable,
            gst_rate=category.gst_rate,
            gst_minor=gst,
            total_minor=taxable + gst,
        )
