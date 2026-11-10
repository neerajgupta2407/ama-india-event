from rest_framework import serializers

from core.validators import mobile_validator
from events.models import Event, TicketCategory
from registrations.choices import DelegateCount
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
    # Honeypot, see core.mixins.HoneypotMixin
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)


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


class RegistrationSerializer(serializers.ModelSerializer):
    event = serializers.CharField(source="event.slug")
    category = serializers.CharField(source="ticket_category.code")

    class Meta:
        model = Registration
        fields = [
            "id",
            "public_id",
            "event",
            "category",
            "status",
            "member_validation",
            "full_name",
            "company_name",
            "mobile",
            "email",
            "delegates",
            "message",
            "currency",
            "quoted_base_minor",
            "quoted_gst_minor",
            "quoted_total_minor",
            "created_at",
        ]
        read_only_fields = fields
