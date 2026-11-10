from rest_framework import serializers

from qr.models import CheckIn


class CheckInRequestSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=500)
    gate = serializers.CharField(max_length=40, required=False, allow_blank=True)


def registration_summary(registration):
    """The few fields a gate operator needs. No email or mobile on purpose."""
    return {
        "public_id": registration.public_id,
        "name": registration.full_name,
        "company": registration.company_name,
        "category": registration.ticket_category.name,
        "delegates": registration.delegates,
    }


class RecentCheckInSerializer(serializers.ModelSerializer):
    registration = serializers.SerializerMethodField()
    checked_in_at = serializers.DateTimeField(source="created_at")

    class Meta:
        model = CheckIn
        fields = ["id", "registration", "checked_in_at", "operator_label", "gate"]

    def get_registration(self, check_in):
        return registration_summary(check_in.attendee_pass.registration)


class PublicPassSerializer(serializers.Serializer):
    """What the attendee sees on their own pass page."""

    def to_representation(self, attendee_pass):
        registration = attendee_pass.registration
        event = registration.event
        return {
            "public_id": registration.public_id,
            "name": registration.full_name,
            "company": registration.company_name,
            "category": registration.ticket_category.name,
            "event": {
                "title": event.title,
                "starts_at": event.starts_at,
                "ends_at": event.ends_at,
                "venue": event.venue,
                "city": event.city,
            },
            "admits": attendee_pass.admits,
            "admitted": attendee_pass.check_ins.count(),
            "valid": attendee_pass.revoked_at is None,
        }
