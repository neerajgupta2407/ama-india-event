import logging
import secrets
from dataclasses import dataclass

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from core.email import send_email
from core.money import format_money
from events.services import PricingService
from payments.choices import OrderStatus, PaymentAttemptStatus
from payments.models import Order, PaymentAttempt, WebhookEvent, hash_token
from payments.providers import get_provider
from payments.providers.base import ProviderError
from qr.services import PassService
from registrations.choices import RegistrationStatus
from registrations.models import Registration

logger = logging.getLogger(__name__)

# Orders that can still receive a (new) payment.
OPEN_STATUSES = (OrderStatus.PENDING, OrderStatus.FAILED)


@dataclass(frozen=True)
class StartedPayment:
    order: Order
    access_token: str
    checkout: dict


class PaymentService:
    @staticmethod
    def provider_ready():
        return get_provider().is_configured()

    @staticmethod
    def can_pay_online(registration):
        return (
            registration.event.online_payment_enabled
            and registration.delegate_count is not None
            and get_provider().is_configured()
        )

    @staticmethod
    def start_payment(registration):
        """
        Create the order and the matching Razorpay order for a registration.
        Returns None when the registration is not payable online (switch off,
        "5 or more" delegates, no keys) or when the provider is down: the
        registration is already saved, so the secretariat follows up instead.
        """
        if not PaymentService.can_pay_online(registration):
            return None
        provider = get_provider()
        quote = PricingService.quote_order(
            category=registration.ticket_category,
            delegates=registration.delegate_count,
        )
        order = Order(
            registration=registration,
            amount_minor=quote.total_minor,
            currency=quote.currency,
            tax_breakup=quote.as_breakup(),
        )
        try:
            provider_order = provider.create_order(order)
        except ProviderError:
            logger.exception(
                "Could not create a payment order for %s", registration.public_id
            )
            return None

        token = secrets.token_urlsafe(24)
        order.provider_order_id = provider_order.id
        order.access_token_hash = hash_token(token)
        with transaction.atomic():
            order.save()
            Registration.objects.filter(pk=registration.pk).update(
                status=RegistrationStatus.PENDING_PAYMENT
            )
        return StartedPayment(
            order=order, access_token=token, checkout=provider.checkout_params(order)
        )

    @staticmethod
    def checkout_params(order):
        return get_provider(order.provider).checkout_params(order)

    @staticmethod
    def refresh_from_provider(order):
        """Server-to-server status check, so a lost webhook never leaves a visitor waiting."""
        if order.status not in OPEN_STATUSES:
            return order
        payments = get_provider(order.provider).fetch_payments(order)
        return PaymentService.apply_payments(order.pk, payments)

    @staticmethod
    @transaction.atomic
    def apply_payments(order_id, payments):
        """
        The only place an order changes status. Safe to call repeatedly with the
        same data: PAID is final, and a second capture never confirms anything twice.
        """
        order = (
            Order.objects.select_for_update()
            .select_related("registration__event")
            .get(pk=order_id)
        )
        captured = []
        for payment in payments:
            attempt, created = PaymentAttempt.objects.update_or_create(
                provider_payment_id=payment.id,
                defaults={
                    "order": order,
                    "method": payment.method,
                    "status": payment.status,
                    "amount_minor": payment.amount_minor,
                    "currency": payment.currency,
                    "error_code": payment.error_code,
                    "error_description": payment.error_description,
                    "raw_response": payment.raw,
                },
            )
            if payment.status == PaymentAttemptStatus.CAPTURED:
                captured.append((payment, created))

        if order.status == OrderStatus.PAID:
            for payment, created in captured:
                paid_attempt = (
                    order.attempts.filter(status=PaymentAttemptStatus.CAPTURED)
                    .order_by("created_at")
                    .first()
                )
                if (
                    created
                    and paid_attempt
                    and paid_attempt.provider_payment_id != payment.id
                ):
                    transaction.on_commit(
                        lambda p=payment: PaymentService._alert_staff(
                            f"Duplicate payment for {order.reference}",
                            f"A second payment ({p.id}) was captured for order {order.reference} "
                            f"({order.registration.public_id}). It needs a refund.",
                        )
                    )
            return order

        if order.status == OrderStatus.MISMATCH:
            return order

        if captured:
            payment, _ = captured[0]
            if (
                payment.amount_minor != order.amount_minor
                or payment.currency != order.currency
                or payment.order_id != order.provider_order_id
            ):
                order.status = OrderStatus.MISMATCH
                order.save(update_fields=["status", "updated_at"])
                transaction.on_commit(
                    lambda: PaymentService._alert_mismatch(order, payment)
                )
                return order
            order.status = OrderStatus.PAID
            order.paid_at = timezone.now()
            order.save(update_fields=["status", "paid_at", "updated_at"])
            registration = order.registration
            registration.status = RegistrationStatus.CONFIRMED
            registration.save(update_fields=["status", "updated_at"])
            _, pass_token = PassService.issue(registration)
            transaction.on_commit(
                lambda: PaymentService._notify_paid(order, payment, pass_token)
            )
            return order

        if payments and all(p.status == PaymentAttemptStatus.FAILED for p in payments):
            if order.status != OrderStatus.FAILED:
                order.status = OrderStatus.FAILED
                order.save(update_fields=["status", "updated_at"])
        elif order.status == OrderStatus.FAILED:
            # A new attempt is in progress on a previously failed order.
            order.status = OrderStatus.PENDING
            order.save(update_fields=["status", "updated_at"])
        return order

    @staticmethod
    def process_webhook(*, raw_body, headers, provider_code=None):
        """
        Verify, store and apply a provider webhook. Raises InvalidSignature for a bad
        signature. Returns "duplicate", "ignored" or "processed".
        """
        provider = get_provider(provider_code) if provider_code else get_provider()
        event = provider.verify_webhook(raw_body, headers)
        webhook, created = WebhookEvent.objects.get_or_create(
            event_id=event.event_id,
            defaults={
                "provider": provider.code,
                "event_type": event.event_type,
                "payload": event.payload,
            },
        )
        if not created and webhook.processed_at:
            return "duplicate"

        result = "ignored"
        error = ""
        for payment in event.payments:
            order = Order.objects.filter(provider_order_id=payment.order_id).first()
            if order is None:
                error = f"No order for provider order {payment.order_id}"
                continue
            PaymentService.apply_payments(order.pk, [payment])
            result = "processed"
        webhook.processed_at = timezone.now()
        webhook.processing_error = error
        webhook.save(update_fields=["processed_at", "processing_error", "updated_at"])
        return result

    # --- notifications (best effort, after the transaction commits) -------------

    @staticmethod
    def _alert_staff(subject, body):
        return send_email(
            subject=subject, body=body, recipients=settings.STAFF_ALERT_EMAILS
        )

    @staticmethod
    def _alert_mismatch(order, payment):
        PaymentService._alert_staff(
            f"PAYMENT MISMATCH {order.reference}",
            f"Payment {payment.id} did not match order {order.reference} "
            f"({order.registration.public_id}).\n"
            f"Expected {format_money(order.amount_minor, order.currency)}, "
            f"got {format_money(payment.amount_minor, payment.currency)}.\n"
            "The registration was NOT confirmed. Please review it with the payment provider.",
        )

    @staticmethod
    def _notify_paid(order, payment, pass_token):
        registration = order.registration
        total = format_money(order.amount_minor, order.currency)
        send_email(
            subject=f"Payment received for {registration.public_id}",
            body=(
                f"Dear {registration.full_name},\n\n"
                f"We have received your payment of {total} for the {registration.event.title}. "
                f"Your registration {registration.public_id} is confirmed.\n\n"
                f"Order: {order.reference}\nPayment ID: {payment.id}\n\n"
                f"Your entry pass (show it at the venue): {PassService.pass_url(pass_token)}\n"
                f"It admits {registration.delegate_count or 'your group'} "
                f"delegate{'s' if (registration.delegate_count or 2) > 1 else ''}.\n\n"
                "Alkali Manufacturers Association of India\n"
            ),
            recipients=[registration.email],
        )
        PaymentService._alert_staff(
            f"Payment received {registration.public_id}",
            f"{registration.full_name} ({registration.company_name}) paid {total} "
            f"for {registration.public_id}. Order {order.reference}, payment {payment.id}.",
        )
