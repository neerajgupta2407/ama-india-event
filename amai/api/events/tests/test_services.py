from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from model_bakery import baker

from events.choices import Currency
from events.models import Event, TicketCategory
from events.services import PricingService


class PricingServiceTests(TestCase):
    def setUp(self):
        self.event = baker.make(Event)

    def test_quote_inr_adds_gst(self):
        category = baker.make(
            TicketCategory,
            event=self.event,
            currency=Currency.INR,
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
        )

        quote = PricingService.quote(category)

        self.assertEqual("INR", quote.currency)
        self.assertEqual(30_000_00, quote.base_minor)
        self.assertEqual(5_400_00, quote.gst_minor)
        self.assertEqual(35_400_00, quote.total_minor)

    def test_quote_usd_without_gst(self):
        category = baker.make(
            TicketCategory,
            event=self.event,
            currency=Currency.USD,
            base_amount_minor=900_00,
            gst_rate=Decimal("0.00"),
        )

        quote = PricingService.quote(category)

        self.assertEqual("USD", quote.currency)
        self.assertEqual(0, quote.gst_minor)
        self.assertEqual(900_00, quote.total_minor)

    def test_quote_rounds_gst_half_up_to_whole_minor_unit(self):
        # 18% of 2.5 paise is 0.45 -> rounds to 0; 18% of 3 paise is 0.54 -> rounds to 1
        for base, expected_gst in [(2, 0), (3, 1), (50, 9)]:
            with self.subTest(base=base):
                category = baker.prepare(
                    TicketCategory,
                    event=self.event,
                    base_amount_minor=base,
                    gst_rate=Decimal("18.00"),
                )
                self.assertEqual(expected_gst, PricingService.quote(category).gst_minor)


class QuoteOrderTests(TestCase):
    def setUp(self):
        self.now = timezone.now()
        self.event = baker.make(
            Event,
            early_bird_percent=Decimal("10.00"),
            early_bird_until=self.now + timedelta(days=5),
            group_discount_percent=Decimal("10.00"),
            group_min_delegates=3,
        )
        self.category = baker.make(
            TicketCategory,
            event=self.event,
            base_amount_minor=30_000_00,
            gst_rate=Decimal("18.00"),
        )

    def test_single_delegate_before_cutoff_gets_early_bird_only(self):
        quote = PricingService.quote_order(
            category=self.category, delegates=1, at=self.now
        )

        self.assertEqual(Decimal("10.00"), quote.discount_percent)
        self.assertEqual(3_000_00, quote.discount_minor)
        self.assertEqual(27_000_00, quote.taxable_minor)
        self.assertEqual(4_860_00, quote.gst_minor)
        self.assertEqual(31_860_00, quote.total_minor)

    def test_three_delegates_before_cutoff_add_both_discounts(self):
        quote = PricingService.quote_order(
            category=self.category, delegates=3, at=self.now
        )

        self.assertEqual(Decimal("20.00"), quote.discount_percent)
        self.assertEqual(90_000_00, quote.subtotal_minor)
        self.assertEqual(18_000_00, quote.discount_minor)
        self.assertEqual(72_000_00 + 12_960_00, quote.total_minor)

    def test_after_cutoff_only_group_discount_applies(self):
        later = self.now + timedelta(days=6)

        quote = PricingService.quote_order(
            category=self.category, delegates=3, at=later
        )

        self.assertEqual(Decimal("10.00"), quote.discount_percent)

    def test_two_delegates_after_cutoff_pay_list_price(self):
        later = self.now + timedelta(days=6)

        quote = PricingService.quote_order(
            category=self.category, delegates=2, at=later
        )

        self.assertEqual(0, quote.discount_minor)
        self.assertEqual(60_000_00 + 10_800_00, quote.total_minor)

    def test_no_discount_rules_configured_means_list_price(self):
        plain = baker.make(Event)
        category = baker.make(
            TicketCategory,
            event=plain,
            base_amount_minor=900_00,
            gst_rate=Decimal("0.00"),
            currency="USD",
        )

        quote = PricingService.quote_order(category=category, delegates=4, at=self.now)

        self.assertEqual(Decimal("0"), quote.discount_percent)
        self.assertEqual(3_600_00, quote.total_minor)
        self.assertEqual("USD", quote.currency)
