from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from enquiries.choices import EnquiryStatus
from enquiries.models import Enquiry
from events.models import Event
from payments.choices import OrderStatus
from payments.models import Order
from qr.models import AttendeePass, CheckIn
from registrations.choices import MemberValidation, RegistrationStatus
from registrations.models import Registration

STALE_AFTER = timedelta(hours=1)
ATTENTION_LIMIT = 15
SEVERITY = {"urgent": 0, "review": 1, "follow_up": 2}


class OverviewService:
    @staticmethod
    def build(event_slug=None):
        registrations = Registration.objects.all()
        if event_slug:
            registrations = registrations.filter(event__slug=event_slug)
        orders = Order.objects.filter(registration__in=registrations)

        status_counts = dict(
            registrations.values_list("status").annotate(n=Count("id"))
        )
        order_counts = dict(orders.values_list("status").annotate(n=Count("id")))

        revenue = {}
        for order in orders.filter(status=OrderStatus.PAID):
            row = revenue.setdefault(
                order.currency,
                {
                    "currency": order.currency,
                    "orders": 0,
                    "taxable_minor": 0,
                    "gst_minor": 0,
                    "total_minor": 0,
                },
            )
            row["orders"] += 1
            row["taxable_minor"] += order.tax_breakup.get("taxable_minor", 0)
            row["gst_minor"] += order.tax_breakup.get("gst_minor", 0)
            row["total_minor"] += order.amount_minor

        by_category = (
            registrations.values("ticket_category__code", "ticket_category__name")
            .annotate(
                total=Count("id"),
                confirmed=Count("id", filter=Q(status=RegistrationStatus.CONFIRMED)),
            )
            .order_by("ticket_category__name")
        )
        admitted = CheckIn.objects.filter(
            attendee_pass__registration__in=registrations
        ).count()
        expected = sum(
            AttendeePass.objects.filter(
                registration__in=registrations.filter(
                    status=RegistrationStatus.CONFIRMED
                ),
                revoked_at__isnull=True,
            ).values_list("admits", flat=True)
        )

        return {
            "registrations": {
                "total": registrations.count(),
                "requested": status_counts.get(RegistrationStatus.REQUESTED, 0),
                "pending_payment": status_counts.get(
                    RegistrationStatus.PENDING_PAYMENT, 0
                ),
                "confirmed": status_counts.get(RegistrationStatus.CONFIRMED, 0),
                "cancelled": status_counts.get(RegistrationStatus.CANCELLED, 0),
            },
            "payments": {
                "paid": order_counts.get(OrderStatus.PAID, 0),
                "pending": order_counts.get(OrderStatus.PENDING, 0),
                "failed": order_counts.get(OrderStatus.FAILED, 0),
                "mismatch": order_counts.get(OrderStatus.MISMATCH, 0),
                "revenue": sorted(revenue.values(), key=lambda r: r["currency"]),
            },
            "member_reviews_pending": registrations.filter(
                member_validation=MemberValidation.PENDING_REVIEW
            )
            .exclude(status=RegistrationStatus.CANCELLED)
            .count(),
            "enquiries_new": Enquiry.objects.filter(status=EnquiryStatus.NEW).count(),
            "check_in": {"admitted": admitted, "expected": expected},
            "by_category": [
                {
                    "code": row["ticket_category__code"],
                    "name": row["ticket_category__name"],
                    "total": row["total"],
                    "confirmed": row["confirmed"],
                }
                for row in by_category
            ],
            "attention": OverviewService._attention(registrations, orders),
            "events": list(
                Event.objects.order_by("-starts_at").values("slug", "title")
            ),
        }

    @staticmethod
    def _attention(registrations, orders):
        items = []
        stale_before = timezone.now() - STALE_AFTER
        for order in orders.select_related("registration").filter(
            Q(status__in=[OrderStatus.MISMATCH, OrderStatus.FAILED])
            | Q(status=OrderStatus.PENDING, created_at__lt=stale_before)
        ):
            kind, severity, detail = {
                OrderStatus.MISMATCH: (
                    "payment_mismatch",
                    "urgent",
                    "Payment mismatch: confirmation is blocked",
                ),
                OrderStatus.FAILED: (
                    "payment_failed",
                    "follow_up",
                    "Payment failed: no successful retry yet",
                ),
                OrderStatus.PENDING: (
                    "payment_stale",
                    "follow_up",
                    "Payment pending for over an hour",
                ),
            }[order.status]
            items.append(
                OverviewService._item(
                    order.registration, kind, severity, detail, order.updated_at
                )
            )
        for registration in registrations.filter(
            member_validation=MemberValidation.PENDING_REVIEW
        ).exclude(status=RegistrationStatus.CANCELLED):
            items.append(
                OverviewService._item(
                    registration,
                    "member_review",
                    "review",
                    "Membership needs review",
                    registration.created_at,
                )
            )
        items.sort(key=lambda i: (SEVERITY[i["severity"]], -i["at"].timestamp()))
        return items[:ATTENTION_LIMIT]

    @staticmethod
    def _item(registration, kind, severity, detail, at):
        return {
            "kind": kind,
            "severity": severity,
            "detail": detail,
            "registration": registration.public_id,
            "name": registration.full_name,
            "company": registration.company_name,
            "at": at,
        }
