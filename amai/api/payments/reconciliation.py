from datetime import timedelta

from django.utils import timezone

from audit.services import AuditService
from core.money import format_money
from payments.choices import OrderStatus, PaymentAttemptStatus, ReconciliationIssue
from payments.models import Order, ReconciliationRun
from payments.providers import get_provider
from payments.providers.base import ProviderError
from payments.services import OPEN_STATUSES, PaymentService

STALE_AFTER = timedelta(hours=1)
MAX_ORDERS = 300


class ReconciliationService:
    @staticmethod
    def run(*, actor, event_slug=None):
        """
        Compare recent orders with what the provider reports. Orders that turn out to be paid
        are confirmed on the spot ("recovered"); everything else odd goes on the exception list.
        """
        orders = Order.objects.select_related("registration__event").order_by(
            "-created_at"
        )
        if event_slug:
            orders = orders.filter(registration__event__slug=event_slug)
        orders = list(orders[:MAX_ORDERS])

        run = ReconciliationRun(
            triggered_by=actor if getattr(actor, "pk", None) else None,
            triggered_by_label=getattr(actor, "email", ""),
            event_slug=event_slug or "",
            orders_checked=len(orders),
        )
        exceptions = []
        matched = recovered = 0
        stale_before = timezone.now() - STALE_AFTER

        for order in orders:

            def flag(issue, detail, order=order):
                exceptions.append(
                    {
                        "order": order.reference,
                        "registration": order.registration.public_id,
                        "issue": issue,
                        "detail": detail,
                    }
                )

            if order.status == OrderStatus.MISMATCH:
                flag(
                    ReconciliationIssue.MISMATCH,
                    "Confirmation is blocked until this is reviewed with the provider.",
                )
                continue
            try:
                payments = get_provider(order.provider).fetch_payments(order)
            except ProviderError:
                flag(
                    ReconciliationIssue.PROVIDER_UNREACHABLE,
                    "Could not ask the payment provider about this order.",
                )
                continue

            captured = [
                p for p in payments if p.status == PaymentAttemptStatus.CAPTURED
            ]
            if order.status == OrderStatus.PAID:
                good = [
                    p
                    for p in captured
                    if p.amount_minor == order.amount_minor
                    and p.currency == order.currency
                ]
                if not good:
                    flag(
                        ReconciliationIssue.PAID_NOT_CAPTURED,
                        f"Expected {format_money(order.amount_minor, order.currency)} captured; the provider shows none.",
                    )
                elif len(captured) > 1:
                    flag(
                        ReconciliationIssue.DUPLICATE_CAPTURE,
                        f"{len(captured)} captures for one order: a refund is probably due.",
                    )
                else:
                    matched += 1
            elif order.status in OPEN_STATUSES:
                updated = PaymentService.apply_payments(order.pk, payments)
                if updated.status == OrderStatus.PAID:
                    recovered += 1
                elif updated.status == OrderStatus.MISMATCH:
                    flag(
                        ReconciliationIssue.MISMATCH,
                        "The provider's payment did not match this order.",
                    )
                elif (
                    updated.status == OrderStatus.PENDING
                    and order.created_at < stale_before
                ):
                    flag(
                        ReconciliationIssue.STALE_PENDING,
                        "No payment has been made on this order for over an hour.",
                    )

        run.matched = matched
        run.recovered = recovered
        run.exceptions = exceptions
        run.finished_at = timezone.now()
        run.save()
        AuditService.record(
            actor=actor,
            action="reconciliation.run",
            obj=run,
            data={
                "checked": run.orders_checked,
                "exceptions": len(exceptions),
                "recovered": recovered,
            },
        )
        return run
