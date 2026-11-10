from rest_framework import serializers

from core.roles import user_roles


class StaffLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class StaffUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField()
    roles = serializers.SerializerMethodField()

    def get_roles(self, user):
        return sorted(user_roles(user))

    def get_name(self, user):
        return user.get_full_name() or user.email
