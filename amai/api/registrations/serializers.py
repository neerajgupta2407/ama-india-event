from rest_framework import serializers

from audit.services import AuditService
from core.validators import mobile_validator
from events.models import Event, TicketCategory
from payments.models import Order, PaymentAttempt
from registrations.choices import DELEGATE_NUMBERS, DelegateCount
from registrations.models import Registration


class EventCategoryValidationMixin:
    """Resolves and checks the `event` and `category` slugs shared by several requests."""

    def validate(self, attrs):
        try:
            event = Event.objects.get(slug=attrs["event"])
        except Event.DoesNotExist:
            raise serializers.ValidationError({"event": "Unknown event."})
        if not event.is_registration_open():
            raise serializers.ValidationError(
                {"event": "Registration is not open for this event."}
            )
        try:
            category = event.categories.get(code=attrs["category"], is_active=True)
        except TicketCategory.DoesNotExist:
            raise serializers.ValidationError(
                {"category": "Unknown category for this event."}
            )
        attrs["event_obj"] = event
        attrs["category_obj"] = category
        return attrs


class AdditionalDelegateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    designation = serializers.CharField(max_length=200)


class RegistrationRequestSerializer(
    EventCategoryValidationMixin, serializers.Serializer
):
    event = serializers.SlugField()
    category = serializers.SlugField()
    name = serializers.CharField(max_length=200)
    company_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )
    mobile = serializers.CharField(max_length=20, validators=[mobile_validator])
    email = serializers.EmailField()
    delegates = serializers.ChoiceField(choices=DelegateCount.choices)
    message = serializers.CharField(required=False, allow_blank=True)
    # Everyone beyond the person registering. Required only when there is more than one delegate.
    additional_delegates = AdditionalDelegateSerializer(
        many=True, required=False, max_length=50
    )
    # Honeypot, see core.mixins.HoneypotMixin
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        needed = DELEGATE_NUMBERS[attrs["delegates"]]
        # "5 or more" has no exact number: the form asks for at least four more people.
        expected = 4 if needed is None else needed - 1
        given = len(attrs.get("additional_delegates", []))
        if given < expected or (needed is not None and given > expected):
            raise serializers.ValidationError(
                {
                    "additional_delegates": f"Please give the details of {expected}"
                    f"{' or more' if needed is None else ''} additional delegate(s)."
                }
            )
        return attrs


class QuoteRequestSerializer(EventCategoryValidationMixin, serializers.Serializer):
    event = serializers.SlugField()
    category = serializers.SlugField()
    delegates = serializers.ChoiceField(choices=DelegateCount.choices)


class RegistrationReceiptSerializer(serializers.ModelSerializer):
    """What the visitor gets back after submitting."""

    category = serializers.CharField(source="ticket_category.code")

    class Meta:
        model = Registration
        fields = [
            "public_id",
            "status",
            "category",
            "currency",
            "quoted_base_minor",
            "quoted_gst_minor",
            "quoted_total_minor",
        ]
        read_only_fields = fields


class PaymentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAttempt
        fields = [
            "provider_payment_id",
            "method",
            "status",
            "amount_minor",
            "currency",
            "error_code",
            "error_description",
            "created_at",
        ]
        read_only_fields = fields


class StaffOrderSerializer(serializers.ModelSerializer):
    attempts = PaymentAttemptSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "reference",
            "status",
            "amount_minor",
            "currency",
            "tax_breakup",
            "paid_at",
            "created_at",
            "attempts",
        ]
        read_only_fields = fields


class RegistrationSerializer(serializers.ModelSerializer):
    """One row of the staff list. Needs `orders` prefetched."""

    event = serializers.CharField(source="event.slug")
    category = serializers.CharField(source="ticket_category.code")
    category_name = serializers.CharField(source="ticket_category.name")
    payment_status = serializers.SerializerMethodField()
    order_reference = serializers.SerializerMethodField()
    order_amount_minor = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            "id",
            "public_id",
            "event",
            "category",
            "category_name",
            "status",
            "member_validation",
            "full_name",
            "company_name",
            "mobile",
            "email",
            "delegates",
            "message",
            "additional_delegates",
            "currency",
            "quoted_base_minor",
            "quoted_gst_minor",
            "quoted_total_minor",
            "payment_status",
            "order_reference",
            "order_amount_minor",
            "created_at",
        ]
        read_only_fields = fields

    def _latest_order(self, registration):
        orders = list(registration.orders.all())
        return orders[0] if orders else None

    def get_payment_status(self, registration):
        order = self._latest_order(registration)
        return order.status if order else None

    def get_order_reference(self, registration):
        order = self._latest_order(registration)
        return order.reference if order else None

    def get_order_amount_minor(self, registration):
        order = self._latest_order(registration)
        return order.amount_minor if order else None


class StaffRegistrationDetailSerializer(RegistrationSerializer):
    """The record drawer: the row plus payments, the entry pass and the staff audit trail."""

    orders = StaffOrderSerializer(many=True, read_only=True)
    attendee_pass = serializers.SerializerMethodField()
    audit = serializers.SerializerMethodField()

    class Meta(RegistrationSerializer.Meta):
        fields = RegistrationSerializer.Meta.fields + [
            "orders",
            "attendee_pass",
            "audit",
        ]
        read_only_fields = fields

    def get_attendee_pass(self, registration):
        attendee_pass = getattr(registration, "attendee_pass", None)
        if attendee_pass is None:
            return None
        return {
            "admits": attendee_pass.admits,
            "issued_at": attendee_pass.issued_at,
            "revoked_at": attendee_pass.revoked_at,
            "admitted": attendee_pass.check_ins.count(),
        }

    def get_audit(self, registration):
        return [
            {
                "action": event.action,
                "actor": event.actor_label,
                "at": event.created_at,
                "data": event.data,
            }
            for event in AuditService.for_object(registration)
        ]


class MemberReviewSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["verified", "rejected"])


class ConfirmManuallySerializer(serializers.Serializer):
    note = serializers.CharField(max_length=500)
    admits = serializers.IntegerField(min_value=1, max_value=500, required=False)


class CancelRegistrationSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)
