from rest_framework import serializers

from core.validators import mobile_validator
from enquiries.choices import EnquiryStatus
from enquiries.models import Enquiry


class EnquiryCreateSerializer(serializers.ModelSerializer):
    mobile = serializers.CharField(max_length=20, validators=[mobile_validator])
    # Honeypot, see core.mixins.HoneypotMixin
    website = serializers.CharField(
        required=False, allow_blank=True, write_only=True, max_length=200
    )

    class Meta:
        model = Enquiry
        fields = ["name", "company_name", "mobile", "email", "message", "website"]

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = [
            "id",
            "name",
            "company_name",
            "mobile",
            "email",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = fields


class EnquiryStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=EnquiryStatus.choices)
