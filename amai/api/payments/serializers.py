from rest_framework import serializers

from payments.models import Order


class OrderStatusSerializer(serializers.ModelSerializer):
    registration = serializers.CharField(source="registration.public_id")

    class Meta:
        model = Order
        fields = [
            "reference",
            "status",
            "registration",
            "amount_minor",
            "currency",
            "paid_at",
        ]
        read_only_fields = fields
