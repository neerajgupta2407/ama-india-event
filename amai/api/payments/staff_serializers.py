from rest_framework import serializers

from payments.models import Order, ReconciliationRun


class StaffOrderRowSerializer(serializers.ModelSerializer):
    """One row of the payments list. Needs registration and attempts loaded."""

    registration = serializers.CharField(source="registration.public_id")
    name = serializers.CharField(source="registration.full_name")
    company = serializers.CharField(source="registration.company_name")
    email = serializers.CharField(source="registration.email")
    event = serializers.CharField(source="registration.event.slug")
    attempts = serializers.SerializerMethodField()
    last_error = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "reference",
            "status",
            "amount_minor",
            "currency",
            "registration",
            "name",
            "company",
            "email",
            "event",
            "attempts",
            "last_error",
            "created_at",
            "paid_at",
        ]
        read_only_fields = fields

    def get_attempts(self, order):
        return len(order.attempts.all())

    def get_last_error(self, order):
        failed = [a for a in order.attempts.all() if a.error_description]
        return failed[-1].error_description if failed else ""


class ReconciliationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReconciliationRun
        fields = [
            "id",
            "created_at",
            "finished_at",
            "triggered_by_label",
            "event_slug",
            "orders_checked",
            "matched",
            "recovered",
            "exceptions",
        ]
        read_only_fields = fields
