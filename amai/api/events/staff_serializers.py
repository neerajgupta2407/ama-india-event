from decimal import Decimal

from rest_framework import serializers

from events.models import Event, TicketCategory
from payments.services import PaymentService


class StaffCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = [
            "id",
            "code",
            "name",
            "description",
            "audience",
            "currency",
            "base_amount_minor",
            "gst_rate",
            "requires_member_validation",
            "display_order",
            "is_active",
        ]
        # Identity fields are fixed: changing the currency under existing orders would corrupt them.
        read_only_fields = ["id", "code", "audience", "currency"]

    def validate_base_amount_minor(self, value):
        if value <= 0:
            raise serializers.ValidationError("The fee must be more than zero.")
        return value

    def validate_gst_rate(self, value):
        if not Decimal(0) <= value <= Decimal(100):
            raise serializers.ValidationError("GST must be between 0 and 100 percent.")
        return value


class StaffEventSerializer(serializers.ModelSerializer):
    categories = StaffCategorySerializer(many=True, read_only=True)
    registrations = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "slug",
            "title",
            "starts_at",
            "ends_at",
            "venue",
            "city",
            "status",
            "registration_prefix",
            "registration_opens_at",
            "registration_closes_at",
            "online_payment_enabled",
            "early_bird_percent",
            "early_bird_until",
            "group_discount_percent",
            "group_min_delegates",
            "registrations",
            "categories",
        ]
        read_only_fields = fields

    def get_registrations(self, event):
        return event.registrations.count()


class StaffEventSettingsSerializer(serializers.ModelSerializer):
    """The settings AMAI changes during a campaign. Dates, venue and ID prefix are fixed here."""

    class Meta:
        model = Event
        fields = [
            "status",
            "registration_opens_at",
            "registration_closes_at",
            "online_payment_enabled",
            "early_bird_percent",
            "early_bird_until",
            "group_discount_percent",
            "group_min_delegates",
        ]

    def _percent(self, value):
        if not Decimal(0) <= value <= Decimal(100):
            raise serializers.ValidationError("Must be between 0 and 100 percent.")
        return value

    def validate_early_bird_percent(self, value):
        return self._percent(value)

    def validate_group_discount_percent(self, value):
        return self._percent(value)

    def validate_group_min_delegates(self, value):
        if value < 2:
            raise serializers.ValidationError("A group is at least 2 delegates.")
        return value

    def validate(self, attrs):
        if attrs.get("online_payment_enabled") and not PaymentService.provider_ready():
            raise serializers.ValidationError(
                {
                    "online_payment_enabled": "The payment provider keys are not configured on the server."
                }
            )
        opens = attrs.get("registration_opens_at", self.instance.registration_opens_at)
        closes = attrs.get(
            "registration_closes_at", self.instance.registration_closes_at
        )
        if opens and closes and closes <= opens:
            raise serializers.ValidationError(
                {"registration_closes_at": "Registration must close after it opens."}
            )
        # Only judge the early-bird pair when staff are changing it. The seeded state (a percentage
        # with no cutoff yet) means "inactive", and must not block unrelated saves such as
        # switching online payment on.
        early_percent = attrs.get(
            "early_bird_percent", self.instance.early_bird_percent
        )
        early_until = attrs.get("early_bird_until", self.instance.early_bird_until)
        changing_early_bird = (
            early_percent != self.instance.early_bird_percent
            or early_until != self.instance.early_bird_until
        )
        if changing_early_bird and early_percent > 0 and early_until is None:
            raise serializers.ValidationError(
                {
                    "early_bird_until": "Set the early-bird cutoff, or set the early-bird discount to 0."
                }
            )
        return attrs
