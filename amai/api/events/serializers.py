from rest_framework import serializers

from events.models import Event, TicketCategory


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = [
            "code",
            "name",
            "description",
            "audience",
            "currency",
            "base_amount_minor",
            "gst_rate",
            "requires_member_validation",
        ]


class EventSerializer(serializers.ModelSerializer):
    categories = TicketCategorySerializer(many=True, source="active_categories")
    registration_open = serializers.SerializerMethodField()

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
            "registration_open",
            "categories",
        ]

    def get_registration_open(self, obj):
        return obj.is_registration_open()
