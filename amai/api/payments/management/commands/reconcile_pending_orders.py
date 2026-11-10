import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from payments.models import Order
from payments.providers.base import ProviderError
from payments.services import OPEN_STATUSES, PaymentService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Ask the payment provider about orders that are still open and confirm the ones "
        "that were paid. Covers visitors who paid and closed the tab, and lost webhooks."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours", type=int, default=48, help="Only orders newer than this."
        )

    def handle(self, *args, **options):
        since = timezone.now() - timedelta(hours=options["hours"])
        orders = Order.objects.filter(status__in=OPEN_STATUSES, created_at__gte=since)
        checked = paid = failed = 0
        for order in orders:
            checked += 1
            try:
                updated = PaymentService.refresh_from_provider(order)
            except ProviderError:
                failed += 1
                logger.exception("Could not check %s", order.reference)
                continue
            if updated.status == "paid":
                paid += 1
        self.stdout.write(
            f"Checked {checked} open orders: {paid} newly paid, {failed} could not be checked."
        )
